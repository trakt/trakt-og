/** A step on v3's match ladder: its key (for the level's color and icon), its name and a line about it. */
export interface MatchLevel {
  readonly key: 'soulmates' | 'co-stars' | 'crossover' | 'spin-off' | 'cameo' | 'different-universe';
  readonly label: string;
  readonly line: string;
}
