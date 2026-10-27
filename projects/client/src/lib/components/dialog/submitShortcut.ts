import type { Attachment } from 'svelte/attachments';

/**
 * Cmd or Ctrl+Enter anywhere in the form's dialog submits it, like the dialogs' "⌘↵ to save" hint says, even while
 * the dialog itself holds focus (check in opens that way). A dialog nested inside it keeps its own keys.
 */
export const submitShortcut: Attachment<HTMLFormElement> = (form) => {
  const scope: HTMLElement = form.closest('dialog') ?? form;
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    if (event.target instanceof Element && (event.target.closest('dialog') ?? form) !== scope) return;
    event.preventDefault();
    form.requestSubmit();
  };
  scope.addEventListener('keydown', keydown);
  return () => scope.removeEventListener('keydown', keydown);
};
