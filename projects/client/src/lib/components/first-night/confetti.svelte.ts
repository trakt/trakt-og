import type { Attachment } from 'svelte/attachments';

/** Greens, from the done green to a pale mint, with a little gold for sparkle. */
const COLORS = ['#5cb85c', '#3fb950', '#8fe08f', '#c8f7c5', '#2e8b57', '#ffd27a'];
const PIECES = 140;
const DURATION = 2600;

type Piece = { x: number; y: number; vx: number; vy: number; spin: number; angle: number; size: number; color: string };

/**
 * A burst of green confetti from the element's middle, once each time `fired` turns true while the page is open,
 * so a member who just reached ten gets a moment, not one who loads the page already there. Reduced motion skips it.
 */
export const confetti =
  (fired: () => boolean): Attachment<HTMLElement> =>
  (host) => {
    let was: boolean | null = null;
    let frame = 0;

    const burst = () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2000' });
      const ratio = devicePixelRatio || 1;
      canvas.width = innerWidth * ratio;
      canvas.height = innerHeight * ratio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      document.body.append(canvas);
      const context = canvas.getContext('2d');
      if (!context) return canvas.remove();
      context.scale(ratio, ratio);

      const box = host.getBoundingClientRect();
      const origin = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const pieces: Piece[] = Array.from({ length: PIECES }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        return {
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          spin: (Math.random() - 0.5) * 0.4,
          angle: Math.random() * Math.PI,
          size: 5 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#5cb85c',
        };
      });
      const start = performance.now();
      const draw = (now: number) => {
        const t = now - start;
        context.clearRect(0, 0, innerWidth, innerHeight);
        context.globalAlpha = Math.max(0, 1 - t / DURATION);
        for (const piece of pieces) {
          piece.vy += 0.25;
          piece.vx *= 0.99;
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.angle += piece.spin;
          context.save();
          context.translate(piece.x, piece.y);
          context.rotate(piece.angle);
          context.fillStyle = piece.color;
          context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
          context.restore();
        }
        if (t < DURATION) frame = requestAnimationFrame(draw);
        else canvas.remove();
      };
      frame = requestAnimationFrame(draw);
    };

    $effect(() => {
      const now = fired();
      if (was === false && now) burst();
      was = now;
    });

    return () => cancelAnimationFrame(frame);
  };
