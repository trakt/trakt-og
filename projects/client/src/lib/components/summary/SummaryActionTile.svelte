<!--
  A side tile in a `SummaryAction`'s `tiles` (the +), with its tooltip on the right saying what it does.
    <SummaryActionTile icon={plus} label="Add another play" onclick={add} />
  The other props land on the button. `hint={false}` holds the tooltip back while what the tile opens is showing.
-->
<script lang="ts">
import type { HTMLButtonAttributes } from 'svelte/elements';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';

interface Props extends Omit<HTMLButtonAttributes, 'type'> {
  icon: string;
  /** Names the tile and is its tooltip. */
  label: string;
  hint?: boolean;
  element?: HTMLButtonElement;
}

let { icon, label, hint = true, element = $bindable(), ...rest }: Props = $props();
</script>

<Tooltip text={hint ? label : undefined} placement="right">
  {#snippet trigger(tip)}
    <button bind:this={element} type="button" class="tile" aria-label={label} {...rest} {...tip}><Icon svg={icon} /></button>
  {/snippet}
</Tooltip>

<style>
.tile {
  flex: 2;
  display: grid;
  place-items: center;
  min-block-size: 0;
  margin: var(--tile-inset);
  padding: 0;
  border: 0;
  border-radius: var(--radius-summary-action);
  background: var(--tile-bg);
  color: var(--tile-color);
  font-size: var(--summary-action-tile-icon-size);
  cursor: pointer;
  transition: background-color var(--transition-summary-action), margin var(--transition-summary-action);

  &:is(:hover, :focus-visible) {
    background: var(--tile-hover-bg);
    filter: var(--tile-hover-filter);
  }

  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }

  &:is([disabled], [aria-disabled='true']) {
    cursor: default;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }
}
</style>
