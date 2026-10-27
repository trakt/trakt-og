import type { AboutScene } from '../../about/scenes/AboutScene.ts';
import { withAlpha } from '../../about/scenes/withAlpha.ts';

const LEFT = 0.5; /* right of the copy */
const TOP = 0.1;
const COLUMNS = 22;
const ROWS = 9;
const LIGHT = 0.72; /* of its cell */
/** Re, mi, do, do (an octave down), sol: where each note lights across the board. */
const NOTES = [0.55, 0.7, 0.4, 0.15, 0.95];
const NOTE_MS = 900;
const SPREAD = 3.2;
const SHIMMER = 0.03;
const REST = 0.06;

/** Close Encounters' light board: a dim grid plays the five-note call in red, rests, then plays the answer in white. */
export const encountersScene: AboutScene = {
  key: 'encounters',
  still: 8,
  shade: 'full',
  start: ({ ctx, width, height, palette }) => {
    const cellWidth = (width * (0.97 - LEFT)) / COLUMNS;
    const cellHeight = (height * (1 - TOP * 2)) / ROWS;
    const cycle = NOTE_MS * NOTES.length * 2;
    const cells = Array.from({ length: COLUMNS * ROWS }, (_, i) => ({
      column: i % COLUMNS,
      row: Math.floor(i / COLUMNS),
    }));

    return (time) => {
      const at = time % cycle;
      const step = Math.floor(at / NOTE_MS);
      const answering = step >= NOTES.length;
      const note = NOTES[step % NOTES.length] ?? 0;
      const swell = Math.sin(((at % NOTE_MS) / NOTE_MS) * Math.PI);
      const color = answering ? palette.white : palette.red;

      ctx.fillStyle = palette.ink;
      ctx.fillRect(0, 0, width, height);
      cells.forEach(({ column, row }) => {
        const near = Math.max(0, 1 - Math.abs(column - note * COLUMNS) / SPREAD);
        const glow =
          REST + SHIMMER * Math.sin(time / 770 + column * 0.6 + row) + near * swell * (answering ? 0.55 : 0.85);
        ctx.fillStyle = withAlpha(near > 0 ? color : palette.red, Math.min(1, glow));
        ctx.fillRect(
          width * LEFT + column * cellWidth + (cellWidth * (1 - LIGHT)) / 2,
          height * TOP + row * cellHeight + (cellHeight * (1 - LIGHT)) / 2,
          cellWidth * LIGHT,
          cellHeight * LIGHT,
        );
      });
    };
  },
};
