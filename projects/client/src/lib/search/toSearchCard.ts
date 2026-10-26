import type { ComponentProps } from 'svelte';
import type { CardTag } from '../components/media/CardTag.ts';
import type EpisodeTypeBadge from '../components/media/EpisodeTypeBadge.svelte';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import type { SearchCard } from './SearchCard.ts';
import type { SearchHit } from './SearchHit.ts';
import { countLabel } from '../utils/countLabel.ts';
import { type DateOrder, formatDate } from '../utils/formatDate.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import { personTags } from '../people/personTags.ts';
import { imageUrl } from '../utils/imageUrl.ts';

type SearchCardOptions = {
  /** The type tag. The single-type tabs hide it, since the tab already says it. */
  typeTag: boolean;
  premiereTag?: boolean;
  now: Date;
  order: DateOrder;
};

type Images = NonNullable<NonNullable<SearchHit['show']>['images']>;

type BadgeKind = ComponentProps<typeof EpisodeTypeBadge>['kind'];

const GENRES_SHOWN = 2;
// The episode types an ID result marks with OG's ribbon over its art.
const BADGE_KINDS: readonly BadgeKind[] = [
  'series-premiere',
  'season-premiere',
  'mid-season-premiere',
  'mid-season-finale',
  'season-finale',
  'series-finale',
];
const isBadgeKind = (kind: string | undefined): kind is BadgeKind => BADGE_KINDS.some((badge) => badge === kind);

const released = (date: string | null | undefined, now: Date) => (date ? new Date(date) <= now : false);
const first = (paths: readonly string[] | null | undefined) => paths?.at(0);
const generic = (text: string): CardTag => ({ text, kind: 'generic' });

const toArt = (images: Images | null | undefined): SearchArt => ({
  poster: imageUrl(first(images?.poster), 'thumb'),
  fanart: imageUrl(first(images?.fanart), 'thumb'),
  logo: imageUrl(first(images?.logo), 'medium'),
});

/**
 * Maps a `/search` hit onto a search result card with every artwork it can draw, so the sidebar's Artwork switches
 * without a reload. Returns null for a list, which renders as a row, or a hit missing the object its `type` names.
 */
export function toSearchCard(hit: SearchHit, options: SearchCardOptions): SearchCard | null {
  const { typeTag, premiereTag, now, order } = options;
  const typeTags = (text: string): CardTag[] => (typeTag ? [{ text }] : []);
  const { movie, show, episode, person } = hit;

  if (hit.type === 'episode' && episode && show) {
    const timeZone = show.airs?.timezone ?? 'UTC';
    const premiere = premiereTag ? episodeType(episode) : undefined;
    const badgeKind = premiere?.kind;
    const showHref = `/shows/${show.ids.slug ?? show.ids.trakt}`;
    const screenshot = imageUrl(first(episode.images?.screenshot), 'thumb');
    const art = toArt(show.images);
    return {
      key: `episode-${episode.ids.trakt}`,
      type: 'episode',
      id: episode.ids.trakt,
      season: { show: show.ids.trakt, number: episode.season, episode: episode.number },
      href: `${showHref}/seasons/${episode.season}/episodes/${episode.number}`,
      title: episode.title ?? '',
      number: episodeNumber(episode, null),
      smallTitle: { text: show.title, href: showHref },
      overview: episode.overview ?? undefined,
      art: { ...art, fanart: screenshot ?? art.fanart, spoilerFanart: screenshot ? art.fanart : undefined },
      tags: [
        ...typeTags('Episode'),
        ...(episode.first_aired ? [generic(formatDate(episode.first_aired, { timeZone, order }))] : []),
      ],
      released: released(episode.first_aired, now),
      rating: episode.rating ?? undefined,
      runtime: episode.runtime ?? show.runtime ?? undefined,
      episodeBadge: premiere && isBadgeKind(badgeKind) ? { label: premiere.text, kind: badgeKind } : undefined,
    };
  }

  if (hit.type === 'person' && person) {
    const headshot = imageUrl(first(person.images?.headshot), 'thumb');
    return {
      key: `person-${person.ids.trakt}`,
      type: 'person',
      id: person.ids.trakt,
      href: `/people/${person.ids.slug ?? person.ids.trakt}`,
      title: person.name,
      // The headshot is all a person has, whatever the artwork.
      art: { poster: headshot, fanart: headshot },
      // Their age, or when they died, and what they're known for, like the header search.
      tags: [
        ...typeTags('Person'),
        ...personTags(person, { today: now.toISOString().slice(0, 10), order }).map(generic),
      ],
      released: false,
    };
  }

  const media = hit.type === 'movie' ? movie : hit.type === 'show' ? show : null;
  if (!media || (hit.type !== 'movie' && hit.type !== 'show')) return null;

  const genres = (media.genres ?? []).slice(0, GENRES_SHOWN).map(genreLabel);
  const details = hit.type === 'movie'
    ? [media.runtime ? formatRuntime(media.runtime) : '', media.certification ?? '']
    : [media.network ?? '', media.aired_episodes ? countLabel(media.aired_episodes, 'episode') : ''];
  return {
    key: `${hit.type}-${media.ids.trakt}`,
    type: hit.type,
    id: media.ids.trakt,
    href: `/${hit.type}s/${media.ids.slug ?? media.ids.trakt}`,
    title: media.title,
    year: media.year ?? undefined,
    overview: media.overview ?? undefined,
    certification: media.certification ?? undefined,
    network: media.network ?? undefined,
    genres,
    art: toArt(media.images),
    tags: [...typeTags(hit.type === 'movie' ? 'Movie' : 'Show'), ...details.filter(Boolean).map(generic)],
    released: released(hit.type === 'movie' ? movie?.released : show?.first_aired, now),
    rating: media.rating ?? undefined,
    runtime: media.runtime ?? undefined,
    airedEpisodes: hit.type === 'show' ? (show?.aired_episodes ?? undefined) : undefined,
  };
}
