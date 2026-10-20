/** How a member's share of a show reads on their tag: seen it all (rewatches too), half or more, or less than half. */
export function progressTone(percent: number): 'complete' | 'half' | 'started' {
  if (percent >= 100) return 'complete';
  if (percent >= 50) return 'half';
  return 'started';
}
