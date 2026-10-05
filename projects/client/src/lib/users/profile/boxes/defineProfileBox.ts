import type { Component } from 'svelte';
import type { boxExtraLoader } from './boxExtraLoader.ts';
import type { BoxFrame } from './BoxFrame.ts';
import type { BoxInput } from './BoxInput.ts';

type ExtraLoader = ReturnType<typeof boxExtraLoader>;
type ExtraContext = Parameters<typeof boxExtraLoader>[0];

/**
 * How the picker treats a box: a `pinned` box always shows when it has something to say, at most two `numbers` boxes
 * show, and at least one `image` box when any can.
 */
type BoxGroup = 'pinned' | 'image' | 'numbers' | 'colour';

type ProfileBoxDefinition<K extends string, V, E> = {
  readonly key: K;
  readonly group: BoxGroup;
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
  const { key, group, floor = false, extra, score, view, component } = definition;
  const extraFor = (frame: BoxFrame, loader: ExtraLoader) =>
    extra?.when(frame) ? loader(extra.load) : Promise.resolve(undefined);

  return {
    key,
    group,
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
        floor,
        score: points === null ? null : Math.round(points),
        entry: mapped === null ? null : { key, view: mapped },
      };
    },
  };
}
