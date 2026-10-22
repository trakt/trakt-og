import { PLACEHOLDER_AVATAR } from '../components/comments/authorOf.ts';
import { toVipBadge } from '../users/toVipBadge.ts';
import type { VipBadge } from '../users/VipBadge.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { ListKind } from './ListKind.ts';
import { listPath } from './listPath.ts';
import { privacyPills } from './privacyPills.ts';

/**
 * Any list the API sends: a typed `ListResponse`, a parsed `/users/:id/lists` or `/:type/:id/lists` row, or a search
 * hit's list, which carries no privacy.
 */
export type ListRowSource = {
  readonly name: string;
  readonly description?: string | null;
  readonly privacy?: string | null;
  readonly type?: string | null;
  readonly allow_comments?: boolean | null;
  readonly item_count: number;
  readonly comment_count?: number | null;
  readonly likes?: number | null;
  readonly ids: { readonly trakt: number; readonly slug?: string | null };
  readonly user: {
    readonly username: string;
    readonly name?: string | null;
    readonly ids: { readonly slug?: string | null };
    readonly images?: { readonly avatar?: { readonly full?: string | null } | null } | null;
    /** Every list read sends these on its owner, so the row shows their VIP label without asking for it. */
    readonly vip?: boolean | null;
    readonly vip_ep?: boolean | null;
    readonly vip_og?: boolean | null;
    readonly vip_years?: number | null;
    readonly director?: boolean | null;
  };
  readonly images?: { readonly posters?: readonly string[] | null } | null;
};

/** What a list row shows for one list. */
export interface ListRow {
  readonly key: string;
  readonly id: number;
  readonly kind: ListKind;
  readonly href: string;
  readonly name: string;
  readonly owner: {
    readonly slug: string;
    readonly name: string;
    readonly href: string;
    readonly avatar: string;
    readonly vip: VipBadge | null;
  };
  readonly posters: readonly { readonly title?: string; readonly image?: string }[];
  readonly itemCount: number;
  /** Left out for a watchlist or favorites, which can't be liked. */
  readonly likeCount?: number;
  /** Left out when the list has comments turned off. */
  readonly commentCount?: number;
  /** "Private", "Following" or "Official List". */
  readonly pills: readonly string[];
  readonly description?: string;
}

const KINDS: readonly ListKind[] = ['official', 'watchlist', 'favorites'];

function kindOf(type: string | null | undefined): ListKind {
  return KINDS.find((kind) => kind === type) ?? 'personal';
}

function pills(list: ListRowSource, kind: ListKind): readonly string[] {
  return kind === 'official' ? ['Official List'] : privacyPills(list.privacy);
}

function href(list: ListRowSource, kind: ListKind): string {
  const slug = list.ids.slug ?? String(list.ids.trakt);
  return listPath({ type: kind, ids: { slug }, user: list.user });
}

/**
 * One list as a list row: five posters, the owner, the counts and the description. A watchlist is always called
 * "Watchlist", and neither it nor favorites show likes.
 */
export function toListRow(list: ListRowSource): ListRow {
  const kind = kindOf(list.type);
  const ownerSlug = list.user.ids.slug ?? list.user.username;
  const likeable = kind !== 'watchlist' && kind !== 'favorites';

  return {
    key: `list-${list.ids.trakt}`,
    id: list.ids.trakt,
    kind,
    href: href(list, kind),
    name: kind === 'watchlist' ? 'Watchlist' : list.name,
    owner: {
      slug: ownerSlug,
      name: list.user.name?.trim() || list.user.username,
      href: `/users/${ownerSlug}`,
      avatar: list.user.images?.avatar?.full || PLACEHOLDER_AVATAR,
      vip: toVipBadge(list.user),
    },
    posters: (list.images?.posters ?? []).slice(0, 5).map((path) => ({ image: imageUrl(path, 'thumb') })),
    itemCount: list.item_count,
    likeCount: likeable ? list.likes ?? 0 : undefined,
    commentCount: list.allow_comments ? list.comment_count ?? 0 : undefined,
    pills: pills(list, kind),
    description: list.description?.trim() || undefined,
  };
}
