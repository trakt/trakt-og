<!--
  A tooltip's bar: how much there is, filled from the start in `color` over the dark track. The progress tooltips'
  watched purple by default, the library's green, a rating's share in that rating's color.
    <TooltipBar percent={45} color="var(--brand-quaternary)" />
-->
<script lang="ts">
const { percent, color = 'var(--brand-tertiary)' }: { percent: number; color?: string } = $props();
</script>

<span class="tooltip-bar" style:--fill={color} style:--percent="{percent}%"></span>

<style>
.tooltip-bar {
  display: block;
  block-size: var(--tooltip-progress-height);
  border-radius: var(--tooltip-progress-height);
  background: linear-gradient(
    to right,
    var(--fill) var(--percent),
    var(--color-tooltip-progress-track) var(--percent)
  );
}
</style>
