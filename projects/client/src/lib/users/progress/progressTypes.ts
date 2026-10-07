/**
 * The progress tabs, in the dropdown's order. Watched is every show you've started, minus the ones you dropped;
 * Rewatching narrows it to the shows you're rewatching; Dropped is the shows you dropped. All three read the `watched`
 * progress settings.
 */
export const progressTypes = {
  watched: { label: 'Watched' },
  rewatching: { label: 'Rewatching' },
  dropped: { label: 'Dropped' },
} as const;

export type ProgressType = keyof typeof progressTypes;

export const isProgressType = (value: string): value is ProgressType => Object.hasOwn(progressTypes, value);
