import { progressTypeGroups } from './progressTypeGroups.ts';
import type { ProgressType } from './progressTypes.ts';

/** The status dropdown header the tab sits under: "Shows" or "Movies". */
export const progressTypeGroup = (type: ProgressType): string =>
  progressTypeGroups.find(({ types }) => types.includes(type))?.label ?? 'Shows';
