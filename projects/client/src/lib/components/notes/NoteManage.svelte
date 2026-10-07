<!-- The owner's edit and delete icons on a note card, drawn like the comment card's manage icons. -->
<script lang="ts">
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import pencil from '$lib/icons/regular/pen.svg?raw';
import deleteIcon from '$lib/icons/regular/trash-can.svg?raw';

const { onedit, ondelete, busy = false }: {
  onedit: () => void;
  ondelete: () => void;
  busy?: boolean;
} = $props();
</script>

<div class="note-manage">
  <Tooltip text="Edit" placement="bottom">
    {#snippet trigger(tooltip)}
      <button type="button" class="edit" aria-label="Edit" aria-disabled={busy || undefined}
        onclick={() => { if (!busy) onedit(); }} {...tooltip}><Icon svg={pencil} /></button>
    {/snippet}
  </Tooltip>
  <ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!" {busy} placement="bottom"
    onconfirm={ondelete}>
    Delete your note?
  </ManageConfirm>
</div>

<style>
.note-manage {
  display: flex;
  align-items: center;
  gap: var(--comment-tools-gap);
}

.edit,
.note-manage :global(.confirm.delete > button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-tool);
  line-height: 1;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .edit,
  .note-manage :global(.confirm.delete > button) {
    transition: none;
  }
}
</style>
