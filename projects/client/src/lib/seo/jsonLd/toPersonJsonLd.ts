import type { toPersonSummary } from '../../people/toPersonSummary.ts';
import { toSeoDescription } from '../toSeoDescription.ts';
import { toShareImageUrl } from '../toShareImageUrl.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';
import { toIsoDate } from './toIsoDate.ts';
import { toSameAs } from './toSameAs.ts';

type Summary = ReturnType<typeof toPersonSummary>;

type PersonJsonLdSource = Pick<Summary, 'name' | 'href' | 'biography' | 'headshot' | 'links'> & {
  readonly facts: Pick<Summary['facts'], 'birthday' | 'death'>;
};

/** A person as schema.org's `Person`. */
export function toPersonJsonLd(person: PersonJsonLdSource): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: toSeoDescription(person.biography),
    url: toAbsoluteUrl(person.href),
    image: person.headshot && toShareImageUrl(person.headshot),
    birthDate: toIsoDate(person.facts.birthday),
    deathDate: toIsoDate(person.facts.death),
    sameAs: toSameAs(person.links),
  });
}
