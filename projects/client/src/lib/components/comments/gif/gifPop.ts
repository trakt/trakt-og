import { backOut } from 'svelte/easing';

/** A picked GIF springs into the composer: it grows, untilts and fades in. Reduced motion skips it. */
export function gifPop(_node: Element) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    delay: 80,
    duration: still ? 0 : 450,
    easing: backOut,
    css: (t: number, u: number) =>
      `transform: scale(${0.6 + 0.4 * t}) rotate(${u * 8}deg); opacity: ${Math.min(t * 2, 1)};`,
  };
}
