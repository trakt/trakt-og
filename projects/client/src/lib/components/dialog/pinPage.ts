type Page = {
  readonly scrollY: number;
  readonly body: { readonly style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'> };
  scrollTo: (options: ScrollToOptions) => void;
};

let pins = 0;
let pinnedAt = 0;

/**
 * Pins the page under a modal dialog where it is: the body fixed and shifted up by the scroll, the window at the top.
 * Safari places a popover anchored inside a modal dialog off by the window's scroll, so a tooltip or prompt there
 * lands a screen away from its trigger; with the window at the top it lands right. Nested dialogs share the one pin.
 * The unpin puts the scroll back, and only the first call of it counts.
 */
export function pinPage(
  page: Page = {
    get scrollY() {
      return window.scrollY;
    },
    body: document.body,
    scrollTo: (to) => window.scrollTo(to),
  },
): () => void {
  if (pins++ === 0) {
    pinnedAt = page.scrollY;
    page.body.style.setProperty('position', 'fixed');
    page.body.style.setProperty('inset-inline', '0');
    page.body.style.setProperty('top', `${-pinnedAt}px`);
  }
  let pinned = true;
  return () => {
    if (!pinned) return;
    pinned = false;
    if (--pins > 0) return;
    page.body.style.removeProperty('position');
    page.body.style.removeProperty('inset-inline');
    page.body.style.removeProperty('top');
    page.scrollTo({ top: pinnedAt, behavior: 'instant' });
  };
}
