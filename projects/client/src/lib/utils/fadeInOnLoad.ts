import type { Attachment } from 'svelte/attachments';

const FADE_MS = 300;

/**
 * Fades an image in each time it finishes loading, so art that arrives late eases in over what's under it. An image
 * already loaded when attached shows as is, and reduced motion skips the fade.
 */
export function fadeInOnLoad(): Attachment<HTMLImageElement> {
  return (image) => {
    const fade = () => {
      if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' });
    };

    image.addEventListener('load', fade);
    return () => image.removeEventListener('load', fade);
  };
}
