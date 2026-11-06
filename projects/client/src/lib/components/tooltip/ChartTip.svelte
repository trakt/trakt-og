<!--
  A chart mark's tooltip, in the watched tooltip's style. The header names the mark, with a swatch, avatar or icon
  before it (`mark`, sized by `--tooltip-mark`) and a pill on the right for its rank or state (`tag`); it centers
  unless it has a pill. Its band shows what the mark looks like: a `TooltipBar`, and its stats. Then the body:
  the number in bold before its words, over a gray detail. Without a band or a pill it's the lightest: a centered
  name over the lead.
    <ChartTip name="Season 2" value="45%" words="watched" detail="9 / 20 eps — last watched Sep 3, 2026">
      {#snippet band()}<TooltipBar percent={45} />{/snippet}
    </ChartTip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { TagPill } from '#lib/components/labels/TagPill.ts';
import TagPills from '#lib/components/labels/TagPills.svelte';
import TooltipHeader from './TooltipHeader.svelte';

interface Props {
  name: string;
  mark?: Snippet;
  tag?: TagPill;
  band?: Snippet;
  /** "45%", "130", "2h 14m": bold, before `words`. */
  value: string;
  words: string;
  /** Gray under the lead: a line, or markup for more than one, like a day's line per type. */
  detail?: string | Snippet;
}

const { name, mark, tag, band, value, words, detail }: Props = $props();
</script>

<span class={['chart-tip', { banded: Boolean(band) }]}>
  <TooltipHeader {band}>
    <span class={['head', { tagged: Boolean(tag) }]}>
      <span class="name">{@render mark?.()}<b>{name}</b></span>
      {#if tag}<TagPills tags={[tag]} />{/if}
    </span>
  </TooltipHeader>
  <span class="lead">
    <span><b>{value}</b> {words}</span>
    {#if typeof detail === 'function'}<span class="detail">{@render detail()}</span>
    {:else if detail}<span class="detail">{detail}</span>{/if}
  </span>
</span>

<style>
.chart-tip {
  display: flex;
  flex-direction: var(--tooltip-stack, column);

  /* With a band, wide enough that a short bar still reads, and the same width from mark to mark. Without, as wide
     as its words. */
  &.banded {
    min-inline-size: var(--tooltip-progress-min-width);
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-tooltip-footer-gap);
  padding: var(--space-tooltip-rich);

  /* The pill as far from the header's end as from its top and bottom. */
  &.tagged {
    justify-content: space-between;
    margin-inline-end: calc(2 * var(--space-tooltip-block) - var(--space-tooltip-inline));
    padding-inline-end: 0;
  }
}

.name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-tooltip-mark);
}

b {
  font-weight: var(--font-weight-headings-heavy);
}

.lead {
  display: grid;
  padding: var(--space-tooltip-rich);
  font-variant-numeric: tabular-nums;
}

.detail {
  color: var(--color-tooltip-muted);
}
</style>
