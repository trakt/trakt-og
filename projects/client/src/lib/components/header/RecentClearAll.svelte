<!--
  Recent's Clear All: an × like each recent row's, lined up with theirs and hidden until its header is pointed at or
  focused, with a Clear All tooltip on its right. The header search's Recent heading and the search page's Recent
  section put it at the far end.
    <RecentClearAll onclick={clear} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/light/xmark.svg?raw';

interface Props {
  onclick: () => void;
}

const { onclick }: Props = $props();
</script>

<Tooltip text="Clear All" placement="right">
  {#snippet trigger(tooltip)}
    <button type="button" class="recent-clear-all" aria-label="Clear all recent searches" {...tooltip} {onclick}
      ><Icon svg={xmark} /></button>
  {/snippet}
</Tooltip>

<style>
.recent-clear-all {
  display: grid;
  place-items: center;
  min-block-size: 0;
  margin-block: calc(-1 * var(--space-sm-block));
  margin-inline-end: calc(-1 * var(--space-base-inline));
  padding: var(--space-sm-block) var(--space-base-inline);
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--color-search-term);
  font-size: var(--font-size-base);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  :global(:is(:hover, :focus-within)) > & {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recent-clear-all {
    transition: none;
  }
}
</style>
