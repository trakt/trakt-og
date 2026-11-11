import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import {
  advanceTraffic,
  courier,
  crossing,
  isOverMoon,
  moonAt,
  openingTraffic,
  type Point,
  SKY,
  type Ship,
  type Shot,
  type SkyStar,
  skyStarAlpha,
  skyStarX,
  spawnSkyStar,
  type Traffic,
} from './skyScene.ts';
import type { SkyControl } from './SkyControl.ts';

/** A slow frame moves the sky this far at most, so a tab coming back doesn't jump it. */
const MAX_FRAME_SECONDS = 0.05;
const MAX_PIXEL_RATIO = 2;
/** Pixels a second the nearest stars drift left. */
const DRIFT = 7;
/** How far the nearest stars lean against the pointer, across and down. */
const LEAN = { x: 36, y: 24 };
const MOON_TIP = "That's no moon.";
/** A click on any of these is the page's, not a call for a ship. */
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, dialog, header, [role="button"]';

type Colors = Record<
  | 'star'
  | 'starBright'
  | 'hull'
  | 'engine'
  | 'ion'
  | 'bolt'
  | 'streak'
  | 'moonLight'
  | 'moonDark'
  | 'crater'
  | 'lens'
  | 'tip',
  string
>;

const color = (style: CSSStyleDeclaration, name: string) => style.getPropertyValue(name).trim();

