<!--
  One stat in a tooltip, the way the charts drew it: a small gray label, the value big with its unit gray after it,
  then a line each, after a dash in its color where it has one, with its secondary stat gray and italic. A stat with
  lines aligns to the start; a bare value stays centered like text.
  Tooltip renders these from its `stats`. Use one directly only when a tooltip needs more around it, like the season
  grid's screenshot; `children` go after the lines.
    <TooltipStat label="Mon, Sep 29" value="2h 14m" lines={[{ text: '1 movie', detail: '1h 7m', color }]} />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { StatTip } from './StatTip.ts';

const { label, value, unit, title, lines = [], children }: StatTip & { children?: Snippet } = $props();
</script>

<span class={['stat', { lined: lines.length > 0 }]}>
  {#if label}<span class="label">{label}</span>{/if}
  {#if title}<b class="title">{title}</b>{/if}
  {#if value}<span class="value">{value}{#if unit}<span class="unit">{unit}</span>{/if}</span>{/if}
  {#each lines as line, i (i)}
    <span class={['line', { dash: Boolean(line.color), muted: line.muted }]} style:--dash={line.color}><span
      >{line.text} {#if line.detail}<em class="detail">{line.detail}</em>{/if}</span></span>
  {/each}
  {@render children?.()}
</span>

<style>
.stat {
  display: grid;
  padding: var(--space-tooltip-rich);

  &.lined {
    text-align: start;
  }
}

.label {
  color: var(--color-tooltip-muted);
  font-size: var(--font-size-tooltip-label);
  letter-spacing: var(--letter-spacing-tooltip-label);
  text-transform: uppercase;
}

.title {
  font-weight: var(--font-weight-headings-heavy);
}

.value {
  font-size: var(--font-size-tooltip-value);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-tooltip-value);
}

.unit {
  margin-inline-start: var(--space-tooltip-unit);
  color: var(--color-tooltip-muted);
  font-size: var(--font-size-small);
  font-weight: normal;
}

.line {
  display: flex;
  align-items: center;
  gap: var(--space-tooltip-dash);
  font-variant-numeric: tabular-nums;

  &.dash::before {
    content: '';
    flex: none;
    inline-size: var(--tooltip-dash);
    block-size: var(--tooltip-dash-height);
    background: var(--dash);
  }
}

.stat:not(.lined) .line {
  justify-content: center;
}

.muted,
.detail {
  color: var(--color-tooltip-muted);
}
</style>
