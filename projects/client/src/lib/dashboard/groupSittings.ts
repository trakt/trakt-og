import type { SocialItem, SocialMember } from './toSocialItem.ts';

/** One member's sitting: their rows, newest first, each at most 6 hours before the one after it, 24 hours at most. */
export type Sitting = {
  /** The member and their newest row, so a sitting keeps its key as older rows join it. */
  readonly key: string;
  readonly member: SocialMember;
  readonly newest: string;
  readonly oldest: string;
  readonly items: readonly SocialItem[];
};

const HOUR_MS = 3_600_000;
const GAP_MS = 6 * HOUR_MS;
const SPAN_MS = 24 * HOUR_MS;

const fits = (sitting: Sitting, at: number) =>
  Date.parse(sitting.oldest) - at <= GAP_MS && Date.parse(sitting.newest) - at <= SPAN_MS;

/**
 * Groups feed rows (newest first) into sittings, in the order each one started. Other members' rows in between don't
 * split a sitting, and rows from an older page only extend a member's last sitting or start new ones after it, so
 * nothing already shown moves.
 */
export function groupSittings(items: readonly SocialItem[]): readonly Sitting[] {
  return items.reduce<readonly Sitting[]>((sittings, item) => {
    const index = sittings.findLastIndex(({ member }) => member.key === item.member.key);
    const open = sittings.at(index);
    if (index >= 0 && open && fits(open, Date.parse(item.at))) {
      return sittings.with(index, { ...open, oldest: item.at, items: [...open.items, item] });
    }

    const key = `${item.member.key}:${item.key}`;
    return [...sittings, { key, member: item.member, newest: item.at, oldest: item.at, items: [item] }];
  }, []);
}
