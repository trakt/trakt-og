<!--
  One choice in a `PromptPopover`, drawn like a dropdown row: an icon, the label, and an optional gray detail on the
  right ("Check in", "Can't be undone"). `danger` turns it red for a remove or delete. Other attributes go on the
  button, like `aria-haspopup` when it opens a dialog of its own.
    <PromptRow svg={trash} danger detail="Can't be undone" onclick={confirm}>Yes, delete it!</PromptRow>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import Icon from '$lib/icons/Icon.svelte';

interface Props extends Omit<HTMLButtonAttributes, 'children'> {
  svg?: string;
  detail?: string;
  danger?: boolean;
  children: Snippet;
}

const { svg, detail, danger = false, children, ...rest }: Props = $props();
</script>

<button type="button" class={['row', { danger }]} {...rest}>
  {#if svg}<span class="icon-slot"><Icon {svg} fixedWidth /></span>{/if}
  <span class="label">{@render children()}</span>
  {#if detail}<span class="detail">{detail}</span>{/if}
</button>

<style>
.row {
  display: flex;
  align-items: center;
  gap: var(--space-prompt-row-icon);
  inline-size: 100%;
  min-block-size: 0;
  padding: var(--space-menu-row);
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: inherit;
  font: inherit;
  line-height: var(--line-height-base);
  text-align: start;
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
    outline: none;
  }

  &.danger {
    color: var(--brand-primary);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.icon-slot {
  display: inline-flex;
  color: var(--color-menu-header);
  font-size: var(--font-size-prompt-row-icon);

  .danger & {
    color: var(--brand-primary);
  }
}

.label {
  min-inline-size: 0;
}

.detail {
  margin-inline-start: auto;
  padding-inline-start: var(--space-menu-check);
  color: var(--color-menu-header);
  font-size: var(--font-size-small);
  font-weight: normal;
  white-space: nowrap;
}
</style>
