<!--
  What Manage puts in a list's title row in place of its icons: "N selected" (the filtered count) in a blue pill, then
  the whole-selection actions as icons like the title's own, named in their tooltips: Reset ranks, Copy and Move,
  then Delete in red.
  Reset Ranks and Delete ask first; Copy and Move are ListTransfer's.
-->
<script lang="ts">
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import Icon from '$lib/icons/Icon.svelte';
import file from '$lib/icons/regular/file.svg?raw';
import type { Snippet } from 'svelte';
import resetIcon from '$lib/icons/regular/arrow-down-arrow-up.svg?raw';
import trashXmark from '$lib/icons/regular/trash-xmark.svg?raw';

interface Props {
  count: number;
  busy: boolean;
  onreset: () => void;
  ondelete: () => void;
  transfers?: Snippet;
}

const { count, busy, onreset, ondelete, transfers }: Props = $props();
const items = $derived(`${count.toLocaleString('en-US')} item${count === 1 ? '' : 's'}`);
</script>

<div class="manage" role="group" aria-label="Manage items" aria-busy={busy}>
  <p class="count"><span class="icon-slot"><Icon svg={file} /></span><span><strong>{count.toLocaleString('en-US')}</strong>
    selected</span></p>
  <ManageConfirm name="reset" svg={resetIcon} label="Reset ranks" yes="Yes" {busy} onconfirm={onreset}>
    Set the current order as the ranks of <b>{items}</b>?
  </ManageConfirm>
  {#if transfers}{@render transfers()}{/if}
  <ManageConfirm name="delete" svg={trashXmark} label="Delete items" yes="Yes, delete them!"
    warning="This can't be undone!" {busy} onconfirm={ondelete}>
    Delete <b>{items}</b> from this list?
  </ManageConfirm>
</div>

<style>
.manage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-list-manage-actions);
}

/* The count in a blue pill, the items stat's blue, so it stands apart from the icons: the file icon, the number in
   bold and the word. */
.count {
  display: inline-flex;
  align-items: center;
  gap: var(--space-stat);
  block-size: var(--list-manage-count-height);
  margin: 0;
  padding-inline: var(--space-list-manage-count);
  border: 1px solid var(--color-list-manage-count-border);
  border-radius: calc(var(--list-manage-count-height) / 2);
  background-color: var(--color-list-manage-count-bg);
  color: var(--color-list-manage-count-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-control);
  white-space: nowrap;

  & strong {
    color: var(--color-stat-number);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.icon-slot {
  display: inline-flex;
  color: var(--color-stat-count);
  line-height: 1;
}

.manage :global(.confirm > button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: var(--color-control-text);
  font-size: var(--font-size-list-row-action);
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet);
}

/* Flat, not nested in the global: nested, it loses to the confirm's own `background: none`. */
.manage :global(.confirm > button:is(:hover, :focus-visible)) {
  background-color: var(--color-comment-chip);
}

.manage :global(.delete > button) {
  color: var(--color-list-delete);
}

@media (prefers-reduced-motion: reduce) {
  .manage :global(.confirm > button) {
    transition: none;
  }
}
</style>
