import type { Attachment } from 'svelte/attachments';
import { logoBounds } from './logoBounds.ts';

// The trimmed copy of each logo this session, by its source, so a logo is measured once.
const trimmed = new Map<string, Promise<string | undefined>>();

// A copy of the logo cut to its drawn pixels, as a blob URL. Undefined when there's nothing to trim.
async function trim(source: string): Promise<string | undefined> {
  const image = new Image();
  image.src = source;
  await image.decode();

  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return undefined;

  context.drawImage(image, 0, 0);
  // Throws for an image from another origin without CORS, which then shows as it is.
  const bounds = logoBounds({ data: context.getImageData(0, 0, width, height).data, width, height });
  if (!bounds || (bounds.width === width && bounds.height === height)) return undefined;

  const cut = Object.assign(document.createElement('canvas'), { width: bounds.width, height: bounds.height });
  cut.getContext('2d')?.drawImage(image, -bounds.x, -bounds.y);
  const blob = await new Promise<Blob | null>((resolve) => cut.toBlob(resolve, 'image/png'));
  return blob ? URL.createObjectURL(blob) : undefined;
}

const REVEAL_MS = 600;
// The share of the reveal spent growing to the logo's height, before it fades in.
const GROW = 0.45;

/**
 * Trims a logo's transparent margins, so its size and alignment follow the lettering and not the padding its file
 * came with. A copy of `source` is measured (the browser's cache serves it) and the cut copy swapped in; then the
 * logo's space grows from its placeholder to the logo's height, and the logo fades in. One that can't be read or has
 * nothing to trim does the same as it is. Reduced motion skips the animation. `source` must be same-origin
 * (`proxiedLogoUrl`), or the canvas can't read it.
 *
 * The image carries `data-trim` while it waits, which TrimmedLogo draws as a short shimmering bar from the first
 * paint, so the uncut logo never shows. The logo sits at the bottom of its space, so what's under it stays put.
 */
export function trimLogo(source: string | undefined): Attachment<HTMLImageElement> {
  return (image) => {
    if (!source) return;
    let live = true;

    const reveal = () => {
      if (!live) return;
      const from = `${image.getBoundingClientRect().height}px`;
      image.removeAttribute('data-trim');
      if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const to = `${image.getBoundingClientRect().height}px`;
      image.animate([
        { blockSize: from, opacity: 0 },
        { blockSize: to, opacity: 0, offset: GROW },
        { blockSize: to, opacity: 1 },
      ], { duration: REVEAL_MS, easing: 'ease-out' });
    };

    image.setAttribute('data-trim', '');
    if (!trimmed.has(source)) trimmed.set(source, trim(source).catch(() => undefined));
    void trimmed.get(source)?.then(async (url) => {
      if (!live) return;
      if (url) {
        image.src = url;
        // The cut copy paints before the fade starts, never the uncut one.
        await image.decode().catch(() => undefined);
      }
      reveal();
    });

    return () => {
      live = false;
      image.removeAttribute('data-trim');
    };
  };
}
