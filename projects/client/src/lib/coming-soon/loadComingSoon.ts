import type { Cookies } from '@sveltejs/kit';
import { type Teaser, teasers } from './teasers.ts';
import { toNextTeaser } from './toNextTeaser.ts';

const COOKIE = 'og_teaser';
const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

interface LoadComingSoonParams {
  cookies: Pick<Cookies, 'get' | 'set'>;
  url: URL;
  roll: number;
}

const isTeaser = (value: string | null): value is Teaser => teasers.some((teaser) => teaser === value);

/**
 * Rotates the coming-soon design on every visit, remembering the last one in a cookie so it never repeats.
 * `?teaser=vhs` (or lobby, seance, tabloid) pins a design for previewing and doesn't touch the rotation.
 */
export function loadComingSoon({ cookies, url, roll }: LoadComingSoonParams): { teaser: Teaser } {
  const pinned = url.searchParams.get('teaser');
  if (isTeaser(pinned)) return { teaser: pinned };

  const teaser = toNextTeaser({ previous: cookies.get(COOKIE), roll });
  cookies.set(COOKIE, teaser, { path: '/', maxAge: YEAR_IN_SECONDS, sameSite: 'lax', httpOnly: true });
  return { teaser };
}
