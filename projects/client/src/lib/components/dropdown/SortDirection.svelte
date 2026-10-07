<!--
  OG's `#sort-direction` next to a sort dropdown: an arrow that points down for the sort's own direction and turns
  red and points up once flipped. A toggle button, so `aria-pressed` says which.
  `joined` makes it the end of a split control after a `<Dropdown joined>`: a bordered square with the wide-short
  sort icons, inside a wrapper that lays the two flush.
    <SortDirection bind:flipped />
    <span class="sort"><Dropdown joined>…</Dropdown><SortDirection joined bind:flipped /></span>
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import sortDown from '$lib/icons/regular/arrow-down-wide-short.svg?raw';
import sortUp from '$lib/icons/regular/arrow-up-wide-short.svg?raw';
import arrow from '$lib/icons/trakt/arrow-right.svg?raw';

let { flipped = $bindable(false), joined = false }: { flipped?: boolean; joined?: boolean } = $props();
</script>

<Tooltip text="Direction">
  {#snippet trigger(tooltip)}
    <button
      type="button"
      class={['direction', { flipped, joined }]}
      aria-label="Reverse the sort"
      aria-pressed={flipped}
      onclick={() => (flipped = !flipped)}
      {...tooltip}
    >
      {#if joined}<Icon svg={flipped ? sortUp : sortDown} />{:else}<Icon svg={arrow} />{/if}
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

    & :global(.icon) {
      rotate: 270deg;
    }
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

    &:is(:hover, :focus-visible) {
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

@media (prefers-reduced-motion: reduce) {
  .direction :global(.icon) {
    transition: none;
  }
}
</style>
