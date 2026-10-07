import { PLACEHOLDER_AVATAR } from '../components/comments/authorOf.ts';
import type { VipBadge } from '../users/VipBadge.ts';
import { toVipBadge } from '../users/toVipBadge.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { ListSource } from './listSchema.ts';

export type ListCard = {
  readonly id: number;
  readonly href: string;
  readonly name: string;
  readonly owner: {
    readonly name: string;
    readonly href: string;
    readonly avatar: string;
    readonly vip: VipBadge | null;
  };
  /** The description as one plain paragraph, without its Markdown or links. */
  readonly description?: string;
  readonly items: number;
  readonly likes: number;
  /** Left out when the list has comments turned off. */
  readonly comments?: number;
  /** The first six different posters, for the fan; a list of one show's episodes repeats its poster. */
  readonly posters: readonly string[];
};

// Links keep their text, bare URLs and Markdown marks go, and the lines run together.
const plain = (markdown: string) =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** A list as discover's list tile: its poster fan, name, owner, description and counts. */
export function toListCard(list: ListSource): ListCard {
  const slug = list.user.ids?.slug ?? list.user.username;
  return {
    id: list.ids.trakt,
    href: `/lists/${list.ids.trakt}`,
    name: list.name,
    owner: {
      name: list.user.name?.trim() || list.user.username,
      href: `/users/${slug}`,
      avatar: list.user.images?.avatar?.full || PLACEHOLDER_AVATAR,
      vip: toVipBadge(list.user),
    },
    description: plain(list.description ?? '') || undefined,
    items: list.item_count,
    likes: list.likes ?? 0,
    comments: list.allow_comments === false ? undefined : (list.comment_count ?? 0),
    posters: [...new Set(list.images?.posters)].slice(0, 6).flatMap((path) => imageUrl(path, 'thumb') ?? []),
  };
}
