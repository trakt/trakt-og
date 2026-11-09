<!--
  One of the progress subnav's view toggles (Grid View, Simple Progress Bars, Include Watchlisted): an icon tool with a
  tooltip, red while on. `busy` marks it while its setting saves.
    <ProgressViewToggle label="Grid View" svg={grid2} on={gridOn} busy={saving} onclick={toggle} />
-->
<script lang="ts">
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';

interface Props {
  label: string;
  svg: string;
  on: boolean;
  busy?: boolean;
  onclick: () => void;
}

const { label, svg, on, busy = false, onclick }: Props = $props();
</script>

<Tooltip text={label}>
  {#snippet trigger(tooltip)}
    <button type="button" class={['view-toggle', { selected: on }]} aria-label={label} aria-pressed={on}
      aria-busy={busy} {onclick} {...tooltip}><Icon {svg} /></button>
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

  &.selected {
    color: var(--brand-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .view-toggle {
    transition: none;
  }
}
</style>
