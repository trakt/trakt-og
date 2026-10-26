import type { Component } from 'svelte';

export type ExtraProps = {
  readonly ondone: () => void;
  /** The keys typed while it loaded, starting with the one that woke it, for an extra that reads keys itself. */
  readonly woke?: string;
};

type Extra = {
  /** Loaded on the first match, so pages pay nothing for it. */
  readonly load: () => Promise<{ default: Component<ExtraProps> }>;
} & (
  | {
      /** What to type on the page, e.g. "42". */
      readonly keys: string;
    }
  | {
      /** Any key like this wakes it, and it reads the keys typed after that itself. */
      readonly wakes: RegExp;
    }
);

/** Keyed by `<type>:<trakt id>`. Each one lives in its own file named the same way. */
export const extras: Readonly<Record<string, Extra>> = {
  'movie:74': { keys: '88', load: () => import('./movie-74.svelte') },
  'show:104439': { wakes: /^[a-z]$/i, load: () => import('./show-104439.svelte') },
};
