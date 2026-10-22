import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  turn: number;
  spin: number;
  color: string;
};

const PIECES = 160;
const SECONDS = 3.2;
const GRAVITY = 0.32;
const DRAG = 0.985;
// The colors, read off the tokens so the burst stays in the brand.
const TOKENS = ['--color-confetti-1', '--color-confetti-2', '--color-confetti-3', '--color-confetti-4'];

function pieces(origin: DOMRect, colors: readonly string[]): Piece[] {
  return Array.from({ length: PIECES }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 6 + Math.random() * 9;
    return {
      x: origin.left + Math.random() * origin.width,
      y: origin.top + origin.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      turn: Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#fff',
    };
  });
}

/**
 * One burst of confetti from the element it's attached to, over the whole window, then gone: the person page's
 * birthday. It never takes the pointer, and with reduced motion there's none.
 *   <h1 {@attach confettiBurst}>
 */
export const confettiBurst: Attachment<HTMLElement> = (element) => {
  if (prefersReducedMotion.current) return;

  const root = getComputedStyle(document.documentElement);
  const colors = TOKENS.map((token) => root.getPropertyValue(token).trim()).filter(Boolean);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    zIndex: 'var(--z-easter)',
    pointerEvents: 'none',
    width: '100vw',
    height: '100vh',
  });
  const ratio = globalThis.devicePixelRatio || 1;
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  context?.scale(ratio, ratio);

  const burst = pieces(element.getBoundingClientRect(), colors);
  const start = performance.now();
  let frame = 0;
  const draw = (now: number) => {
    const elapsed = (now - start) / 1000;
    if (!context || elapsed > SECONDS) {
      canvas.remove();
      return;
    }
    context.clearRect(0, 0, innerWidth, innerHeight);
    context.globalAlpha = Math.max(0, 1 - elapsed / SECONDS);
    for (const piece of burst) {
      piece.vy += GRAVITY;
      piece.vx *= DRAG;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.turn += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.turn);
      context.fillStyle = piece.color;
      context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h * Math.abs(Math.cos(piece.turn * 2)));
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    canvas.remove();
  };
};
