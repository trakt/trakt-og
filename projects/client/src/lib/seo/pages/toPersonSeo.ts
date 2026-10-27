import { toPersonJsonLd } from '../jsonLd/toPersonJsonLd.ts';
import type { SeoMeta } from '../SeoMeta.ts';

/** `/people/:id`: their name, biography (the head strips its links and markup) and headshot, as a `Person`. */
export function toPersonSeo(person: Parameters<typeof toPersonJsonLd>[0]): SeoMeta {
  return {
    title: person.name,
    description: person.biography || `Movies and shows with ${person.name}, on Trakt.`,
    image: person.headshot,
    imageAlt: person.name,
    type: 'profile',
    jsonLd: [toPersonJsonLd(person)],
  };
}
