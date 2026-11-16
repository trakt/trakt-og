<!--
  A one-off offer over a list, in the dialogs' amber notice: a line of text, then its action. It stays until the offer
  is taken, like letting a list an app stopped syncing fill itself.
    <ListNotice action="Make it a smart list" {busy} onaction={convert}>Synced from …</ListNotice>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** The action's label. */
  action: string;
  busy?: boolean;
  onaction: () => void;
  children: Snippet;
}

const { action, busy = false, onaction, children }: Props = $props();
</script>

<div class="list-notice" role="status">
  <p>{@render children()}</p>
  <button type="button" disabled={busy} onclick={onaction}>{busy ? 'Working…' : action}</button>
</div>

<style>
.list-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-base-block) var(--gutter);
  margin-block-start: var(--list-card-spacing);
  padding: var(--dialog-art-alert-padding);
  border: 1px solid var(--color-dialog-art-alert-border);
  border-radius: var(--radius-control);
  background-color: var(--color-dialog-art-alert-bg);
  color: var(--color-dialog-art-alert-text);
  font-size: var(--font-size-dialog-notice);

  & p {
    flex: 1 1 var(--list-notice-text-basis);
    margin: 0;
  }
}

button {
  min-block-size: var(--control-height-small);
  padding: 0 var(--space-sm-inline);
  border: 1px solid var(--color-dialog-art-alert-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: inherit;
  font: inherit;
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:is(:hover, :focus-visible):not(:disabled) {
    border-color: var(--color-control-border-hover);
  }

  &:disabled {
    cursor: default;
    opacity: var(--opacity-action-disabled);
  }
}
</style>
