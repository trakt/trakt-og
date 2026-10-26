import type { Component } from 'svelte';

export type ExtraProps = {
  readonly ondone: () => void;
  /** The keys typed while it loaded, starting with the one that woke it, for an extra that reads keys itself. */
  readonly woke?: string;
  /** Set when the viewer switches a lasting extra off: it plays its way out, then calls `ondone`. */
  readonly stop?: boolean;
};

/** A small switch hidden on the page: one click starts the extra, the next ends it. */
type Spot = {
  /** A line drawing on a 16 by 16 grid, stroked in `color`. */
  readonly path: string;
  readonly label: string;
  readonly color: string;
  /** The bar it joins as the first segment, found on the page by this selector. */
  readonly leads: string;
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
  | {
      readonly spot: Spot;
    }
);

/** Keyed by `<type>:<trakt id>`. Each one lives in its own file named the same way. */
export const extras: Readonly<Record<string, Extra>> = {
  'movie:74': { keys: '88', load: () => import('./movie-74.svelte') },
  'show:104439': { wakes: /^[a-z]$/i, load: () => import('./show-104439.svelte') },
  'movie:12601': {
    spot: {
      path: 'M1.5 1.5h13v13h-13zM5.8 1.5v13M10.2 1.5v13M1.5 5.8h13M1.5 10.2h13',
      label: 'Something glowing',
      color: '#6ff3ff',
      leads: '.summary-title .title-tags',
    },
    load: () => import('./movie-12601.svelte'),
  },
};
