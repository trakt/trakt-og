import type { Attachment } from 'svelte/attachments';

/**
 * Narrows wrapped text to its widest line. A box takes the text's width before it wraps, so once `text-wrap: balance`
 * evens the lines out, the box keeps that width and leaves space on both sides. In a shut popover it waits until it's
 * laid out. The element needs a width of its own, like `inline-block`.
 */
export const fitLines: Attachment<HTMLElement> = (node) => {
  const range = document.createRange();
  const observer = new ResizeObserver(() => {
    if (node.style.inlineSize || node.getClientRects().length === 0) return;
    range.selectNodeContents(node);
    const widest = Math.max(0, ...[...range.getClientRects()].map(({ width }) => width));
    if (widest > 0) node.style.inlineSize = `${Math.ceil(widest)}px`;
  });
  observer.observe(node);
  return () => observer.disconnect();
};
