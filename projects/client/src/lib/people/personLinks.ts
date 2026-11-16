import type { PersonResponse } from '@trakt/api';
import tiktokIcon from '#lib/icons/brands/tiktok.svg?raw';
import youtubeIcon from '#lib/icons/brands/youtube.svg?raw';
import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';

// OG fell back to web search when the person had no ids.
const imdbLink = ({ ids, name }: PersonResponse) =>
  ids.imdb
    ? `https://www.imdb.com/name/${ids.imdb}`
    : `https://www.imdb.com/find?${new URLSearchParams({ q: name, s: 'nm' })}`;

/** A person's external links. */
export function personLinks(person: PersonResponse): ExternalLink[] {
  const { tiktok, youtube, wikidata } = person.social_ids ?? {};
  const links: (ExternalLink | false)[] = [
    !!person.homepage && { label: 'Official Site', href: person.homepage },
    { label: 'IMDB', href: imdbLink(person) },
    !!person.ids.tmdb && { label: 'TMDB', href: `https://www.themoviedb.org/person/${person.ids.tmdb}` },
    ...iconLinks({ social: person.social_ids, search: person.name }),
    !!tiktok && { label: 'TikTok', icon: tiktokIcon, href: `https://www.tiktok.com/@${tiktok}`, title: `@${tiktok}` },
    !!youtube && { label: 'YouTube', icon: youtubeIcon, href: `https://www.youtube.com/channel/${youtube}` },
    !!wikidata && { label: 'Wikidata', href: `https://www.wikidata.org/wiki/${wikidata}` },
  ];
  return links.filter((link) => link !== false);
}
