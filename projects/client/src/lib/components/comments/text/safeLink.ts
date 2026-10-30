import { youtubeId } from '../../dialog/youtubeId.ts';
import { TRAKT_HOSTS } from './ogPath.ts';

// The hosts OG turned into links, plus Trakt's newer sites. Everything else stays text.
const SAFE_HOSTS: ReadonlySet<string> = new Set([
  ...TRAKT_HOSTS,
  'support.trakt.tv',
  'blog.trakt.tv',
  'forums.trakt.tv',
  'thetvdb.com',
  'www.thetvdb.com',
  'themoviedb.org',
  'www.themoviedb.org',
  'fanart.tv',
  'www.fanart.tv',
  'imdb.com',
  'www.imdb.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
]);

export type SafeLink = { readonly href: string; readonly video?: string };

/**
 * The link OG made for a URL in a comment, or `undefined` when its host isn't allowlisted. Like OG, the href keeps the
 * scheme, host, path and query and drops everything else (credentials, port, fragment). Only http and https pass.
 */
export function safeLink(candidate: string): SafeLink | undefined {
  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `http://${candidate}`;
  const url = URL.canParse(withScheme) ? new URL(withScheme) : undefined;
  if (!url || !['http:', 'https:'].includes(url.protocol)) return undefined;
  if (!SAFE_HOSTS.has(url.hostname)) return undefined;

  const href = `${url.protocol}//${url.hostname}${url.pathname}${url.search}`;
  const video = youtubeId(url);
  return video ? { href, video } : { href };
}
