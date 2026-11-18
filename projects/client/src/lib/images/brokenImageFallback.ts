import banner from '#lib/assets/placeholders/banner.png';
import fanart from '#lib/assets/placeholders/fanart.png';
import poster from '#lib/assets/placeholders/poster.png';
import zoidberg from '#lib/assets/placeholders/person-zoidberg.png';
import { PLACEHOLDER_AVATAR } from '#lib/users/placeholderAvatar.ts';
import { fallbackArt } from './fallbackArt.ts';

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
  ['portrait', zoidberg],
  // Words drawn over art: with none, the art alone reads better than a placeholder.
  ['logo', null],
  ['clearart', null],
  // Last, so a size folder (`/thumb/poster.webp`) never reads as this slot.
  ['thumb', fanart],
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

/** Whether an image loads. */
type Preload = (url: string) => Promise<boolean>;

const preloadImage: Preload = (url) =>
  new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = url;
  });

/**
 * Swaps in the fallback art once it has loaded off the page, then its own fallback if it's missing too. Safari draws
 * its broken-image icon on a broken image until a new `src` arrives, so the image keeps its placeholder meanwhile.
 * An image the page has given another source since is left alone.
 */
async function tryArt(image: HTMLImageElement, art: string, preload: Preload) {
  const shown = image.src;
  const loaded = await preload(art);
  if (image.src !== shown) return;
  if (loaded) {
    image.src = art;
    return;
  }
  const next = fallbackArt(art);
  if (next) await tryArt(image, next, preload);
}

/**
 * An image can name its own placeholder in `data-placeholder` (a person's, by gender), over its kind's. Art built with
 * a `fallback` (`mediaImage`) then tries that art behind it. `data-fallback` keeps what it settled on: the
 * placeholder, or the broken source it hid, so neither is handled twice.
 */
function replace(image: HTMLImageElement, preload: Preload) {
  const src = sourceOf(image);
  if (image.dataset.fallback === src) return;
  const kind = brokenImageFallback(src);
  if (kind === undefined) return;
  image.removeAttribute('srcset');
  const placeholder = image.dataset.placeholder ?? kind;
  if (placeholder === null) {
    image.dataset.fallback = src;
    image.style.visibility = 'hidden';
  } else {
    image.dataset.fallback = new URL(placeholder, image.baseURI).href;
    image.src = placeholder;
  }
  const art = fallbackArt(src);
  if (art) void tryArt(image, art, preload);
}

// The page reused the element for another image that loaded: it's itself again.
function restore(image: HTMLImageElement) {
  if (image.dataset.fallback === undefined || image.dataset.fallback === sourceOf(image)) return;
  delete image.dataset.fallback;
  image.style.removeProperty('visibility');
}

// app.html's early handler already showed the placeholder of an image that failed before the app started.
function resume(image: HTMLImageElement, broken: string, preload: Preload) {
  delete image.dataset.broken;
  image.dataset.fallback = image.src;
  const art = fallbackArt(broken);
  if (art) void tryArt(image, art, preload);
}

/**
 * Swaps every broken Trakt image on the page for its placeholder, so no browser draws its broken-image icon: the ones
 * that failed before the app started, and any that fail later. It takes over from app.html's early handler, which
 * stops while `data-broken-images` is on `<html>`. Returns the stop.
 */
export function startBrokenImages(root: Document = document, preload: Preload = preloadImage): () => void {
  const onerror = (event: Event) => {
    if (event.target instanceof HTMLImageElement) replace(event.target, preload);
  };
  const onload = (event: Event) => {
    if (event.target instanceof HTMLImageElement) restore(event.target);
  };
  root.documentElement.setAttribute('data-broken-images', '');
  root.addEventListener('error', onerror, true);
  root.addEventListener('load', onload, true);
  for (const image of root.images) {
    const broken = image.dataset.broken;
    if (broken) resume(image, broken, preload);
    else if (image.complete && image.naturalWidth === 0 && image.src) replace(image, preload);
  }
  return () => {
    root.documentElement.removeAttribute('data-broken-images');
    root.removeEventListener('error', onerror, true);
    root.removeEventListener('load', onload, true);
  };
}
