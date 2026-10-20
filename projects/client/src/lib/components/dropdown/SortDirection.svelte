<!--
  OG's `#sort-direction` next to a sort dropdown: an arrow that points the way the list runs, down for descending
  (newest, highest, Z first) and up for ascending, red once flipped from the sort's own direction. `descending` says
  which way the sort runs unflipped, so the arrow is right before anyone touches it. A toggle button, so `aria-pressed`
  says whether it's flipped. Pages put `flipped` back to false when the sort changes, so each sort starts in its own
  direction.
  `joined` makes it the end of a split control after a `<Dropdown joined>`: a bordered square with the wide-short
  sort icons, inside a wrapper that lays the two flush. Every sort dropdown gets one: `disabled` greys it out where the
  page or the picked sort can't reverse.
    <SortDirection bind:flipped descending />
    <span class="sort"><Dropdown joined>…</Dropdown><SortDirection joined bind:flipped descending={by !== 'title'} /></span>
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import sortDown from '$lib/icons/regular/arrow-down-wide-short.svg?raw';
import sortUp from '$lib/icons/regular/arrow-up-wide-short.svg?raw';
import arrow from '$lib/icons/trakt/arrow-right.svg?raw';

let { flipped = $bindable(false), descending = false, joined = false, disabled = false }: {
  flipped?: boolean;
  /** The sort runs high to low (newest, most, Z first) before it's flipped. */
  descending?: boolean;
  joined?: boolean;
  disabled?: boolean;
} = $props();
const down = $derived(descending !== (flipped && !disabled));
</script>

<Tooltip text={disabled ? "This sort can't be reversed" : down ? 'Descending' : 'Ascending'}>
  {#snippet trigger(tooltip)}
    <button
      type="button"
      class={['direction', { flipped: flipped && !disabled, up: !down, joined }]}
      aria-label="Reverse the sort"
      aria-pressed={flipped && !disabled}
      aria-disabled={disabled}
      onclick={() => {
        if (!disabled) flipped = !flipped;
      }}
      {...tooltip}
    >
      {#if joined}<Icon svg={down ? sortDown : sortUp} />{:else}<Icon svg={arrow} />{/if}
    </button>
  {/snippet}
</Tooltip>

<style>
.direction {
  min-block-size: 0;
  margin: 0 7px 0 9px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: var(--font-size-sort-direction);
  line-height: 1;
  vertical-align: middle;
  transition: color 0.5s;

  & :global(.icon) {
    rotate: 90deg;
    transition: rotate 0.5s;
  }

  &.flipped {
    color: var(--brand-primary);
  }

  &.up :global(.icon) {
    rotate: 270deg;
  }

  &.joined {
    display: inline-grid;
    place-items: center;
    inline-size: var(--control-height);
    block-size: var(--control-height);
    margin: 0 0 0 -1px;
    border: 1px solid var(--color-control-border);
    border-start-end-radius: var(--radius-control);
    border-end-end-radius: var(--radius-control);
    background-color: var(--color-control-bg);
    color: var(--color-control-text);
    font-size: var(--font-size-tool-icon-small);

    &:is(:hover, :focus-visible):not([aria-disabled='true']) {
      position: relative;
      border-color: var(--color-control-border-hover);
      background-color: var(--color-control-hover-bg);
    }

    &.flipped {
      color: var(--brand-primary);
    }

    & :global(.icon) {
      rotate: none;
    }
  }
}

.direction[aria-disabled='true'] {
  opacity: var(--opacity-action-disabled);
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .direction :global(.icon) {
    transition: none;
  }
}
</style>
