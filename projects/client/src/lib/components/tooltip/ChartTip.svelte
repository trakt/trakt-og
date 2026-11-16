<!--
  A chart mark's tooltip, in the watched tooltip's style. The header names the mark, with a swatch, avatar or icon
  before it (`mark`, sized by `--tooltip-mark`) and a pill on the right for its rank or state (`tag`); it centers
  unless it has a pill. Its band shows what the mark looks like: a `TooltipBar`, and its stats. Then the body:
  the number in bold before its words, over a gray detail. Without a band or a pill it's the lightest: a centered
  name over the lead. A `subtitle` follows the bold name in regular weight. Without a `value` the body is only the detail: the Quality chart's row per site. A `footer` adds a shaded
  `TooltipFooter` band under it, like the Quality chart's own rating.
    <ChartTip name="Season 2" value="45%" words="watched" detail="9 / 20 eps — last watched Sep 3, 2026">
      {#snippet band()}<TooltipBar percent={45} />{/snippet}
    </ChartTip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { TagPill } from '#lib/components/labels/TagPill.ts';
import TagPills from '#lib/components/labels/TagPills.svelte';
import TooltipFooter from './TooltipFooter.svelte';
import TooltipHeader from './TooltipHeader.svelte';

interface Props {
  name: string;
  /** In regular weight after the bold name: an episode's title after its "8x04". */
  subtitle?: string;
  mark?: Snippet;
  tag?: TagPill;
  band?: Snippet;
  /** "45%", "130", "2h 14m": bold, before `words`. Left out, the body is only its detail. */
  value?: string;
  words?: string;
  /** Gray under the lead: a line, or markup for more than one, like a day's line per type. */
  detail?: string | Snippet;
  /** A shaded band under the body, set apart from the mark's own numbers: the viewer's rating. */
  footer?: Snippet;
}

const { name, subtitle, mark, tag, band, value, words, detail, footer }: Props = $props();
</script>

<span class={['chart-tip', { banded: Boolean(band) }]}>
  <TooltipHeader {band}>
    <span class={['head', { tagged: Boolean(tag) }]}>
      <span class="name">{@render mark?.()}<span><b>{name}</b> {#if subtitle}{subtitle}{/if}</span></span>
      {#if tag}<TagPills tags={[tag]} />{/if}
    </span>
  </TooltipHeader>
  <span class="lead">
    {#if value !== undefined}<span><b>{value}</b> {words}</span>{/if}
    {#if typeof detail === 'function'}<span class="detail">{@render detail()}</span>
    {:else if detail}<span class="detail">{detail}</span>{/if}
  </span>
  {#if footer}<TooltipFooter>{@render footer()}</TooltipFooter>{/if}
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
