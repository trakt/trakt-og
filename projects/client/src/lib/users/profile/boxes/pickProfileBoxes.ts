import type { defineProfileBox } from './defineProfileBox.ts';

type Evaluated = Awaited<ReturnType<ReturnType<typeof defineProfileBox>['evaluate']>>;
type Candidate = Pick<Evaluated, 'key' | 'group' | 'floor' | 'score'> & { readonly entry: unknown };

const SLOTS = 4;
const THRESHOLD = 40;
const MAX_NUMBERS = 2;

/**
 * Picks four boxes from every box's score, in registry order:
 *
 * 1. A `pinned` box with a score always shows (About Me, when it's written).
 * 2. Then the best scores of 40 or more, at most two of them `numbers` boxes. Ties go to the earlier box.
 * 3. With no `image` box picked, the best one that can show replaces the lowest pick, or fills a free slot.
 * 4. Floor boxes fill any slot left, with their empty states.
 *
 * The result keeps registry order, so a box that drops out never shuffles the others.
 */
export function pickProfileBoxes<C extends Candidate>(candidates: readonly C[]): NonNullable<C['entry']>[] {
  const showable = candidates.filter((box) => box.entry !== null);
  const ranked = showable
    .filter((box) => box.score !== null && box.group !== 'pinned')
    .toSorted((a, b) => (b.score ?? 0) - (a.score ?? 0) || candidates.indexOf(a) - candidates.indexOf(b));

  const pinned = showable.filter((box) => box.group === 'pinned' && box.score !== null);
  const best = ranked.reduce<readonly C[]>((picks, box) => {
    if (picks.length === SLOTS || (box.score ?? 0) < THRESHOLD) return picks;
    if (box.group === 'numbers' && picks.filter((pick) => pick.group === 'numbers').length === MAX_NUMBERS) {
      return picks;
    }
    return [...picks, box];
  }, pinned);
  const withImage = ensureImage(best, ranked);
  const picks = showable
    .filter((box) => box.floor && !withImage.includes(box))
    .reduce((filled, box) => filled.length < SLOTS ? [...filled, box] : filled, withImage);

  return candidates.flatMap((box) => picks.includes(box) && box.entry ? [box.entry] : []);
}

/** The strip needs a picture: swap the lowest-ranked unpinned pick for the best image box, or add it. */
function ensureImage<C extends Candidate>(picks: readonly C[], ranked: readonly C[]): readonly C[] {
  if (picks.some((pick) => pick.group === 'image')) return picks;
  const image = ranked.find((box) => box.group === 'image');
  if (!image) return picks;
  if (picks.length < SLOTS) return [...picks, image];

  const lowest = ranked.findLast((box) => picks.includes(box));
  return lowest ? picks.map((pick) => pick === lowest ? image : pick) : picks;
}
