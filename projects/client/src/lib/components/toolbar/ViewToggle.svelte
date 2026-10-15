<!--
  A toolbar icon that flips a page between a grid of cards and a list of rows. It shows the view a click switches to,
  and its tooltip says so.
    <ViewToggle bind:view />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import grid2 from '$lib/icons/regular/grid-2.svg?raw';
import list from '$lib/icons/regular/list.svg?raw';

let { view = $bindable() }: { view: 'grid' | 'list' } = $props();
const next = $derived(
  view === 'grid' ? { view: 'list', label: 'List View', svg: list } as const : {
    view: 'grid',
    label: 'Grid View',
    svg: grid2,
  } as const,
);
</script>

<Tooltip text={next.label}>
  {#snippet trigger(tooltip)}
    <button type="button" class="view-toggle" aria-label={next.label} onclick={() => (view = next.view)} {...tooltip}
      ><Icon svg={next.svg} /></button>
  {/snippet}
</Tooltip>

<style>
.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-tool);
  font-size: var(--font-size-tool);
  line-height: 1;
  vertical-align: middle;
  cursor: pointer;
  transition: color 0.5s, background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-tool-hover);
  }
}
</style>
