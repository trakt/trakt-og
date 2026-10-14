import type { Attachment } from 'svelte/attachments';

/** Cmd or Ctrl+Enter anywhere in the form submits it, like the dialogs' "⌘↵ to save" hint says. */
export const submitShortcut: Attachment<HTMLFormElement> = (form) => {
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    form.requestSubmit();
  };
  form.addEventListener('keydown', keydown);
  return () => form.removeEventListener('keydown', keydown);
};
