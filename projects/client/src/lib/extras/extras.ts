import type { Component } from 'svelte';
import skull from '$lib/icons/solid/skull.svg?raw';
import spider from '$lib/icons/solid/spider.svg?raw';

export type ExtraProps = {
  readonly ondone: () => void;
  /** The keys typed while it loaded, starting with the one that woke it, for an extra that reads keys itself. */
  readonly woke?: string;
  /** Set when the viewer switches a lasting extra off: it plays its way out, then calls `ondone`. */
  readonly stop?: boolean;
  /** The signed-in viewer's username, for an extra that talks to them. */
  readonly viewer?: string;
};

/** A small switch hidden on the page: one click starts the extra, the next ends it. */
type Spot = {
  readonly label: string;
  readonly color: string;
} & (
  | {
      /** The bar it joins as the first segment, found on the page by this selector. It shows only the drawing. */
      readonly leads: string;
      /** A line drawing on a 16 by 16 grid, stroked in `color`. */
      readonly path: string;
    }
  | {
      /** The list row it joins the list right after, found on the page by this selector. It shows the label. */
      readonly follows: string;
    }
  | {
      /** The badge it sits right after, looking like it, found on the page by this selector. */
      readonly beside: string;
      /** The badge's icon, as `$lib/icons` gives it; the label names it for screen readers. */
      readonly icon: string;
    }
  | {
      /** The list it joins as the last tile, like the summary's links out, found on the page by this selector. */
      readonly ends: string;
      /** The tile's icon, as `$lib/icons` gives it; the label names it for screen readers. */
      readonly icon: string;
    }
);

type Extra = {
  /** Loaded on the first match, so pages pay nothing for it. */
  readonly load: () => Promise<{ default: Component<ExtraProps> }>;
} & (
  | {
      /** What to type on the page, e.g. "42". */
      readonly keys: string;
      /** How long a pause between keys can be, for a longer sequence; a second unless given. */
      readonly gap?: number;
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
  'movie:4633': {
    spot: { label: 'Something spooky', color: '#e9e2cf', ends: '.external-links', icon: skull },
    load: () => import('./movie-4633.svelte'),
  },
  'movie:205404': {
    spot: { label: 'Something tingling', color: '#e8132b', beside: '.summary-title .certification', icon: spider },
    load: () => import('./movie-205404.svelte'),
  },
  'show:4583': { keys: '4815162342', gap: 1500, load: () => import('./show-4583.svelte') },
  'show:93720': {
    spot: { label: 'fsociety', color: '#e8343a', follows: 'nav[aria-label$=" sections"] > ul > li:first-child' },
    load: () => import('./show-93720.svelte'),
  },
};
