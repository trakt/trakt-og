import { LOGO_PATH } from './logoPath.ts';

const MEDIA = 'https://media.trakt.tv/images/';

/**
 * A media.trakt.tv logo through og's own `/api/logo` route, so `trimLogo` can read its pixels. Anything else, or
 * nothing, comes back as it is.
 */
export function proxiedLogoUrl(url: string | undefined): string | undefined {
  const path = url?.startsWith(MEDIA) ? url.slice(MEDIA.length) : undefined;
  return path && LOGO_PATH.test(path) ? `/api/logo/${path}` : url;
}
