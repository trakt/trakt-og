import type { defineProfileBox } from './defineProfileBox.ts';

type Evaluated = Awaited<ReturnType<ReturnType<typeof defineProfileBox>['evaluate']>>;
type Candidate = Pick<Evaluated, 'key' | 'group' | 'pinned' | 'at' | 'fallback' | 'floor' | 'score'> & {
  readonly entry: unknown;
};

const SLOTS = 4;
const THRESHOLD = 40;
const MAX_NUMBERS = 2;

/**
 * Picks four boxes from every box's score, in registry order:
 *
 * 1. A `pinned` box with a score always shows (About Me when it's written, and Watch Time).
 * 2. Then the best scores of 40 or more, at most two `numbers` boxes in all, pinned ones included. Ties go to the
 *    earlier box.
 * 3. With no `image` box picked, the best one that can show replaces the lowest pick, or fills a free slot.
 * 4. A `fallback` box with a score takes a slot still free, within the numbers limit (Ratings).
 * 5. Floor boxes fill any slot left, with their empty states.
 *
 * The strip keeps registry order, so a box that drops out never shuffles the others, except that a box with an `at`
 * takes that place (or the last, in a shorter strip). `more` is the next four scored boxes, best first, in registry
 * order too, for the strip's More row.
 */
export function pickProfileBoxes<C extends Candidate>(
  candidates: readonly C[],
): { shown: NonNullable<C['entry']>[]; more: NonNullable<C['entry']>[] } {
  const showable = candidates.filter((box) => box.entry !== null);
  const ranked = showable
    .filter((box) => box.score !== null && !box.pinned && !box.fallback)
    .toSorted((a, b) => (b.score ?? 0) - (a.score ?? 0) || candidates.indexOf(a) - candidates.indexOf(b));

  const pinned = showable.filter((box) => box.pinned && box.score !== null);
  const best = ranked.reduce<readonly C[]>(
    (picks, box) => ((box.score ?? 0) < THRESHOLD ? picks : add(picks, box)),
    pinned,
  );
  const withImage = ensureImage(best, ranked);
  const withFallback = showable.filter((box) => box.fallback && box.score !== null).reduce(add, withImage);
  const picks = showable
    .filter((box) => box.floor && !withFallback.includes(box))
    .reduce((filled, box) => (filled.length < SLOTS ? [...filled, box] : filled), withFallback);

  const ordered = candidates.filter((box) => picks.includes(box) && box.entry);
  const placed = ordered.filter((box) => box.at === undefined);
  for (const box of ordered.filter((box) => box.at !== undefined)) {
    placed.splice(Math.min(box.at ?? 0, placed.length), 0, box);
  }
  const extra = showable
    .filter((box) => box.score !== null && !picks.includes(box))
    .toSorted((a, b) => (b.score ?? 0) - (a.score ?? 0) || candidates.indexOf(a) - candidates.indexOf(b))
    .slice(0, SLOTS);
  const entries = (boxes: readonly C[]) => boxes.flatMap((box) => (box.entry ? [box.entry] : []));
  return { shown: entries(placed), more: entries(candidates.filter((box) => extra.includes(box))) };
}

/** Adds a box while a slot is free, keeping to two `numbers` boxes. */
function add<C extends Candidate>(picks: readonly C[], box: C): readonly C[] {
  if (picks.length === SLOTS) return picks;
  if (box.group === 'numbers' && picks.filter((pick) => pick.group === 'numbers').length === MAX_NUMBERS) return picks;
  return [...picks, box];
}

/** The strip needs a picture: swap the lowest-ranked unpinned pick for the best image box, or add it. */
function ensureImage<C extends Candidate>(picks: readonly C[], ranked: readonly C[]): readonly C[] {
  if (picks.some((pick) => pick.group === 'image')) return picks;
  const image = ranked.find((box) => box.group === 'image');
  if (!image) return picks;
  if (picks.length < SLOTS) return [...picks, image];

  const lowest = ranked.findLast((box) => picks.includes(box));
  return lowest ? picks.map((pick) => (pick === lowest ? image : pick)) : picks;
}
