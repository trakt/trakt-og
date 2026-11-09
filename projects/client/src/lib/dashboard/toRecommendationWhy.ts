import type { z } from 'zod/v4';
import { mediaImage } from '../images/mediaImage.ts';
import { countLabel } from '../utils/countLabel.ts';
import type { Recommendation, RecommendationPerson, RecommendationSource } from './Recommendation.ts';
import type { recommendationPersonSchema } from './recommendationPersonSchema.ts';
import type { recommendationSourceSchema } from './recommendationSourceSchema.ts';

type Source = z.infer<typeof recommendationSourceSchema>;
type Person = z.infer<typeof recommendationPersonSchema>;

/** The posters the stack shows before "+N". */
const STACK = 3;

// trakt-web's role lines, as "Directed 5 titles you've watched".
const LEADS = {
  directing: 'Directed',
  directingActing: 'Directed and acted in',
  making: 'Created',
  makingActing: 'Created and acted in',
  acting: 'Acted in',
} as const;

const pathOf = (type: 'show' | 'movie', ids: { trakt: number; slug?: string | null }) =>
  `/${type}s/${ids.slug ?? ids.trakt}`;

function toSource(source: Source): RecommendationSource | null {
  const media = source.show ?? source.movie;
  if (!media) return null;
  const type = source.show ? 'show' : 'movie';

  return {
    type,
    id: media.ids.trakt,
    href: pathOf(type, media.ids),
    title: media.title,
    year: media.year ?? undefined,
    poster: mediaImage({ type, id: media.ids.trakt, slot: 'poster', size: 'thumb' }),
    stars: source.stars ?? undefined,
    watched: source.type === 'activity',
    loved: source.type === 'favorite',
  };
}

// A title can come back once as watched and again as loved: it becomes one, with both and the first rating.
function merged(titles: readonly RecommendationSource[]): RecommendationSource[] {
  const byTitle = titles.reduce((all, title) => {
    const key = `${title.type}:${title.id}`;
    const seen = all.get(key);
    return all.set(
      key,
      seen
        ? {
            ...seen,
            stars: seen.stars ?? title.stars,
            watched: seen.watched || title.watched,
            loved: seen.loved || title.loved,
          }
        : title,
    );
  }, new Map<string, RecommendationSource>());
  return [...byTitle.values()];
}

function leadOf(roles: Person['watched_roles']): string {
  const acted = roles.includes('acting');
  if (roles.includes('directing')) return acted ? LEADS.directingActing : LEADS.directing;
  if (roles.includes('making')) return acted ? LEADS.makingActing : LEADS.making;
  return LEADS.acting;
}

function toPerson({ person, role, watched_roles, watched_count, titles }: Person): RecommendationPerson {
  const shown = titles.slice(0, STACK).flatMap(({ show, movie }) => {
    const media = show ?? movie;
    if (!media) return [];
    const type = show ? 'show' : 'movie';
    return [
      {
        key: `${type}:${media.ids.trakt}`,
        title: media.title,
        poster: mediaImage({ type, id: media.ids.trakt, slot: 'poster', size: 'thumb' }),
      },
    ];
  });
  const roles = watched_roles.length > 0 ? watched_roles : [role];

  return {
    id: person.ids.trakt,
    href: `/people/${person.ids.slug ?? person.ids.trakt}`,
    name: person.name,
    headshot: mediaImage({ type: 'person', id: person.ids.trakt, slot: 'headshot', size: 'thumb' }),
    line: `${leadOf(roles)} ${countLabel(watched_count, 'title')} you've watched`,
    titles: shown,
    more: Math.max(watched_count - shown.length, 0),
  };
}

type Reasons = {
  readonly sources: readonly Source[];
  readonly people?: readonly Person[] | null;
};

/** The titles, people and subgenres behind a pick, as "Why this?" groups them. */
export function toRecommendationWhy({ sources, people }: Reasons): Recommendation['why'] {
  const titles = sources.filter((source) => source.type !== 'subgenre').flatMap((source) => toSource(source) ?? []);
  const likes = sources.flatMap((source) => source.subgenres?.map(({ name }) => name) ?? []);

  return { titles: merged(titles), likes: [...new Set(likes)], people: (people ?? []).map(toPerson) };
}
