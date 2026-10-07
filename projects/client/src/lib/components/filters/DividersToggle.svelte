<!--
  OG's "Toggle Dividers" icon: shows or hides every day divider,
  red while they're hidden. The choice is kept in the `filter-hide-dividers` cookie, so SSR renders the same.
    <DividersToggle bind:shown={dividers} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import dividers from '$lib/icons/regular/arrows-to-dotted-line.svg?raw';

let { shown = $bindable() }: { shown: boolean } = $props();

function toggle() {
  shown = !shown;
  document.cookie = `filter-hide-dividers=${shown ? '' : '1'}; path=/; samesite=lax; max-age=${shown ? 0 : 31_536_000}`;
}
</script>

<Tooltip text="Toggle Dividers">
  {#snippet trigger(tooltip)}
    <button type="button" class={['toggle', { selected: !shown }]} aria-label="Day dividers" aria-pressed={shown}
      onclick={toggle} {...tooltip}>
      <Icon svg={dividers} />
    </button>
  {/snippet}
</Tooltip>

<style>
.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-tool-caret);
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  padding: 0 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-tool);
  font-size: var(--font-size-tool);
  line-height: 1;
  text-decoration: none;
  vertical-align: middle;
  transition: color 0.5s, background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-tool-hover);
    --caret-color: currentcolor;
  }

  &.selected {
    color: var(--brand-primary);
  }
}
</style>
