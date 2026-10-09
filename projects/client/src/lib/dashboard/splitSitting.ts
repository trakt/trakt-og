import type { Sitting } from './groupSittings.ts';
import type { SocialItem } from './toSocialItem.ts';

type SplitSitting = { readonly lead: Sitting; readonly rest: Sitting | null };

const newestFirst = (a: SocialItem, b: SocialItem) => Date.parse(b.at) - Date.parse(a.at);

/** Some of a sitting's rows as a sitting of their own, keyed by their newest row the way `groupSittings` keys them. */
function part(sitting: Sitting, items: readonly SocialItem[]): Sitting | null {
  const [newest] = items;
  const oldest = items.at(-1);
  if (!newest || !oldest) return null;

  return { ...sitting, key: `${sitting.member.key}:${newest.key}`, newest: newest.at, oldest: oldest.at, items };
}

/**
 * Splits a sitting for its tile: the lead title (the one watched last, else the one rated or commented on last) with
 * all its rows, and the rest, which stays in the timeline. The rest is null when the lead was the whole sitting.
 */
export function splitSitting(sitting: Sitting): SplitSitting {
  const items = sitting.items.toSorted(newestFirst);
  const lead = (items.find(({ kind }) => kind === 'watch' || kind === 'checkin') ?? items.at(0))?.title.key;

  return {
    lead: part(sitting, items.filter(({ title }) => title.key === lead)) ?? sitting,
    rest: part(sitting, items.filter(({ title }) => title.key !== lead)),
  };
}
