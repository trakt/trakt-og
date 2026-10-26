/** A keyframe that holds until the next one: a glitch jumps between frames rather than easing. */
export type Frame = { offset: number; easing?: string; [property: string]: string | number | undefined };

/** The timing of frame `index` of `count`, held until the next. */
export const jump = (index: number, count: number) => ({ offset: index / count, easing: 'steps(1)' });

const fringe = (shift: number) =>
  `drop-shadow(${shift}px 0 rgb(255 0 60 / 75%)) drop-shadow(${-shift}px 0 rgb(0 255 240 / 75%))`;

/**
 * An element torn into one band of the window at a time, thrown sideways with red and cyan fringes, and now and then
 * whole again, so the tear reads as flicker. It ends untouched.
 */
export function tornFrames(element: Element, count: number): Frame[] {
  const box = element.getBoundingClientRect();
  const windowTop = Math.max(0, -box.top);
  const frames = Array.from({ length: count }, (_, index) => {
    const shift = (Math.random() - 0.5) * 90;
    const top = windowTop + Math.random() * innerHeight * 0.7;
    const band = 60 + Math.random() * innerHeight * 0.45;
    const whole = index % 4 === 3;
    return {
      ...jump(index, count),
      transform: `translateX(${shift}px) skewX(${(Math.random() - 0.5) * 6}deg)`,
      clipPath: whole ? 'inset(0 0 0 0)' : `inset(${top}px 0 ${Math.max(0, box.height - top - band)}px 0)`,
      filter: fringe(shift / 5),
    };
  });
  return [...frames, { offset: 1, transform: 'none', clipPath: 'inset(0 0 0 0)', filter: 'none' }];
}

/** An element shaken sideways with the same fringes, without tearing: for the header. It ends untouched. */
export function shakenFrames(count: number): Frame[] {
  const frames = Array.from({ length: count }, (_, index) => {
    const shift = (Math.random() - 0.5) * 40;
    return { ...jump(index, count), transform: `translateX(${shift}px)`, filter: fringe(shift / 4) };
  });
  return [...frames, { offset: 1, transform: 'none', filter: 'none' }];
}
