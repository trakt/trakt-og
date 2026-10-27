import { SITE_ORIGIN } from '../siteOrigin.ts';

/** An og path on the production origin. */
export const toAbsoluteUrl = (path: string) => `${SITE_ORIGIN}${path}`;
