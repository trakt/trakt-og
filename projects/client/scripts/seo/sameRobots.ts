const tokens = (robots: string) =>
  robots
    .toLowerCase()
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .toSorted();

/** Whether two robots values hold the same directives, in any order and spacing. */
export function sameRobots(actual: string, expected: string): boolean {
  return tokens(actual).join(',') === tokens(expected).join(',');
}
