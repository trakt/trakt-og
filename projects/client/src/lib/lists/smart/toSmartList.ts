import type { SmartListDefinitionResponse } from '@trakt/api';
import type { SmartList, SmartListMediaType, SmartListPrivacy, SmartListSource } from './SmartList.ts';

const SOURCES: readonly SmartListSource[] = [
  'trending',
  'popular',
  'anticipated',
  'recommendations',
  'discover',
  'watchlist',
  'library',
];
const MEDIA_TYPES: readonly SmartListMediaType[] = ['movies', 'shows', 'media'];
const PRIVACIES: readonly SmartListPrivacy[] = ['public', 'private', 'friends'];

const pick = <T extends string>(values: readonly T[], value: string, fallback: T): T =>
  values.find((known) => known === value) ?? fallback;

/** One smart list from `/users/:id/smart-lists`. The contract types source, type and privacy as plain strings. */
export function toSmartList(list: SmartListDefinitionResponse): SmartList {
  return {
    id: list.ids.trakt,
    slug: list.ids.slug,
    name: list.name,
    privacy: pick(PRIVACIES, list.privacy, 'private'),
    source: pick(SOURCES, list.source, 'discover'),
    mediaType: pick(MEDIA_TYPES, list.media_type, 'media'),
    filters: list.filters,
    updatedAt: list.updated_at,
    posters: list.images.posters,
  };
}
