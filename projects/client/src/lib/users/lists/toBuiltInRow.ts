import type { z } from 'zod/v4';
import { builtInListDescriptions } from '../../lists/toBuiltInListView.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import { listMoviesOnly } from '../../lists/listMoviesOnly.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import type { listItemsSchema } from './listItemsSchema.ts';
import type { UserListRow } from './UserListRow.ts';

type ListItem = z.infer<typeof listItemsSchema>[number];

type BuiltInRowParams = {
  kind: 'watchlist' | 'favorites';
  profile: ProfileUser;
  items: readonly ListItem[];
  itemCount: number;
};

// A season or an episode shows its show's poster, titled like OG's poster tooltips.
function poster(item: ListItem): { title?: string; image?: string } {
  const show = item.show?.title ?? '';
  if (item.type === 'movie') return { title: item.movie?.title ?? undefined, image: art('movie', item.movie) };
  if (item.type === 'show') return { title: show || undefined, image: art('show', item.show) };
  if (item.type === 'season') {
    const showArt = art('show', item.show);
    const image = item.season
      ? mediaImage({ type: 'season', id: item.season.ids.trakt, slot: 'poster', size: 'thumb', fallback: showArt })
      : showArt;
    return { title: `${show} Season ${item.season?.number ?? ''}`.trim(), image };
  }
  return { title: [show, item.episode?.title].filter(Boolean).join(': ') || undefined, image: art('show', item.show) };
}

const art = (type: 'movie' | 'show', media: { ids: { trakt: number } } | null | undefined) =>
  media ? mediaImage({ type, id: media.ids.trakt, slot: 'poster', size: 'thumb' }) : undefined;

/**
 * The watchlist or favorites row at the top of `/users/:id/lists`. Neither can be
 * liked, and the API has no read for their description or whether comments are on: the row takes OG's default
 * description and leaves comments out.
 */
export function toBuiltInRow({ kind, profile, items, itemCount }: BuiltInRowParams): UserListRow {
  const href = `/users/${profile.slug}`;
  return {
    key: kind,
    id: null,
    kind,
    href: `${href}/${kind}`,
    name: kind === 'watchlist' ? 'Watchlist' : 'Favorites',
    owner: { slug: profile.slug, name: profile.displayName, href, avatar: profile.avatarUrl, vip: profile.vip },
    posters: items.slice(0, 5).map(poster),
    itemCount,
    moviesOnly: listMoviesOnly(
      itemCount,
      items.map(({ type }) => type),
    ),
    description: builtInListDescriptions[kind],
    pills: [],
    shareLink: false,
    isPublic: false,
    updatedAt: '',
    rank: 0,
  };
}
