<!--
  The glass strip of edit icons across the bottom of a list poster (manage mode) or a lists-page tile (reorder): round
  icon buttons on the notes sheet's glass. Buttons spread evenly across a poster; `centered` keeps them together on a
  wide tile. A button with the `edge` class (Move first on the first item) dims, and `drag` takes the grab cursor.
    <EditStrip><button type="button" aria-label="Move first">...</button></EditStrip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { centered = false, children }: { centered?: boolean; children: Snippet } = $props();
</script>

<div class={['edit-strip', { centered }]}>{@render children()}</div>

<style>
.edit-strip {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  block-size: var(--list-edit-bar-height);
  padding-inline: var(--list-edit-bar-padding);
  border-block-start: 1px solid var(--color-read-notes-border);
  background-color: var(--color-list-edit-bar);
  backdrop-filter: var(--blur-list-edit-bar);
  color: var(--color-card-text);

  &.centered {
    justify-content: center;
    gap: var(--list-edit-centered-gap);
  }

  & :global(button) {
    display: grid;
    place-items: center;
    inline-size: var(--list-edit-button-size);
    block-size: var(--list-edit-button-size);
    min-block-size: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: inherit;
    font-size: var(--font-size-list-edit);
    line-height: 1;
    cursor: pointer;
    transition: background-color var(--transition-read-notes), color var(--transition-read-notes);
  }

  & :global(button:hover:not([aria-disabled='true'])) {
    background-color: var(--color-list-edit-button-hover);
  }

  & :global(button[aria-disabled='true']) {
    cursor: default;
  }

  /* Dimmed only at the list's ends, not while a save is running, so the strip doesn't flicker on every move. */
  & :global(button.edge) {
    opacity: var(--opacity-list-edit-disabled);
  }

  & :global(button:focus-visible) {
    outline: var(--list-reorder-rank-border) solid var(--color-input-border-focus);
    outline-offset: 0;
  }

  & :global(button.drag) {
    cursor: grab;
    touch-action: none;
  }

  @media (prefers-reduced-motion: reduce) {
    & :global(button) {
      transition: none;
    }
  }
}
</style>
