import banner from '#lib/assets/placeholders/banner.png';
import fanart from '#lib/assets/placeholders/fanart.png';
import poster from '#lib/assets/placeholders/poster.png';
import zoidberg from '#lib/assets/placeholders/person-zoidberg.png';
import { PLACEHOLDER_AVATAR } from '#lib/users/placeholderAvatar.ts';

const HOST = 'media.trakt.tv';
/** og's own route for media.trakt.tv logos (`proxiedLogoUrl`), on whatever host og runs on. */
const LOGO_PROXY = '/api/logo/';

// Each kind as a folder (`/images/movies/…/fanarts/thumb/…`) or a file name (`/movies/1/thumb/fanart.webp`).
const ART: readonly (readonly [string, string | null])[] = [
  ['poster', poster],
  ['fanart', fanart],
  ['screenshot', fanart],
  ['banner', banner],
  ['headshot', zoidberg],
  // Words drawn over art: with none, the art alone reads better than a placeholder.
  ['logo', null],
  ['clearart', null],
];

const isKind = (path: string, kind: string) => new RegExp(`/${kind}s?[/.]`).test(path);

/**
 * What an image the image host couldn't serve (the API names art it doesn't have) shows instead: OG's placeholder for
 * its kind, `null` to hide it, or undefined to leave it be (not Trakt's art, or a placeholder already).
 */
export function brokenImageFallback(src: string): string | null | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }
  const trakt = url.hostname === HOST || url.pathname.startsWith(LOGO_PROXY);
  if (!trakt || url.pathname.includes('/placeholders/')) return undefined;
  if (url.pathname.startsWith('/users/')) return PLACEHOLDER_AVATAR;
  return ART.find(([kind]) => isKind(url.pathname, kind))?.[1];
}

const sourceOf = (image: HTMLImageElement) => image.currentSrc || image.src;

/**
 * An image can name its own placeholder in `data-placeholder` (a person's, by gender), over its kind's.
 * `data-fallback` keeps what it settled on: the placeholder, or the broken source it hid, so neither is handled twice.
 */
function replace(image: HTMLImageElement) {
  const src = sourceOf(image);
  if (image.dataset.fallback === src) return;
  const kind = brokenImageFallback(src);
  if (kind === undefined) return;
  const fallback = image.dataset.placeholder ?? kind;
  image.removeAttribute('srcset');
  if (fallback === null) {
    image.dataset.fallback = src;
    image.style.visibility = 'hidden';
    return;
  }
  image.dataset.fallback = new URL(fallback, image.baseURI).href;
  image.src = fallback;
}

// The page reused the element for another image that loaded: it's itself again.
function restore(image: HTMLImageElement) {
  if (image.dataset.fallback === undefined || image.dataset.fallback === sourceOf(image)) return;
  delete image.dataset.fallback;
  image.style.removeProperty('visibility');
}

/**
 * Swaps every broken Trakt image on the page for its placeholder, so no browser draws its broken-image icon: the ones
 * that failed before the app started, and any that fail later. Returns the stop.
 */
export function startBrokenImages(root: Document = document): () => void {
  const onerror = (event: Event) => {
    if (event.target instanceof HTMLImageElement) replace(event.target);
  };
  const onload = (event: Event) => {
    if (event.target instanceof HTMLImageElement) restore(event.target);
  };
  root.addEventListener('error', onerror, true);
  root.addEventListener('load', onload, true);
  for (const image of root.images) {
    if (image.complete && image.naturalWidth === 0 && image.src) replace(image);
  }
  return () => {
    root.removeEventListener('error', onerror, true);
    root.removeEventListener('load', onload, true);
  };
}
