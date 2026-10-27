import { SITE_NAME } from './siteName.ts';

/** A page's `<title>`: "Inception (2010) - Trakt OG Redux", or the site name alone. */
export function toSeoTitle(title: string | undefined): string {
  const trimmed = title?.trim();
  return trimmed ? `${trimmed} - ${SITE_NAME}` : SITE_NAME;
}
