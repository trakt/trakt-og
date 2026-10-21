import type { Attachment } from 'svelte/attachments';
import { isPlainClick } from '../../utils/isPlainClick.ts';
import { youtubeEmbedUrl } from './youtubeEmbedUrl.ts';

/**
 * Hands a plain click on any YouTube link inside the element to `play`, for the video popup. A middle click or a
 * modified click still opens YouTube, and other links are left alone.
 */
export function videoLinkClicks(play: (url: string) => void): Attachment<HTMLElement> {
  return (element) => {
    const onclick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || !isPlainClick(event) || !youtubeEmbedUrl(link.href)) return;
      event.preventDefault();
      play(link.href);
    };
    element.addEventListener('click', onclick);
    return () => element.removeEventListener('click', onclick);
  };
}
