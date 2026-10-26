import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { SceneMotion } from './SceneMotion.ts';

type Stage = {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly color: string;
  readonly font: string;
};

/** Paints one frame. `steps` is how many 60fps frames have passed since the last one, so speed holds at any refresh rate. */
type Painter = (time: number, steps: number) => void;

const FRAME_MS = 1000 / 60;
const MAX_SCALE = 2;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const wrap = (value: number) => (value > 1.05 ? -0.05 : value < -0.05 ? 1.05 : value);
const points = (count: number) =>
  Array.from({ length: count }, () => ({
    x: random(0, 1),
    y: random(0, 1),
    depth: random(0.3, 1),
    phase: random(0, 6.28),
  }));

function snow({ ctx, width, height, scale }: Stage): Painter {
  const flakes = points(140);
  return (time, steps) => {
    ctx.clearRect(0, 0, width, height);
    flakes.forEach((flake) => {
      flake.y = wrap(flake.y + 0.0012 * flake.depth * steps);
      flake.x = wrap(flake.x + Math.sin(time / 1400 + flake.phase) * 0.0004 * steps);
      ctx.globalAlpha = 0.35 + flake.depth * 0.5;
      ctx.beginPath();
      ctx.arc(flake.x * width, flake.y * height, 2.2 * flake.depth * scale, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}

/** The Matrix's falling code: each column writes its next glyph on its own beat, and older glyphs fade to clear. */
function code({ ctx, width, height, scale, color, font }: Stage): Painter {
  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789TRAKT';
  const size = 18 * scale;
  const columns = Array.from({ length: Math.ceil(width / size) }, () => ({
    row: Math.floor(random(-40, height / size)),
    speed: random(0.05, 0.16),
    due: 0,
  }));
  ctx.font = `${14 * scale}px ${font}`;

  const paint: Painter = (_time, steps) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1 - 0.955 ** steps;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    columns.forEach((column, index) => {
      column.due += column.speed * steps;
      for (; column.due >= 1; column.due -= 1) {
        ctx.fillText(GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)), index * size, column.row * size);
        column.row = column.row * size > height && Math.random() > 0.9 ? Math.floor(random(-20, 0)) : column.row + 1;
      }
    });
  };

  // A still frame needs the trails already drawn.
  if (prefersReducedMotion.current) Array.from({ length: 400 }).forEach(() => paint(0, 1));
  return paint;
}

/** Halt and Catch Fire's CRT: scanlines, a slow bright band rolling down, and now and then a torn line. */
function scanlines({ ctx, width, height, scale, color }: Stage): Painter {
  const tears: { y: number; reach: number; life: number }[] = [];
  return (time, steps) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0 0 0 / 28%)';
    for (let y = 0; y < height; y += 3 * scale) ctx.fillRect(0, y, width, scale);

    const band = (((time / 6000) % 1.3) - 0.15) * height;
    const glow = ctx.createLinearGradient(0, band - 80 * scale, 0, band + 80 * scale);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(0.5, color);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = glow;
    ctx.fillRect(0, band - 80 * scale, width, 160 * scale);

    if (Math.random() > 0.97 ** steps) tears.push({ y: random(0, height), reach: random(0.3, 1), life: 6 });
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    tears.forEach((tear) => ctx.fillRect(width * (1 - tear.reach), tear.y, width * tear.reach, 2 * scale));
    tears.forEach((tear) => (tear.life -= steps));
    tears.splice(0, tears.length, ...tears.filter((tear) => tear.life > 0));
    ctx.globalAlpha = 1;
  };
}

/** Severance's numbers: a grid that bobs gently, swelling where a slow, wandering focus passes over it. */
function numbers({ ctx, width, height, scale, font }: Stage): Painter {
  const cell = 30 * scale;
  const across = Math.ceil(width / cell);
  const digits = Array.from({ length: across * Math.ceil(height / cell) }, () => ({
    digit: String(Math.floor(random(0, 10))),
    phase: random(0, 6.28),
  }));
  ctx.textAlign = 'center';
  return (time) => {
    ctx.clearRect(0, 0, width, height);
    const focusX = (0.55 + 0.25 * Math.sin(time / 5200)) * width;
    const focusY = (0.5 + 0.25 * Math.cos(time / 4300)) * height;
    digits.forEach(({ digit, phase }, index) => {
      const x = (index % across) * cell + cell / 2;
      const y = Math.floor(index / across) * cell + cell / 2;
      const near = Math.max(0, 1 - Math.hypot(x - focusX, y - focusY) / (140 * scale));
      ctx.globalAlpha = 0.12 + near * 0.6;
      ctx.font = `${(13 + near * 9) * scale}px ${font}`;
      ctx.fillText(digit, x, y + Math.sin(time / 900 + phase) * (1 + near * 5) * scale);
    });
    ctx.globalAlpha = 1;
  };
}

function stars({ ctx, width, height, scale }: Stage): Painter {
  const field = points(130);
  return (time, steps) => {
    ctx.clearRect(0, 0, width, height);
    field.forEach((star) => {
      star.x = wrap(star.x - 0.00012 * star.depth * steps);
      ctx.globalAlpha = (0.3 + 0.7 * Math.abs(Math.sin(time / 900 + star.phase))) * star.depth;
      ctx.fillRect(star.x * width, star.y * height, 1.6 * star.depth * scale, 1.6 * star.depth * scale);
    });
    ctx.globalAlpha = 1;
  };
}

/** Warm motes drifting up and pulsing, like the lights in E.T.'s forest. */
function fireflies({ ctx, width, height, scale }: Stage): Painter {
  const motes = points(45);
  return (time, steps) => {
    ctx.clearRect(0, 0, width, height);
    motes.forEach((mote) => {
      mote.y = wrap(mote.y - 0.0006 * mote.depth * steps);
      mote.x = wrap(mote.x + Math.sin(time / 1800 + mote.phase) * 0.0005 * steps);
      ctx.globalAlpha = 0.15 + 0.6 * Math.max(0, Math.sin(time / 1100 + mote.phase * 2));
      ctx.beginPath();
      ctx.arc(mote.x * width, mote.y * height, 2.4 * mote.depth * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
}

const PAINTERS: Readonly<Record<SceneMotion, (stage: Stage) => Painter>> = {
  snow,
  code,
  scanlines,
  numbers,
  stars,
  fireflies,
};

/**
 * Draws an error scene's motion layer on its canvas, in the canvas's CSS `color`. It restarts at the new size when the
 * canvas resizes. With reduced motion it draws one still frame.
 */
export function animateScene(motion: SceneMotion): Attachment<HTMLCanvasElement> {
  return (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const start = () => {
      cancelAnimationFrame(frame);
      const scale = Math.min(MAX_SCALE, devicePixelRatio);
      canvas.width = Math.round(canvas.clientWidth * scale);
      canvas.height = Math.round(canvas.clientHeight * scale);
      const style = getComputedStyle(canvas);
      const paint = PAINTERS[motion]({
        ctx,
        width: canvas.width,
        height: canvas.height,
        scale,
        color: style.color,
        font: style.getPropertyValue('--font-mono'),
      });
      ctx.fillStyle = style.color;

      if (prefersReducedMotion.current) {
        paint(0, 0);
        return;
      }

      let last = performance.now();
      const loop = (time: number) => {
        paint(time, Math.min(4, (time - last) / FRAME_MS));
        last = time;
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(start);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  };
}
