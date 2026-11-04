import type { Attachment } from 'svelte/attachments';

/** Calls `onhold` once the pointer has rested on the element for `ms`. Leaving first cancels it. */
export function holdHover(ms: number, onhold: () => void): Attachment<HTMLElement> {
  return (node) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => clearTimeout(timer);
    const start = () => {
      cancel();
      timer = setTimeout(onhold, ms);
    };
    node.addEventListener('pointerenter', start);
    node.addEventListener('pointerleave', cancel);
    return () => {
      cancel();
      node.removeEventListener('pointerenter', start);
      node.removeEventListener('pointerleave', cancel);
    };
  };
}
