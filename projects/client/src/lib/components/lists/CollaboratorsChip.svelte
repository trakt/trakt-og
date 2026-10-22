<!--
  A list's orange "N collaborators" chip, drawn as a comment tag with its count on a darker segment, that opens the
  collaborators panel. The list rows and the list page's title share it.
    <CollaboratorsChip {collaborators} list={{ name, poster }} {owner} />
-->
<script lang="ts">
import type { ComponentProps } from 'svelte';
import CollaboratorsPanel from './CollaboratorsPanel.svelte';

type Props = Omit<ComponentProps<typeof CollaboratorsPanel>, 'trigger'>;

const { collaborators, list, owner }: Props = $props();
</script>

<CollaboratorsPanel {collaborators} {list} {owner}>
  {#snippet trigger(attrs)}
    <button type="button" class="chip" {...attrs}>
      <strong class="count">{collaborators.length}</strong>{collaborators.length === 1 ? 'collaborator' : 'collaborators'}
    </button>
  {/snippet}
</CollaboratorsPanel>

<style>
.chip {
  --tone: var(--color-list-chip-collaborators);
  display: inline-flex;
  align-items: center;
  gap: var(--list-card-chip-gap);
  block-size: var(--comment-chip-height);
  /* Off the global button's height, padding and line height, so it sits like the other chips. */
  min-block-size: 0;
  margin: 0;
  padding: 0 var(--comment-chip-padding) 0 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-list-card-chip);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-tag);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  transition: background-color var(--transition-list-card);

  &:is(:hover, :focus-visible) {
    background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-count-tint), transparent);
  }
}

/* The count leads, on a darker segment of the chip. */
.count {
  display: inline-grid;
  place-items: center;
  align-self: stretch;
  padding-inline: var(--comment-chip-padding);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-count-tint), transparent);
  color: var(--color-text);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
