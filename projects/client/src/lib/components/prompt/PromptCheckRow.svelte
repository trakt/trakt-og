<!--
  An on/off choice in a `PromptPopover`, drawn like a `PromptRow` with a checkbox in the icon's place, ticked in the
  prompt's action color. It changes what the rows under it do rather than acting itself: the watch prompt's "Include
  unwatched episodes before it".
    <PromptCheckRow bind:checked={upTo}>Include unwatched episodes before it</PromptCheckRow>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  checked: boolean;
  children: Snippet;
}

let { checked = $bindable(), children }: Props = $props();
</script>

<label class="row">
  <span class="box-slot"><input type="checkbox" bind:checked /></span>
  <span class="label">{@render children()}</span>
</label>

<style>
.row {
  display: flex;
  align-items: center;
  gap: var(--space-prompt-row-icon);
  padding: var(--space-menu-row);
  border-radius: var(--radius-menu-row);
  line-height: var(--line-height-base);
  cursor: pointer;

  &:is(:hover, :focus-within) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
  }
}

/* As wide as a row's fixed-width icon (`Icon`'s 1.25em), so the label lines up with the rows under it. */
.box-slot {
  display: inline-grid;
  flex: none;
  place-items: center;
  inline-size: 1.25em;
  font-size: var(--font-size-prompt-row-icon);
}

input {
  margin: 0;
  accent-color: var(--tone);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-input-border-focus);
    outline-offset: 1px;
  }
}

.label {
  min-inline-size: 0;
}
</style>
