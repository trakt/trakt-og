import type { MatchLevel } from './MatchLevel.ts';

// v3's ladder (trakt-web's matchLabel), highest first.
const LEVELS: readonly (MatchLevel & { readonly from: number })[] = [
  { from: 90, key: 'soulmates', label: 'Soulmates', line: 'Practically the same taste. Go compare notes.' },
  { from: 75, key: 'co-stars', label: 'Co-stars', line: 'You would share top billing. Big overlap in what you love.' },
  { from: 60, key: 'crossover', label: 'Crossover', line: 'Your worlds collide often. Plenty in common.' },
  { from: 45, key: 'spin-off', label: 'Spin-off', line: 'Same roots, different directions.' },
  { from: 25, key: 'cameo', label: 'Cameo', line: "You turn up in each other's taste now and then." },
  {
    from: 0,
    key: 'different-universe',
    label: 'Different universe',
    line: 'Very different tastes. A good place to find something new.',
  },
];

/** The level a 0 to 100 match score lands on. */
export function toMatchLevel(score: number): MatchLevel {
  const { key, label, line } = LEVELS.find(({ from }) => score >= from) ?? LEVELS[LEVELS.length - 1]!;
  return { key, label, line };
}
