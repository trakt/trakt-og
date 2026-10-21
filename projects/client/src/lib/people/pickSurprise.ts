/** A birthday's surprise: a Known For character crashes in, or the Known For hearts float off as balloons. */
export type BirthdaySurprise = 'crasher' | 'balloons';

type PickSurpriseParams = {
  /** 0 up to 1, so a test can pin it. */
  readonly random: () => number;
  /** Both surprises are motion, so there's none with reduced motion. */
  readonly reducedMotion: boolean;
  /** Both need Known For posters. */
  readonly knownFor: number;
};

/** One surprise at random, or none when the page can't play one. */
export function pickSurprise({ random, reducedMotion, knownFor }: PickSurpriseParams): BirthdaySurprise | undefined {
  if (reducedMotion || knownFor === 0) return undefined;
  return random() < 0.5 ? 'crasher' : 'balloons';
}
