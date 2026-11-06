import type { Snippet } from 'svelte';

/** Any tooltip body, for a component that passes one through to `Tooltip`: text or markup. */
export type TooltipContent = string | Snippet;
