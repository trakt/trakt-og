import type { AboutScene } from '../../about/scenes/AboutScene.ts';
import { withAlpha } from '../../about/scenes/withAlpha.ts';

const CENTER_X = 0.76; /* right of the copy */
const CENTER_Y = 0.55;
const RING_GAP = 60;
const SWEEP_PER_MS = 0.0009;
const WEDGE = 0.18;
const PING_MS = 4000;
const CONTACTS = 21;
const LINGER_MS = 3200;
const CONTACT_RADIUS = 3.2;
const FADE = 0.35;

const TURN = Math.PI * 2;

/** The Hunt for Red October's sonar, in Trakt red: a turning sweep and a ping every few seconds, and contacts that glow
 * as the sweep finds them, then fade. */
export const sonarScene: AboutScene = {
  key: 'sonar',
  still: 60,
  shade: 'full',
  start: ({ ctx, width, height, palette }) => {
    const cx = width * CENTER_X;
    const cy = height * CENTER_Y;
    const reach = Math.max(width, height) * 0.55;
    const contacts = Array.from({ length: CONTACTS }, () => ({
      angle: Math.random() * TURN,
      distance: (0.12 + Math.random() * 0.83) * reach * 0.62,
      seen: -Infinity,
    }));
    const fade = withAlpha(palette.ink, FADE);
    const grid = withAlpha(palette.red, 0.1);
    let before = 0;

    ctx.fillStyle = palette.ink;
    ctx.fillRect(0, 0, width, height);

    return (time) => {
      const sweep = (time * SWEEP_PER_MS) % TURN;
      const swept = (time - before) * SWEEP_PER_MS;
      before = time;
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      Array.from({ length: Math.floor(reach / RING_GAP) }, (_, i) => (i + 1) * RING_GAP).forEach((radius) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, TURN);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - reach, cy);
      ctx.lineTo(cx + reach, cy);
      ctx.moveTo(cx, cy - reach);
      ctx.lineTo(cx, cy + reach);
      ctx.stroke();

      const wedge = ctx.createLinearGradient(cx, cy, cx + Math.cos(sweep) * reach, cy + Math.sin(sweep) * reach);
      wedge.addColorStop(0, withAlpha(palette.red, 0.35));
      wedge.addColorStop(1, withAlpha(palette.red, 0));
      ctx.fillStyle = wedge;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, reach, sweep - WEDGE, sweep);
      ctx.fill();

      const ping = (time % PING_MS) / PING_MS;
      ctx.strokeStyle = withAlpha(palette.red, 0.5 * (1 - ping));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ping * reach * 0.7, 0, TURN);
      ctx.stroke();

      contacts.forEach((contact) => {
        const behind = (sweep - contact.angle + TURN * 2) % TURN;
        if (behind <= Math.max(swept, 0.06)) contact.seen = time;
        const age = time - contact.seen;
        const glow = Math.max(0, 1 - age / LINGER_MS);
        if (glow <= 0) return;
        const x = cx + Math.cos(contact.angle) * contact.distance;
        const y = cy + Math.sin(contact.angle) * contact.distance;
        ctx.fillStyle = withAlpha(palette.red, glow);
        ctx.beginPath();
        ctx.arc(x, y, CONTACT_RADIUS, 0, TURN);
        ctx.fill();
        ctx.strokeStyle = withAlpha(palette.red, glow * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, CONTACT_RADIUS + age / 200, 0, TURN);
        ctx.stroke();
      });

      ctx.fillStyle = palette.red;
      ctx.beginPath();
      ctx.arc(cx, cy, CONTACT_RADIUS, 0, TURN);
      ctx.fill();
    };
  },
};
