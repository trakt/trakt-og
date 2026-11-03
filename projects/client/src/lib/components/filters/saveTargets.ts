import thumbtack from '$lib/icons/solid/thumbtack.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';

/** What a filters Save keeps them as: a chart's smart list, or a calendar's saved filter in this browser. */
export const SAVE_TARGETS = {
  'smart-list': { label: 'Save as a smart list', svg: sparkles, noun: 'smart list' },
  filters: { label: 'Save filters', svg: thumbtack, noun: 'filter' },
} as const;

export type SaveTarget = keyof typeof SAVE_TARGETS;
