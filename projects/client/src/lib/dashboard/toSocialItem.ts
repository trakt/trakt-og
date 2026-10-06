import { PLACEHOLDER_AVATAR } from '../components/comments/authorOf.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { SocialActivity } from './socialActivitySchema.ts';
import { toSocialMedia } from './toSocialMedia.ts';

export type SocialMember = {
  /** Groups a member's rows: the username, which deleted members keep too. */
  readonly key: string;
  readonly name: string;
  /** Left out for a deleted member, whose name isn't a link. */
  readonly slug?: string;
  readonly href?: string;
  readonly avatar: string;
};

/** One watch, rating or comment in the Social Feed. */
export type SocialItem = {
  /** Unique across kinds, which come from different tables: `watch:12`, `rating:12`. */
  readonly key: string;
  readonly at: string;
  /** The clock time in the viewer's zone: "1:10 AM". */
  readonly time: string;
  readonly member: SocialMember;
  readonly kind: 'watch' | 'checkin' | 'rating' | 'comment' | 'review';
  /** The movie or the show, with its poster path. `key` groups a sitting's rows by title. */
  readonly title: { readonly key: string; readonly name: string; readonly href: string; readonly poster?: string };
  /** Set for episodes, so a sitting can say "1x06–1x08". */
  readonly episode?: { readonly season: number; readonly number: number };
  /** "1x08", "Special 2", "Season 2". Left out for a movie or a whole show. */
  readonly code?: string;
  /** The title and code: "Lanterns 1x08". */
  readonly label: string;
  /** The movie, show, season or episode page. */
  readonly href: string;
  /** An image path from the API: the episode's screenshot, else the show's or movie's fanart. */
  readonly still?: string;
  /** 1 to 10, on a rating. */
  readonly rating?: number;
  /** On a comment or review. */
  readonly comment?: {
    readonly id: number;
    readonly body: string;
    readonly spoiler: boolean;
    readonly likes: number;
    readonly replies: number;
    readonly href: string;
  };
};

function memberOf(user: SocialActivity['user']): SocialMember {
  if (user.deleted || !user.ids.slug) return { key: user.username, name: 'Deleted', avatar: PLACEHOLDER_AVATAR };

  const { slug } = user.ids;
  const avatar = user.images?.avatar.full ?? PLACEHOLDER_AVATAR;
  return { key: user.username, name: user.name?.trim() || user.username, slug, href: `/users/${slug}`, avatar };
}

function kindOf(activity: SocialActivity): Pick<SocialItem, 'kind' | 'rating' | 'comment'> {
  if (activity.action === 'rating') return { kind: 'rating', rating: activity.rating };
  if (activity.action === 'watch') return { kind: activity.method === 'checkin' ? 'checkin' : 'watch' };

  const { id, comment: body, spoiler, review, likes, replies } = activity.comment;
  return {
    kind: review ? 'review' : 'comment',
    comment: { id, body, spoiler, likes, replies, href: `/comments/${id}` },
  };
}

/** A feed row as the panel shows it, with its clock time in the viewer's zone. */
export function toSocialItem(activity: SocialActivity, { timeZone, hour24 }: DatePreferences): SocialItem {
  const media = toSocialMedia(activity);
  return {
    key: `${activity.action}:${activity.id}`,
    at: activity.activity_at,
    time: new Date(activity.activity_at).toLocaleTimeString('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: hour24 ? 'h23' : 'h12',
    }),
    member: memberOf(activity.user),
    ...media,
    label: media.code ? `${media.title.name} ${media.code}` : media.title.name,
    ...kindOf(activity),
  };
}
