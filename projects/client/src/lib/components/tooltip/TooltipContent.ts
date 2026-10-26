import type { Snippet } from 'svelte';
import type { StatTip } from './StatTip.ts';

/** Any tooltip body, for a component that passes one through to `Tooltip`: text, stats or markup. */
export type TooltipContent = string | readonly StatTip[] | Snippet;
