import type { Attachment } from 'svelte/attachments';
import type { AboutScene, AboutScenePalette } from './scenes/AboutScene.ts';

interface PlaySceneParams {
  scene: AboutScene;
  lines: readonly string[];
  /** Reduced motion: draw the scene's still frames once, then stop. */
  still: boolean;
}

const MAX_PIXEL_RATIO = 2;
const STILL_STEP_MS = 60;

const paletteOf = (canvas: HTMLCanvasElement): AboutScenePalette => {
  const style = getComputedStyle(canvas);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    red: read('--color-about-scene-red'),
    cyan: read('--color-about-scene-cyan'),
    ink: read('--color-about-scene-ink'),
  };
};

/**
 * Attachment: plays an about scene on a canvas at the canvas's own size, starting over when it resizes. It only draws
 * while the canvas is on screen and the tab is showing.
 */
export function playScene({ scene, lines, still }: PlaySceneParams): Attachment<HTMLCanvasElement> {
  return (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = paletteOf(canvas);
    let frame: ((time: number) => void) | null = null;
    let raf = 0;
    let onScreen = true;

    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = Math.min(MAX_PIXEL_RATIO, devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      frame = scene.start({ ctx, width, height, palette, lines });
      if (!still) return;
      Array.from({ length: scene.still }, (_, i) => i * STILL_STEP_MS).forEach((time) => frame?.(time));
    };

    const loop = (time: number) => {
      frame?.(time);
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const play = () => {
      if (still || raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(loop);
    };

    const resized = new ResizeObserver(setup);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) play();
      else pause();
    });
    const visibility = () => (document.hidden ? pause() : play());

    resized.observe(canvas);
    seen.observe(canvas);
    document.addEventListener('visibilitychange', visibility);
    setup();
    play();

    return () => {
      pause();
      resized.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  };
}
