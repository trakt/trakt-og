import type { PersonCredit } from './PersonCredit.ts';

// A long run counts for more than a cameo, but not so much that a voice role in a cartoon beats a famous film.
const EPISODE_CAP = 20;

/** How well known a credit is: its votes in thousands, plus its episodes up to a full season's worth. */
export const creditFame = (credit: PersonCredit) =>
  credit.sortBy.votes / 1000 + Math.min(credit.episodeCount, EPISODE_CAP);
