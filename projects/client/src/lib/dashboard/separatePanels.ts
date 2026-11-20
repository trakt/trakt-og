import type { Attachment } from 'svelte/attachments';

const PANEL = '.dashboard-panel';

const backgroundOf = (element: Element) => getComputedStyle(element).backgroundColor;

/**
 * Keeps neighboring dashboard panels apart once the viewer's order puts two of the same color together, which only the
 * rendered colors can tell, since a pair can match in one theme and not the other. A panel that may change color
 * (`data-alternate`, a pinned list) switches to its other one; any other gets a hairline on top (`data-contrast`).
 */
export function separatePanels(element: HTMLElement): void {
  const panels = [...element.querySelectorAll<HTMLElement>(PANEL)];
  for (const panel of panels) delete panel.dataset.contrast;
  panels.slice(1).forEach((panel, i) => {
    const above = panels[i];
    if (!above || backgroundOf(panel) !== backgroundOf(above)) return;
    if (panel.dataset.alternate !== undefined) {
      panel.dataset.contrast = 'alternate';
      if (backgroundOf(panel) !== backgroundOf(above)) return;
    }
    panel.dataset.contrast = 'rule';
  });
}

/** Runs `separatePanels` on the panels inside, again whenever they change or the theme does. */
export const separatedPanels: Attachment<HTMLElement> = (element) => {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => separatePanels(element));
  };
  schedule();
  const panels = new MutationObserver(schedule);
  panels.observe(element, { childList: true, subtree: true });
  const theme = new MutationObserver(schedule);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', schedule);
  return () => {
    cancelAnimationFrame(frame);
    panels.disconnect();
    theme.disconnect();
    scheme.removeEventListener('change', schedule);
  };
};
