import { advanceStar, NEAR, projectStar, spawnStar, type Star, STARFIELD, trailDepth, warpSpeed } from './starfield.ts';

/** How much of the last frame each frame paints over, so moving stars leave a short streak. */
const FADE = 0.55;
/** A slow frame moves the stars this far at most, so a tab coming back doesn't jump the field. */
const MAX_FRAME_SECONDS = 0.05;
const MAX_PIXEL_RATIO = 2;

const color = (style: CSSStyleDeclaration, name: string) => style.getPropertyValue(name).trim();

/**
 * Draws the starfield on its canvas: stars stream out from the middle, or back into it in `reverse`. Under reduced
 * motion the field holds still. Colors come from the `--color-hyperspace-*` tokens.
 */
export function hyperspace({ reverse }: { reverse: boolean }) {
  return (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    if (!context) return;

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const style = getComputedStyle(canvas);
    const colors = {
      background: color(style, '--color-hyperspace-bg'),
      star: color(style, '--color-hyperspace-star'),
      accent: color(style, '--color-hyperspace-star-accent'),
    };
    const random = Math.random;
    let stars: Star[] = Array.from({ length: STARFIELD.count }, () =>
      spawnStar({ random, z: NEAR + random() * (1 - NEAR) }),
    );
    let width = 0;
    let height = 0;

    const draw = (speed: number) => {
      const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalAlpha = still ? 1 : FADE;
      context.fillStyle = colors.background;
      context.fillRect(0, 0, width, height);
      context.lineCap = 'round';

      const trail = trailDepth(speed);
      stars.forEach((star) => {
        const head = projectStar({ star, z: star.z, width, height });
        const tailZ = Math.min(Math.max(star.z + (reverse ? -trail : trail), NEAR), 1);
        const tail = still ? { x: head.x + 1, y: head.y } : projectStar({ star, z: tailZ, width, height });
        context.globalAlpha = Math.min(1, (1 - star.z) * 1.4);
        context.strokeStyle = star.accent ? colors.accent : colors.star;
        context.lineWidth = Math.max(0.6, (1 - star.z) * 2);
        context.beginPath();
        context.moveTo(tail.x, tail.y);
        context.lineTo(head.x, head.y);
        context.stroke();
      });
    };

    const resize = () => {
      const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (still) draw(0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const started = performance.now();
    let last = started;
    let frame = 0;
    const tick = (now: number) => {
      const seconds = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
      last = now;
      const speed = warpSpeed(now - started);
      stars = stars.map((star) => advanceStar({ star, distance: speed * seconds, reverse, random }));
      draw(speed);
      frame = requestAnimationFrame(tick);
    };
    if (!still) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  };
}
