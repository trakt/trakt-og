import { Extension } from '@tiptap/core';

/** Cmd/Ctrl+Enter submits, ahead of the hard break the editor would add. */
export const SubmitKeymap = Extension.create<{ onsubmit: () => void }>({
  name: 'submitKeymap',
  priority: 1000,
  addOptions: () => ({ onsubmit: () => {} }),
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        this.options.onsubmit();
        return true;
      },
    };
  },
});
