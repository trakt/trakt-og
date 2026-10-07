interface Point {
  x: number;
  y: number;
}

interface ArcLettersParams {
  letters: string;
  /** A quadratic curve: start, control and end points in the board's SVG units. */
  from: Point;
  control: Point;
  to: Point;
}

export interface ArcLetter extends Point {
  letter: string;
  /** Degrees, so the letter leans with the curve. */
  angle: number;
}

/**
 * Lays letters evenly along a Ouija board's arc. Each letter is its own element so the planchette can hover it,
 * which one `<textPath>` can't do.
 */
export function toArcLetters({ letters, from, control, to }: ArcLettersParams): ReadonlyArray<ArcLetter> {
  const count = [...letters].length;
  return [...letters].map((letter, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const u = 1 - t;
    const x = u * u * from.x + 2 * u * t * control.x + t * t * to.x;
    const y = u * u * from.y + 2 * u * t * control.y + t * t * to.y;
    const dx = 2 * u * (control.x - from.x) + 2 * t * (to.x - control.x);
    const dy = 2 * u * (control.y - from.y) + 2 * t * (to.y - control.y);
    return { letter, x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  });
}
