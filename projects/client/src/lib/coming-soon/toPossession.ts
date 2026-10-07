interface Spot {
  x: number;
  y: number;
}

interface PossessionParams {
  /** The word the spirits spell back. */
  answer: string;
  /** Where each letter sits on the board. */
  letters: ReadonlyArray<Spot & { letter: string }>;
  /** Where YES sits; the spirits always confirm first. */
  yes: Spot;
}

export interface PossessionStep extends Spot {
  /** The letter the planchette lands on, or null for YES. */
  letter: string | null;
}

/** The planchette's path when the spirits take over: YES, then each letter of their answer. */
export function toPossession({ answer, letters, yes }: PossessionParams): ReadonlyArray<PossessionStep> {
  const spots = [...answer].flatMap((letter) => {
    const spot = letters.find((candidate) => candidate.letter === letter);
    return spot ? [{ letter, x: spot.x, y: spot.y }] : [];
  });
  return [{ letter: null, ...yes }, ...spots];
}
