import type { toPersonSummary } from '../../people/toPersonSummary.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Person = Pick<ReturnType<typeof toPersonSummary>, 'name' | 'biography' | 'headshot'>;

/** `/people/:id`: their name, biography (the head strips its links and markup) and headshot. */
export function toPersonSeo(person: Person): SeoMeta {
  return {
    title: person.name,
    description: person.biography || `Movies and shows with ${person.name}, on Trakt.`,
    image: person.headshot,
    imageAlt: person.name,
    type: 'profile',
  };
}
