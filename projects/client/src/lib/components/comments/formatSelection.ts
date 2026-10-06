// What the comment toolbar's buttons type, in the comment syntax `parseComment` renders.
const WRAPS = {
  bold: ['**', '**'],
  italic: ['_', '_'],
  strike: ['~~', '~~'],
  highlight: ['==', '=='],
  spoiler: ['[spoiler]', '[/spoiler]'],
  code: ['`', '`'],
} as const;
const PREFIXES = { list: '- ', quote: '> ' } as const;

// A list can't interrupt a paragraph, so one typed under a line of text needs a blank line first.
const LIST_ITEM = /^ {0,3}(?:[*+-]|\d+\.) +/;
const BLANK = /^\s*$/;

export type CommentFormat = keyof typeof WRAPS | keyof typeof PREFIXES;

/** A textarea's value and its selection, as `selectionStart` and `selectionEnd`. */
export type TextSelection = { readonly text: string; readonly start: number; readonly end: number };

const isBlank = (line: string) => BLANK.test(line);

function wrap({ text, start, end }: TextSelection, open: string, close: string): TextSelection {
  // Already wrapped: the same button takes the marks off again.
  if (end > start && text.slice(start - open.length, start) === open && text.slice(end, end + close.length) === close) {
    const inner = text.slice(start, end);
    const from = start - open.length;
    return {
      text: text.slice(0, from) + inner + text.slice(end + close.length),
      start: from,
      end: from + inner.length,
    };
  }

  const selected = text.slice(start, end);
  const inner = selected.trim();
  // Nothing picked: the marks go in with the cursor between them.
  if (!inner) {
    const at = start + open.length;
    return { text: text.slice(0, start) + open + close + text.slice(start), start: at, end: at };
  }

  // A double click often picks the space after a word too; the marks hug the word.
  const lead = selected.length - selected.trimStart().length;
  const trail = selected.length - selected.trimEnd().length;
  const from = start + lead + open.length;
  return {
    text: text.slice(0, start + lead) + open + inner + close + text.slice(end - trail),
    start: from,
    end: from + inner.length,
  };
}

function prefixLines({ text, start, end }: TextSelection, format: keyof typeof PREFIXES): TextSelection {
  const prefix = PREFIXES[format];
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  // A selection that ends at the start of a line leaves that line alone.
  const last = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const newline = text.indexOf('\n', last);
  const lineEnd = newline === -1 ? text.length : newline;

  const lines = text.slice(lineStart, lineEnd).split('\n');
  // A quote keeps its blank lines so it stays one quote; a list skips them, unless that's all there is.
  const marked = lines.map((line) => format === 'list' && isBlank(line) && lines.length > 1 ? line : prefix + line)
    .join('\n');

  const previous = text.slice(text.lastIndexOf('\n', lineStart - 2) + 1, Math.max(lineStart - 1, 0));
  const gap = format === 'list' && lineStart > 0 && !isBlank(previous) && !LIST_ITEM.test(previous) ? '\n' : '';
  const result = text.slice(0, lineStart) + gap + marked + text.slice(lineEnd);

  if (start === end) {
    const at = start + gap.length + prefix.length;
    return { text: result, start: at, end: at };
  }
  const from = lineStart + gap.length;
  return { text: result, start: from, end: from + marked.length };
}

/**
 * The textarea after a toolbar button: bold, italic, strikethrough, highlight, spoiler and code wrap the selection in
 * their marks (or take them off a selection that has them), and list and quote start each selected line with `- ` or
 * `> `. The selection that comes back covers what was formatted, or sits where the cursor goes next.
 */
export function formatSelection(selection: TextSelection, format: CommentFormat): TextSelection {
  if (format === 'list' || format === 'quote') return prefixLines(selection, format);
  const [open, close] = WRAPS[format];
  return wrap(selection, open, close);
}
