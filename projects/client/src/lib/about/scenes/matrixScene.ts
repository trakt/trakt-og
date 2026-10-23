import type { AboutScene } from './AboutScene.ts';
import { withAlpha } from './withAlpha.ts';

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789TRAKTOGREDUX';
const CELL = 16;
/** The film's rain runs slow; it steps about 20 times a second. */
const STEP_MS = 50;
const TRAIL = 0.1;
const BODY = 0.6;
const HEAD_GLINT = 0.9;
const RESTART = 0.975;

const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0';

/** The Matrix's digital rain, in Trakt red: each stream led by its brightest glyph, the odd one white. */
export const matrixScene: AboutScene = {
  key: 'matrix',
  still: 120,
  shade: 'full',
  start: ({ ctx, width, height, palette }) => {
    const drops = Array.from({ length: Math.ceil(width / CELL) }, () => (Math.random() * -height) / CELL);
    const trail = withAlpha(palette.ink, TRAIL);
    const body = withAlpha(palette.red, BODY);
    let last = -STEP_MS;

    ctx.fillStyle = palette.ink;
    ctx.fillRect(0, 0, width, height);

    return (time) => {
      if (time - last < STEP_MS) return;
      last = time;
      ctx.fillStyle = trail;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${CELL - 2}px ui-monospace, Menlo, monospace`;
      drops.forEach((drop, column) => {
        const y = drop * CELL;
        ctx.fillStyle = body;
        ctx.fillText(glyph(), column * CELL, y - CELL);
        ctx.fillStyle = Math.random() > HEAD_GLINT ? 'white' : palette.red;
        ctx.fillText(glyph(), column * CELL, y);
        drops[column] = y > height && Math.random() > RESTART ? 0 : drop + 1;
      });
    };
  },
};
