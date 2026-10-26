const STORAGE_KEY = 'og:comment-editor';

/** The composer's field: the rich editor, or the comment's raw markdown. */
export type EditorMode = 'rich' | 'markdown';

/** The field this browser last wrote a comment in, so a member who prefers markdown stays in it. */
export const editorMode = {
  read(): EditorMode {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'markdown' ? 'markdown' : 'rich';
    } catch {
      return 'rich';
    }
  },
  write(mode: EditorMode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Without storage the composer opens rich next time, which is the default anyway.
    }
  },
};
