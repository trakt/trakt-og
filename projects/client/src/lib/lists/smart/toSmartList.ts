import type { SmartListDefinitionResponse } from '@trakt/api';
import { readSmartListTarget } from './readSmartListTarget.ts';
import type { SmartList, SmartListPrivacy } from './SmartList.ts';

const PRIVACIES: readonly SmartListPrivacy[] = ['public', 'private', 'friends'];

/** One smart list from `/users/:id/smart-lists`. The contract types source, type and privacy as plain strings. */
export function toSmartList(list: SmartListDefinitionResponse): SmartList {
  return {
    id: list.ids.trakt,
    slug: list.ids.slug,
    name: list.name,
    privacy: PRIVACIES.find((privacy) => privacy === list.privacy) ?? 'private',
    ...readSmartListTarget(list),
    filters: list.filters,
    updatedAt: list.updated_at,
    posters: list.images.posters,
  };
}
