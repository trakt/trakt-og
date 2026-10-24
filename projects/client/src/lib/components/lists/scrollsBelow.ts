/** Whether a scrolling box has more content below what it shows, so its bottom edge should fade. */
export function scrollsBelow({
  scrollTop,
  clientHeight,
  scrollHeight,
}: Readonly<{ scrollTop: number; clientHeight: number; scrollHeight: number }>): boolean {
  // Browsers round scroll positions, so the last pixel counts as the end.
  return scrollHeight - (scrollTop + clientHeight) > 1;
}
