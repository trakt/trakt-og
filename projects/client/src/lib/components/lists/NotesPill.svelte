<!--
  The glass pill centred over a list poster's bottom: "Read Note" opens the owner's notes, and the dashed `add` one
  starts a note. Any other attribute goes on the button.
    <NotesPill svg={memo} label="Read Note" onclick={open} />
-->
<script lang="ts">
import type { HTMLButtonAttributes } from 'svelte/elements';
import Icon from '$lib/icons/Icon.svelte';

interface Props extends Omit<HTMLButtonAttributes, 'class' | 'type'> {
  svg: string;
  label: string;
  /** Dashed, for a poster without notes yet. */
  add?: boolean;
}

const { svg, label, add = false, ...rest }: Props = $props();
</script>

<button type="button" class={['notes-pill', { add }]} {...rest}><Icon {svg} />{label}</button>

<style>
.notes-pill {
  position: absolute;
  inset-block-end: var(--read-notes-pill-bottom);
  inset-inline-start: 50%;
  display: inline-flex;
  align-items: center;
  gap: var(--read-notes-pill-gap);
  block-size: var(--read-notes-pill-height);
  min-block-size: 0;
  padding: 0 var(--read-notes-pill-padding);
  border: 1px solid var(--color-read-notes-border);
  border-radius: var(--radius-read-notes-pill);
  background-color: var(--color-read-notes-pill-bg);
  backdrop-filter: var(--blur-read-notes-pill);
  color: var(--color-read-notes-pill-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-read-notes-pill);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-read-notes-pill);
  text-transform: uppercase;
  white-space: nowrap;
  translate: -50% 0;
  pointer-events: auto;
  cursor: pointer;
  transition: opacity var(--transition-read-notes), background-color var(--transition-read-notes);

  &:hover {
    background-color: var(--color-read-notes-pill-hover);
  }

  & :global(.icon) {
    color: var(--color-read-notes-pill-icon);
  }

  &.add {
    border-style: dashed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
</style>
