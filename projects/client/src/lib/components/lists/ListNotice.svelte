<!--
  A one-off offer over a lists page or a list, in the dialogs' amber notice: a line of text, then its action and a
  quiet way to say no. Bringing back classic saved filters as smart lists, or letting a list an app stopped syncing
  fill itself.
    <ListNotice action="Bring back 2" {busy} onaction={importFilters} ondismiss={dismiss}>You had …</ListNotice>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** The action's label. */
  action: string;
  busy?: boolean;
  onaction: () => void;
  /** Left out, there's no way to say no: the offer goes when it's taken. */
  ondismiss?: () => void;
  children: Snippet;
}

const { action, busy = false, onaction, ondismiss, children }: Props = $props();
</script>

<div class="list-notice" role="status">
  <p>{@render children()}</p>
  <span class="buttons">
    <button type="button" class="action" disabled={busy} onclick={onaction}>{busy ? 'Working…' : action}</button>
    {#if ondismiss}<button type="button" class="dismiss" disabled={busy} onclick={ondismiss}>No thanks</button>{/if}
  </span>
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

.buttons {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
}

button {
  min-block-size: var(--control-height-small);
  padding: 0 var(--space-sm-inline);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: none;
  color: inherit;
  font: inherit;
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: var(--opacity-action-disabled);
  }
}

.action {
  border-color: var(--color-dialog-art-alert-border);
  background-color: var(--color-control-bg);

  &:is(:hover, :focus-visible):not(:disabled) {
    border-color: var(--color-control-border-hover);
  }
}

.dismiss:is(:hover, :focus-visible):not(:disabled) {
  text-decoration: underline;
}
</style>
