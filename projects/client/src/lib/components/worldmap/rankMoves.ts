/** How far each country climbed (above 0) or fell (below 0) between two rankings; unmoved and new ones are left out. */
export function rankMoves(before: readonly string[], after: readonly string[]): ReadonlyMap<string, number> {
  const was = new Map(before.map((code, index) => [code, index]));
  return new Map(
    after.flatMap((code, index) => {
      const old = was.get(code);
      return old === undefined || old === index ? [] : [[code, old - index] as const];
    }),
  );
}
