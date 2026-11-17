/**
 * A history read's `start_at` that keeps every play: MySQL's earliest date. The API counts the plays it pages only
 * when a read has a start date. Without one it sums a per-show counter that can run far over, so the item count is off
 * and the last pages come up empty.
 */
export const EVERY_PLAY = '1000-01-01T00:00:00.000Z';
