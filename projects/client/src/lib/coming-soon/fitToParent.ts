import { toFitScale } from './toFitScale.ts';

/**
 * Attachment: scales an element down, from its top center, until it fits its parent's content height, so the
 * coming-soon page never scrolls whatever the viewport. Re-fits when either one resizes.
 */
export function fitToParent(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return;

  const fit = () => {
    const style = getComputedStyle(parent);
    const available = parent.clientHeight - parseFloat(style.paddingBlockStart) - parseFloat(style.paddingBlockEnd);
    element.style.scale = String(toFitScale({ available, natural: element.offsetHeight }));
  };

  const observer = new ResizeObserver(fit);
  observer.observe(element);
  observer.observe(parent);
  fit();

  return () => observer.disconnect();
}
