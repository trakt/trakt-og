import type { AboutScene } from './AboutScene.ts';
import { withAlpha } from './withAlpha.ts';

const LINE = 20;
const TOP = 84; /* clear of the fixed header */
const LEFT = 0.52; /* right of the copy */
const TYPE_MS = 18;
const CHARS_A_STEP = 3;
const BLINK_MS = 500;
const PROMPT = 'root@fsociety:~/trakt-og#';
const GREETING = 'hello, friend';

/** The log the terminal types, one session after another: a git log, then the greeting. */
const session = (lines: readonly string[], start: number) => [
  `${PROMPT} git log --oneline -n 12`,
  ...Array.from({ length: Math.min(12, lines.length) }, (_, i) => lines[(start + i) % lines.length] ?? ''),
  `${PROMPT} echo "${GREETING}"`,
  GREETING,
];

/** Mr. Robot's terminal: the real recent changes typed out at an fsociety prompt, with a blinking red cursor. */
export const robotScene: AboutScene = {
  key: 'robot',
  still: 1,
  shade: 'full',
  start: ({ ctx, width, height, palette, lines }) => {
    const rows = Math.max(1, Math.floor((height - TOP) / LINE) - 1);
    const source = lines.length > 0 ? lines : ['0000000 feat(og): the classic Trakt, rebuilt'];
    let script = session(source, 0);
    let sessions = 1;
    let line = 0;
    let char = 0;
    let last = 0;
    // The screen starts full, so the first frame already reads as a terminal mid-session.
    const shown = script.slice(0, Math.min(script.length - 1, rows - 1));
    line = shown.length;
    shown.push('');

    const nextLine = () => {
      line += 1;
      char = 0;
      shown.push('');
      if (line < script.length) return;
      script = session(source, sessions * 12);
      sessions += 1;
      line = 0;
    };

    const type = () => {
      const text = script[line] ?? '';
      const typed = Math.min(text.length, char + CHARS_A_STEP);
      shown[shown.length - 1] = text.slice(0, typed);
      char = typed;
      if (typed >= text.length) nextLine();
      while (shown.length > rows) shown.shift();
    };

    const colorOf = (text: string) => {
      if (text.startsWith('root@')) return palette.red;
      return text === GREETING ? 'white' : withAlpha('#ffffff', 0.55);
    };

    return (time) => {
      if (time - last > TYPE_MS) {
        last = time;
        type();
      }
      ctx.fillStyle = palette.ink;
      ctx.fillRect(0, 0, width, height);
      ctx.font = '14px ui-monospace, Menlo, monospace';
      const x = width * LEFT;
      shown.forEach((text, row) => {
        ctx.fillStyle = colorOf(text);
        ctx.fillText(text, x, TOP + row * LINE);
      });
      if (Math.floor(time / BLINK_MS) % 2 === 0) return;
      const current = shown.at(-1) ?? '';
      ctx.fillStyle = palette.red;
      ctx.fillRect(x + ctx.measureText(current).width + 2, TOP + (shown.length - 1) * LINE - 13, 8, 16);
    };
  },
};
