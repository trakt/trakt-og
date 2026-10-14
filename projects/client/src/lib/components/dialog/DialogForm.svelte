<!--
  An art dialog's form: its fields in a column, then a footer bar with the save shortcut hint, Cancel and the red
  Save. Cmd or Ctrl+Enter anywhere in it saves. `onsubmit` only runs when it isn't busy or disabled.
    <DialogForm save="Save Note" {busy} onsubmit={() => onsave(draft)} oncancel={() => (open = false)}>...</DialogForm>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { modifierKey } from './modifierKey.ts';
import { submitShortcut } from './submitShortcut.ts';

interface Props {
  /** The Save button's text. */
  save: string;
  busy?: boolean;
  /** Save is off: a new list without a name, the notes or lists limit reached. */
  disabled?: boolean;
  onsubmit: () => void;
  oncancel: () => void;
  children: Snippet;
}

const { save, busy = false, disabled = false, onsubmit, oncancel, children }: Props = $props();
// The server can't tell the platform, so the hint starts as Ctrl and the browser corrects it.
const showModifier = (kbd: HTMLElement) => {
  kbd.textContent = modifierKey(navigator.platform);
};
</script>

<form
  class="dialog-form"
  aria-busy={busy}
  {@attach submitShortcut}
  onsubmit={(event) => {
    event.preventDefault();
    if (!busy && !disabled) onsubmit();
  }}
>
  <div class="fields">{@render children()}</div>
  <footer>
    <span class="shortcut"><kbd {@attach showModifier}>Ctrl</kbd><kbd>↵</kbd> to save</span>
    <button type="button" class="cancel" onclick={oncancel}>Cancel</button>
    <button type="submit" class="save" disabled={busy || disabled} aria-busy={busy}>{save}</button>
  </footer>
</form>

<style>
.fields {
  display: grid;
  gap: var(--dialog-art-gap);
  padding: var(--dialog-art-body-top) var(--dialog-art-inline) 0;
}

footer {
  display: flex;
  align-items: center;
  gap: var(--dialog-art-footer-gap);
  margin-block-start: var(--dialog-art-body-top);
  padding: var(--dialog-art-footer-padding);
  border-block-start: 1px solid var(--color-dialog-art-border);
  background-color: var(--color-dialog-art-footer-bg);
}

.shortcut {
  display: inline-flex;
  flex: 1;
  align-items: center;
  gap: var(--dialog-art-kbd-gap);
  color: var(--color-dialog-art-hint);
  font-size: var(--font-size-dialog-art-hint);

  /* Touch screens rarely have the keys. */
  @media (hover: none) {
    visibility: hidden;
  }
}

kbd {
  padding: var(--dialog-art-kbd-padding);
  border: 1px solid var(--color-dialog-art-kbd-border);
  border-block-end-width: 2px;
  border-radius: var(--radius-toggle-chip-count);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-kbd);
  font-weight: var(--font-weight-headings);
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--dialog-art-button-height);
  padding: var(--dialog-art-button-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-dialog-art-button-hover);
  }
}

.save {
  border-color: var(--brand-primary);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);

  &:hover:not(:disabled) {
    border-color: var(--brand-primary-darken);
    background-color: var(--brand-primary-darken);
  }

  &:disabled {
    opacity: var(--opacity-action-disabled);
    cursor: default;
  }
}
</style>
