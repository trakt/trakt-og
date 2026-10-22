import type { Attachment } from 'svelte/attachments';

/**
 * Calls `onChange(true)` each time the element scrolls into view and `onChange(false)` when it leaves, for work that
 * should only run while something is on screen. `nearViewport` is the one-shot version. Browsers without
 * IntersectionObserver count it as always in view.
 */
export function inViewport(onChange: (visible: boolean) => void): Attachment<HTMLElement> {
  return (element) => {
    if (typeof IntersectionObserver === 'undefined') {
      onChange(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const latest = entries.at(-1);
      if (latest) onChange(latest.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  };
}
