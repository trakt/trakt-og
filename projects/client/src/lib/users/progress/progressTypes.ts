/**
 * The progress tabs, in the dropdown's order. Watching (the `watched` tab) is every show you've started, minus the ones you dropped;
 * Rewatching narrows it to the shows you're rewatching; Dropped is the shows you dropped. All three read the `watched`
 * progress settings.
 */
export const progressTypes = {
  watched: { label: 'Watching' },
  rewatching: { label: 'Rewatching' },
  dropped: { label: 'Dropped' },
} as const;

export type ProgressType = keyof typeof progressTypes;

export const isProgressType = (value: string): value is ProgressType => Object.hasOwn(progressTypes, value);
