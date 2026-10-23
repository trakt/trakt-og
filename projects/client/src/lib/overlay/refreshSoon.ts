import { createRefreshSoon } from './createRefreshSoon.ts';
import { overlay } from './overlay.ts';

/** A burst of watches downloads the history once, after the last one. */
export const refreshSoon = createRefreshSoon(() => overlay.refresh());
