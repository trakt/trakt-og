import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';

const FADE_MS = 400;
const shown = new WeakMap<Element, unknown>();

/**
 * Fades the element in each time `key` changes, so new content eases in where the old was. The first render shows as
 * is, and reduced motion skips the fade.
 */
export function fadeOnChange(key: unknown): Attachment<HTMLElement> {
  return (element) => {
    const changed = shown.has(element) && shown.get(element) !== key;
    shown.set(element, key);
    if (!changed || prefersReducedMotion.current) return;
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' });
  };
}
