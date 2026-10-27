import type { AboutScene } from '../../about/scenes/AboutScene.ts';
import { withAlpha } from '../../about/scenes/withAlpha.ts';

const LINE = 18;
const SCREEN = 330; /* one console's width */
const INSET = 18;
const STEP_MS = 140;
const ALERT_CHANCE = 0.015;
const ALERT_MS = 2200;
const SCANLINE = 3;
const PROBLEM = 'HOUSTON, WE HAVE A PROBLEM';

const pad = (value: string, width: number) => value.padStart(width);
const reading = () =>
  [
    `${pad(String(Math.floor(Math.random() * 99)), 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    pad((Math.random() * 108 - 9).toFixed(2), 6),
    pad((Math.random() * 999).toFixed(1), 6),
    Math.random() > 0.5 ? 'NOM' : 'GO',
  ].join('  ');

/** Apollo 13's mission control: telemetry ticking over on green consoles. Now and then a row flashes the problem in
 * red, then reads RESOLVED with a recent change. */
export const houstonScene: AboutScene = {
  key: 'houston',
  still: 30,
  shade: 'full',
  start: ({ ctx, width, height, palette, lines }) => {
    const rows = Math.ceil(height / LINE) + 1;
    const fixes = lines.length > 0 ? lines : ['the classic Trakt, rebuilt'];
    const screens = Array.from({ length: Math.max(2, Math.floor(width / SCREEN)) }, () => ({
      rows: Array.from({ length: rows }, reading),
      alert: -1,
      since: 0,
      fix: '',
    }));
    const columnWidth = width / screens.length;
    const dim = withAlpha(palette.green, 0.22);
    const resolved = withAlpha(palette.green, 0.75);
    const rule = withAlpha(palette.green, 0.06);
    const scan = withAlpha(palette.ink, 0.18);
    let last = -STEP_MS;

    return (time) => {
      if (time - last < STEP_MS) return;
      last = time;
      ctx.fillStyle = palette.ink;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${LINE - 6}px ui-monospace, Menlo, monospace`;

      screens.forEach((screen, column) => {
        screen.rows.shift();
        screen.rows.push(reading());
        if (screen.alert < 0 && Math.random() < ALERT_CHANCE) {
          screen.alert = rows - 2;
          screen.since = time;
          screen.fix = fixes[Math.floor(Math.random() * fixes.length)] ?? '';
        }
        const fresh = time - screen.since < ALERT_MS;
        screen.rows.forEach((text, row) => {
          const alert = row === screen.alert;
          ctx.fillStyle = alert ? (fresh ? palette.red : resolved) : dim;
          ctx.fillText(
            alert ? (fresh ? PROBLEM : `RESOLVED  ${screen.fix}`) : text,
            column * columnWidth + INSET,
            row * LINE + LINE - 4,
          );
        });
        screen.alert = Math.max(-1, screen.alert - 1);
        ctx.fillStyle = rule;
        ctx.fillRect(column * columnWidth + INSET / 3, 0, 1, height);
      });

      ctx.fillStyle = scan;
      Array.from({ length: Math.ceil(height / SCANLINE) }, (_, i) => i * SCANLINE).forEach((y) =>
        ctx.fillRect(0, y, width, 1),
      );
    };
  },
};
