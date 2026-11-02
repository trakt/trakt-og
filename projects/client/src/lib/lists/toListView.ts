import type { ListResponse } from '@trakt/api';
import { listPath } from './listPath.ts';
import type { ListKind } from './listTypeOptions.ts';
import type { ListSort } from './resolveListSort.ts';

/** The list a list page shows: from `/users/:id/lists/:list` or `/lists/:id`, or built for a watchlist or favorites. */
export interface ListView {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  /** Its canonical og URL. */
  readonly href: string;
  readonly kind: ListKind;
  readonly ownerSlug: string;
  /** "Private" or "Following", and "Smart" once it's been turned into a smart list. */
  readonly pills: readonly string[];
  /** For the owner: the app that kept it updated stopped syncing it, so it could become a smart list. */
  readonly staleOrigin?: { readonly name: string };
  /** Shared by link: the blue "Link" pill. */
  readonly shareLink: boolean;
  readonly isPublic: boolean;
  /** The owner's "Display Rank": the rank badge over each poster. */
  readonly displayNumbers: boolean;
  readonly allowComments: boolean;
  readonly itemCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  /** The owner's default sort. */
  readonly sort: ListSort;
}

type ListSource = Pick<
  ListResponse,
  | 'name'
  | 'description'
  | 'privacy'
  | 'type'
  | 'display_numbers'
  | 'allow_comments'
  | 'sort_by'
  | 'sort_how'
  | 'item_count'
  | 'comment_count'
  | 'likes'
  | 'ids'
  | 'stale_origin'
  | 'converted_to'
> & { readonly user: { readonly username: string; readonly ids: { readonly slug?: string | null } } };

// a link list is private too, and friends-only reads "Following".
function privacyPills(privacy: string): readonly string[] {
  if (privacy === 'private' || privacy === 'link') return ['Private'];
  if (privacy === 'friends') return ['Following'];
  return [];
}

/** A list response as the list page's view of it. */
export function toListView(list: ListSource): ListView {
  const ownerSlug = list.user.ids.slug ?? list.user.username;
  const official = list.type === 'official';
  return {
    id: list.ids.trakt,
    slug: list.ids.slug,
    name: list.name,
    ...(list.description?.trim() && { description: list.description.trim() }),
    href: listPath(list),
    kind: official ? 'official' : 'personal',
    ownerSlug,
    pills: [...(list.converted_to ? ['Smart'] : []), ...privacyPills(list.privacy)],
    ...(list.stale_origin && !list.converted_to && { staleOrigin: { name: list.stale_origin.name } }),
    shareLink: list.privacy === 'link',
    isPublic: list.privacy === 'public',
    displayNumbers: list.display_numbers,
    allowComments: list.allow_comments,
    itemCount: list.item_count,
    likeCount: list.likes,
    commentCount: list.comment_count,
    sort: { by: list.sort_by, how: list.sort_how === 'desc' ? 'desc' : 'asc' },
  };
}
