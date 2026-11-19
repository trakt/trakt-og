import { countLabel } from '../utils/countLabel.ts';
import { memberPageHref } from './memberPageHref.ts';
import type { SocialWindow } from './socialWindows.ts';
import type { SocialItem, SocialMember } from './toSocialItem.ts';

/** One person's part in a title: when they last did something with it, and what, as the comment tags show it. */
export type SocialDetail = {
  readonly member: SocialMember;
  /** Their latest activity on the title. */
  readonly at: string;
  /** What they watched: an episode's "3x04", "3 episodes", or "Watched" for a movie. */
  readonly watched?: string;
  /** Their history for the period, limited to the title: where the watched tag goes. */
  readonly history?: string;
  /** Their latest rating, of the title or one of its episodes. */
  readonly rating?: number;
  readonly comment?: { readonly href: string; readonly review: boolean };
  /** On a person's details, which title the row is about. */
  readonly title?: { readonly name: string; readonly href: string; readonly poster?: string };
};

const isWatch = (item: SocialItem) => item.kind === 'watch' || item.kind === 'checkin';

function watchedOf(items: readonly SocialItem[]): string | undefined {
  const watches = items.filter(isWatch);
  if (watches.length === 0) return undefined;
  const codes = [...new Set(watches.flatMap(({ code }) => (code ? [code] : [])))];
  if (codes.length === 0) return 'Watched';
  return codes.length === 1 ? codes[0] : countLabel(codes.length, 'episode');
}

/** Each person on one title in the windows, the most recently active first, with what they did. */
export function toSocialDetails(
  items: readonly SocialItem[],
  windows: readonly SocialWindow[],
): readonly SocialDetail[] {
  const newest = items.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const byMember = Map.groupBy(newest, ({ member }) => member.key);

  return [...byMember.values()].flatMap((theirs): SocialDetail[] => {
    const [latest] = theirs;
    if (!latest) return [];
    const rating = theirs.find((item) => item.kind === 'rating' && item.rating)?.rating;
    const comment = theirs.find((item) => item.comment)?.comment;
    const watched = watchedOf(theirs);
    const history = watched && memberPageHref(latest.member, windows, 'history', latest.title.target);
    return [
      {
        member: latest.member,
        at: latest.at,
        ...(watched && { watched }),
        ...(history && { history }),
        ...(rating && { rating }),
        ...(comment && { comment: { href: comment.href, review: theirs.some(({ kind }) => kind === 'review') } }),
      },
    ];
  });
}

/** One person's titles in the windows, the most recent first, each with what they did with it. */
export function toTitleDetails(
  items: readonly SocialItem[],
  windows: readonly SocialWindow[],
): readonly SocialDetail[] {
  const newest = items.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return [...Map.groupBy(newest, ({ title }) => title.key).values()].flatMap((theirs) => {
    const [detail] = toSocialDetails(theirs, windows);
    const title = theirs[0]?.title;
    if (!detail || !title) return [];
    return [
      { ...detail, title: { name: title.name, href: title.href, ...(title.poster && { poster: title.poster }) } },
    ];
  });
}
