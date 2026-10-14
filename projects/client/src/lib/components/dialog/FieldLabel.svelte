<!--
  An art dialog field's label: small uppercase text, with an `aside` at the far end (a note's privacy tag). `for`
  points it at its field; without one it's a plain span with an `id` for `aria-labelledby`.
    <FieldLabel text="Note" for="note-text">{#snippet aside()}<PrivacyTag privacy="public" />{/snippet}</FieldLabel>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  text: string;
  for?: string;
  id?: string;
  aside?: Snippet;
}

const { text, for: htmlFor, id, aside }: Props = $props();
</script>

<div class="field-label">
  {#if htmlFor}<label for={htmlFor}>{text}</label>{:else}<span {id}>{text}</span>{/if}
  {@render aside?.()}
</div>

<style>
.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dialog-art-label-gap);
  margin-block-end: var(--dialog-art-label-gap);
  color: var(--color-dialog-art-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-dialog-art-label);
  line-height: var(--line-height-headings);
  text-transform: uppercase;
}
</style>