const glow = (context: CanvasRenderingContext2D, { x, y }: Point, fill: string, radius: number) => {
  context.save();
  context.fillStyle = fill;
  context.shadowColor = fill;
  context.shadowBlur = 7;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawFighter = (context: CanvasRenderingContext2D, colors: Colors) => {
  context.beginPath();
  context.moveTo(-9, 0);
  context.lineTo(10, 0);
  context.moveTo(-8, -7);
  context.lineTo(-2, 0);
  context.lineTo(-8, 7);
  context.moveTo(-4, -7);
  context.lineTo(0, 0);
  context.lineTo(-4, 7);
  context.stroke();
  glow(context, { x: -10, y: 0 }, colors.engine, 1.6);
};

const drawInterceptor = (context: CanvasRenderingContext2D) => {
  context.beginPath();
  context.moveTo(-5, -6);
  context.lineTo(-5, 6);
  context.moveTo(5, -6);
  context.lineTo(5, 6);
  context.moveTo(-5, 0);
  context.lineTo(5, 0);
  context.stroke();
  context.beginPath();
  context.arc(0, 0, 2.6, 0, Math.PI * 2);
  context.fill();
};

const drawCruiser = (context: CanvasRenderingContext2D, colors: Colors) => {
  context.globalAlpha = 0.32;
  context.beginPath();
  context.moveTo(42, 0);
  context.lineTo(-30, -14);
  context.lineTo(-30, 14);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.45;
  context.fillRect(-27, -4, 9, 8);
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(42, 0);
  context.lineTo(-30, -14);
  context.stroke();
  [-7, 0, 7].forEach((y) => glow(context, { x: -31, y }, colors.ion, y === 0 ? 1.8 : 1.3));
};

const drawShip = (context: CanvasRenderingContext2D, ship: Ship, colors: Colors) => {
  context.save();
  context.translate(ship.x, ship.y);
  context.rotate(ship.angle);
  context.strokeStyle = colors.hull;
  context.fillStyle = colors.hull;
  context.lineWidth = 1.3;
  context.globalAlpha = 0.85;
  if (ship.kind === 'fighter') drawFighter(context, colors);
  if (ship.kind === 'interceptor') drawInterceptor(context);
  if (ship.kind === 'cruiser') drawCruiser(context, colors);
  context.restore();
};

const drawBolt = (context: CanvasRenderingContext2D, bolt: Shot) => {
  context.beginPath();
  context.moveTo(bolt.x - Math.cos(bolt.angle) * 7, bolt.y - Math.sin(bolt.angle) * 7);
  context.lineTo(bolt.x, bolt.y);
  context.stroke();
};

const drawStreak = (context: CanvasRenderingContext2D, streak: Shot, colors: Colors) => {
  const tail = { x: streak.x - Math.cos(streak.angle) * 80, y: streak.y - Math.sin(streak.angle) * 80 };
  const gradient = context.createLinearGradient(tail.x, tail.y, streak.x, streak.y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, colors.streak);
  context.globalAlpha = Math.max(0, 1 - streak.age / SKY.streakLife);
  context.strokeStyle = gradient;
  context.beginPath();
  context.moveTo(tail.x, tail.y);
  context.lineTo(streak.x, streak.y);
  context.stroke();
};

/** A dim moon whose dish and trench show once you look at it, with its line under it. */
const drawMoon = (context: CanvasRenderingContext2D, { x, y }: Point, look: number, colors: Colors) => {
  const r = SKY.moonRadius;
  const shade = context.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  shade.addColorStop(0, colors.moonLight);
  shade.addColorStop(1, colors.moonDark);
  context.globalAlpha = 0.4 + 0.45 * look;
  context.fillStyle = shade;
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fill();

  context.globalAlpha = 0.2 + 0.6 * look;
  context.strokeStyle = colors.crater;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x - r * 0.99, y + 1);
  context.lineTo(x + r * 0.99, y + 1);
  context.stroke();
  context.fillStyle = colors.crater;
  context.beginPath();
  context.arc(x - r * 0.35, y - r * 0.38, r * 0.28, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = colors.lens;
  context.beginPath();
  context.arc(x - r * 0.35, y - r * 0.38, r * 0.07, 0, Math.PI * 2);
  context.fill();

  context.globalAlpha = look;
  context.fillStyle = colors.tip;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(MOON_TIP, x, y + r + 10);
  context.globalAlpha = 1;
};

const drawStars = (
  context: CanvasRenderingContext2D,
  {
    stars,
    drift,
    lean,
    seconds,
    width,
    height,
    colors,
  }: {
    stars: readonly SkyStar[];
    drift: number;
    lean: Point;
    seconds: number;
    width: number;
    height: number;
    colors: Colors;
  },
) => {
  stars.forEach((star) => {
    context.globalAlpha = skyStarAlpha({ star, seconds });
    context.fillStyle = star.depth === 1 && star.radius > 1.3 ? colors.starBright : colors.star;
    context.beginPath();
    context.arc(
      skyStarX({ star, drift, width }) - lean.x * LEAN.x * star.depth,
      star.y * height - lean.y * LEAN.y * star.depth,
      star.radius * (0.6 + 0.4 * star.depth),
      0,
      Math.PI * 2,
    );
    context.fill();
  });
  context.globalAlpha = 1;
};

/**
 * Draws the private profile's sky on its canvas: stars that drift and twinkle and lean away from the pointer, ships
 * crossing every few seconds, the odd shooting star, and a moon that isn't one. A click on the open sky sends a ship
 * through that spot, and `ready` hands over a control that launches a courier. Under reduced motion the stars and moon
 * hold still and no ships fly. Colors come from the `--color-private-sky-*` tokens.
 */
export function privateSky(ready: (control: SkyControl) => void): Attachment<HTMLCanvasElement> {
  return (canvas) => {
    const context = canvas.getContext('2d');
    if (!context) return;

    const still = prefersReducedMotion.current;
    const style = getComputedStyle(canvas);
    const token = (name: string) => color(style, `--color-private-sky-${name}`);
    const colors: Colors = {
      star: token('star'),
      starBright: token('star-bright'),
      hull: token('hull'),
      engine: token('engine'),
      ion: token('ion'),
      bolt: token('bolt'),
      streak: token('streak'),
      moonLight: token('moon-light'),
      moonDark: token('moon-dark'),
      crater: token('crater'),
      lens: token('lens'),
      tip: token('tip'),
    };
    const font = `${style.fontSize} ${style.fontFamily}`;
    const random = Math.random;
    const stars = Array.from({ length: SKY.stars }, () => spawnSkyStar(random));
    let traffic: Traffic | null = null;
    let width = 0;
    let height = 0;
    let drift = 0;
    let seconds = 0;
    let look = 0;
    let lean: Point = { x: 0, y: 0 };
    let pointer: Point | null = null;

    const draw = () => {
      const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.lineCap = 'round';
      context.font = font;
      drawStars(context, { stars, drift, lean, seconds, width, height, colors });
      drawMoon(context, moonAt({ width, height, lean }), look, colors);
      if (!traffic) return;

      context.lineWidth = 1.2;
      traffic.streaks.forEach((streak) => drawStreak(context, streak, colors));
      context.globalAlpha = 1;
      traffic.ships.forEach((ship) => drawShip(context, ship, colors));
      context.save();
      context.strokeStyle = colors.bolt;
      context.shadowColor = colors.bolt;
      context.shadowBlur = 6;
      context.lineWidth = 1.6;
      traffic.bolts.forEach((bolt) => drawBolt(context, bolt));
      context.restore();
    };

    const resize = () => {
      const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (!still && !traffic && width > 0) traffic = openingTraffic({ width, height, random });
      draw();
    };
    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
      last = now;
      seconds += elapsed;
      drift += DRIFT * elapsed;
      const target = pointer ? { x: pointer.x / width - 0.5, y: pointer.y / height - 0.5 } : { x: 0, y: 0 };
      const ease = Math.min(1, elapsed * 2.5);
      lean = { x: lean.x + (target.x - lean.x) * ease, y: lean.y + (target.y - lean.y) * ease };
      const over = isOverMoon({ pointer, moon: moonAt({ width, height, lean }) });
      look += ((over ? 1 : 0) - look) * Math.min(1, elapsed * 4);
      if (traffic) traffic = advanceTraffic({ traffic, seconds: elapsed, width, height, random });
      draw();
      frame = requestAnimationFrame(tick);
    };
    const run = (on: boolean) => {
      cancelAnimationFrame(frame);
      if (!on || still) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const watcher = new IntersectionObserver(([entry]) => run(entry?.isIntersecting ?? false));
    watcher.observe(canvas);

    const toSky = (clientX: number, clientY: number): Point | null => {
      const box = canvas.getBoundingClientRect();
      const point = { x: clientX - box.left, y: clientY - box.top };
      return point.x >= 0 && point.y >= 0 && point.x <= box.width && point.y <= box.height ? point : null;
    };
    const onMove = (event: PointerEvent) => {
      pointer = toSky(event.clientX, event.clientY);
      if (!still) return;
      const next = isOverMoon({ pointer, moon: moonAt({ width, height, lean }) }) ? 1 : 0;
      if (next === look) return;
      look = next;
      draw();
    };
    const onLeave = () => {
      pointer = null;
    };
    const onClick = (event: MouseEvent) => {
      if (!traffic) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
      const through = toSky(event.clientX, event.clientY);
      if (!through) return;
      const wave = random() < 0.5 ? 'fighter' : 'interceptor';
      traffic = { ...traffic, ships: [...traffic.ships, ...crossing({ wave, through, width, random })] };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('click', onClick);

    ready({
      launch(from) {
        if (!traffic) return;
        const origin = toSky(from.left + from.width / 2, from.top + from.height / 2);
        if (!origin) return;
        traffic = { ...traffic, ships: [...traffic.ships, courier(origin)] };
      },
    });

    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onClick);
    };
  };
}
