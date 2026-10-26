import { Mark, markInputRule, markPasteRule } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoiler: { toggleSpoiler: () => ReturnType };
  }
}

const TYPED = /(\[spoiler\]((?:(?!\[\/spoiler\]).)+)\[\/spoiler\])$/i;
const PASTED = /(\[spoiler\]((?:(?!\[\/spoiler\]).)+?)\[\/spoiler\])/gi;

/**
 * `[spoiler]` text. The editor shows it outlined and hatched rather than blurred, so its author can read what they
 * wrote. Typing or pasting the tags around text marks it.
 */
export const SpoilerMark = Mark.create({
  name: 'spoiler',
  parseHTML: () => [{ tag: 'span[data-spoiler]' }],
  renderHTML: () => ['span', { 'data-spoiler': '', class: 'spoiler' }, 0],
  addCommands() {
    return {
      toggleSpoiler:
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
