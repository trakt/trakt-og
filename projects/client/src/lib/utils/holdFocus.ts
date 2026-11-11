import { tick } from 'svelte';

const CONTROL = 'a[href], button:not([disabled])';

/**
 * Call before a change that can remove `node` (cancelling a check-in takes its controls away). Awaited after the
 * change, the returned function moves focus that was inside `node`, and fell back to the page when it went, to the
 * first control in the nearest `[data-refocus]` around it, or else to the main content.
 */
export function holdFocus(node: Element, page: Document = document): () => Promise<void> {
  const host = node.closest('[data-refocus]');
  const held = node.contains(page.activeElement);

  return async () => {
    await tick();
    if (!held || node.isConnected) return;
    if (page.activeElement && page.activeElement !== page.body) return;
    (host?.querySelector<HTMLElement>(CONTROL) ?? page.getElementById('content'))?.focus();
  };
}
