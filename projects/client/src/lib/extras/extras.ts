import type { Component } from 'svelte';

export type ExtraProps = {
  readonly ondone: () => void;
};

type Extra = {
  /** What to type on the page, e.g. "42". */
  readonly keys: string;
  /** Loaded on the first match, so pages pay nothing for it. */
  readonly load: () => Promise<{ default: Component<ExtraProps> }>;
};

/** Keyed by `<type>:<trakt id>`. Each one lives in its own file named the same way. */
export const extras: Readonly<Record<string, Extra>> = {
  'movie:74': { keys: '88', load: () => import('./movie-74.svelte') },
};
