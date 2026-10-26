<!--
  The inline empty state: one muted italic line inside a menu, picker, popover, dialog or tooltip, where a box or the
  hooded figure would crowd it. `action` is a small button after the line (Try again, Clear filter).
    <EmptyNote>No matching lists.</EmptyNote>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  action?: { readonly onclick: () => void; readonly text: string };
  children: Snippet;
}

const { action, children }: Props = $props();
</script>

<p class="empty-note">
  {@render children()}
  {#if action}<button type="button" onclick={action.onclick}>{action.text}</button>{/if}
</p>

<style>
.empty-note {
  margin: 0;
  color: var(--color-empty-note);
  font-size: var(--font-size-empty-note);
  font-style: italic;
}

button {
  min-block-size: 0;
  margin-inline-start: var(--empty-state-action-gap);
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-link);
  font: inherit;
  font-style: normal;
  font-weight: var(--font-weight-headings);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}
</style>
