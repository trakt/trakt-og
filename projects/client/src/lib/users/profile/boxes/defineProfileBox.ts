import type { Component } from 'svelte';
import type { boxExtraLoader } from './boxExtraLoader.ts';
import type { BoxFrame } from './BoxFrame.ts';
import type { BoxInput } from './BoxInput.ts';

type ExtraLoader = ReturnType<typeof boxExtraLoader>;
type ExtraContext = Parameters<typeof boxExtraLoader>[0];

/** How the picker treats a box: at most two `numbers` boxes show, and at least one `image` box when any can. */
type BoxGroup = 'image' | 'numbers' | 'colour';

type ProfileBoxDefinition<K extends string, V, E> = {
  readonly key: K;
  readonly group: BoxGroup;
  /** Always shows when it has a score, ahead of the ranking: About Me when it's written, and Watch Time. */
  readonly pinned?: boolean;
  /** Its place in the strip, from 0, whatever the registry order: Watch Time is always third. */
  readonly at?: number;
  /** Left out of the ranking, it only fills a slot nothing else clears the bar for: Ratings, which the profile shows
   * in full further down. */
  readonly fallback?: boolean;
  /** One of the boxes that fill the strip when fewer than four score high enough. Its view must handle no data. */
  readonly floor?: boolean;
  /**
   * A request beyond what the profile loads, and when it's worth making. `when` sees only the frame's data, so the
   * request runs alongside the page's own. Boxes that pass the same `load` share one request.
   */
  readonly extra?: {
    readonly load: (context: ExtraContext) => Promise<E>;
    readonly when: (frame: BoxFrame) => boolean;
  };
  /** 0 to 100, or `null` when the box has nothing to show. */
  readonly score: (input: BoxInput, extra: E | undefined) => number | null;
  /** The view model, or `null` when there's nothing to show. A floor box always returns one. */
  readonly view: (input: BoxInput, extra: E | undefined) => V | null;
  readonly component: Component<{ view: V }>;
};

/**
 * One profile box type, ready for the registry. `evaluate` scores it and maps its view in one go, so the key and the
 * view stay paired in the types all the way to the page.
 */
export function defineProfileBox<K extends string, V, E = never>(definition: ProfileBoxDefinition<K, V, E>) {
  const { key, group, pinned = false, at, fallback = false, floor = false, extra, score, view, component } = definition;
  const extraFor = (frame: BoxFrame, loader: ExtraLoader) =>
    extra?.when(frame) ? loader(extra.load) : Promise.resolve(undefined);

  return {
    key,
    group,
    pinned,
    at,
    fallback,
    floor,
    component,
    /** Starts the extra request early, if this profile could use it. */
    prefetch: (frame: BoxFrame, loader: ExtraLoader) => void extraFor(frame, loader),
    evaluate: async (input: BoxInput, loader: ExtraLoader) => {
      const data = await extraFor(input, loader);
      const mapped = view(input, data);
      const points = score(input, data);
      return {
        key,
        group,
        pinned,
        at,
        fallback,
        floor,
        score: points === null ? null : Math.round(points),
        entry: mapped === null ? null : { key, view: mapped },
      };
    },
  };
}
