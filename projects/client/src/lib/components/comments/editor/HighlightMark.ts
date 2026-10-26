import { Mark, markInputRule, markPasteRule } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: { toggleHighlight: () => ReturnType };
  }
}

const TYPED = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/;
const PASTED = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g;

/** `==highlight==`, OG's `<mark>`. Typing or pasting the marks around a word highlights it. */
export const HighlightMark = Mark.create({
  name: 'highlight',
  parseHTML: () => [{ tag: 'mark' }],
  renderHTML: () => ['mark', 0],
  addCommands() {
    return {
      toggleHighlight:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
  addInputRules() {
    return [markInputRule({ find: TYPED, type: this.type })];
  },
  addPasteRules() {
    return [markPasteRule({ find: PASTED, type: this.type })];
  },
});
