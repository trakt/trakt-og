<!--
  A picker's option rows while its options load: the shapes before the name (a toggle, a service's logo tile), the
  name as a bar that runs long, mid and short down the rows, and a shape after it. The host passes its loaded rows'
  inset, gap and height, so the list keeps its size when they land. Each row is a presentational `<li>` hidden from
  screen readers, so the list around them says it's busy.
    <ul aria-busy="true"><OptionRowShimmers rows={8} text="var(--font-size-menu)" height="var(--menu-row)" /></ul>
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';

interface Shape {
  inline: string;
  block: string;
  round?: boolean;
}

interface Props {
  rows: number;
  /** The name bar's height, the row's font size. */
  text: string;
  /** The loaded row's height, when its padding and shapes don't already make it. */
  height?: string;
  inset?: string;
  gap?: string;
  before?: readonly Shape[];
  after?: Shape;
}

const { rows, text, height = 'auto', inset = '0', gap = 'var(--space-sm-inline)', before = [], after }: Props = $props();

const widths = ['var(--option-shimmer-long)', 'var(--option-shimmer-mid)', 'var(--option-shimmer-short)'];
</script>

{#each Array.from({ length: rows }, (_, i) => i) as row (row)}
  <li class="option-row-shimmer" role="presentation" aria-hidden="true" style:min-block-size={height}
    style:padding={inset} style:gap>
    {#each before as shape, i (i)}<Shimmer {...shape} />{/each}
    <span class="name"><Shimmer inline={widths.at(row % widths.length) ?? '100%'} block={text} /></span>
    {#if after}<Shimmer {...after} />{/if}
  </li>
{/each}

<style>
.option-row-shimmer {
  display: flex;
  align-items: center;
  list-style: none;
}

.name {
  display: flex;
  flex: 1;
  min-inline-size: 0;
}
</style>
