<!--
  A podium rank, top left over the art: "#2" on a glass pill. On trending, where the order is who's watching right now,
  the live dot pulses before it. The hero's is larger.
    <ChartRank rank={1} live size="hero" />
-->
<script lang="ts">
import StatusDot from '$lib/components/status/StatusDot.svelte';

interface Props {
  rank: number;
  /** The chart moves with what's playing now: trending. */
  live?: boolean;
  size?: 'card' | 'hero';
}

const { rank, live = false, size = 'card' }: Props = $props();
</script>

<span class={['chart-rank', size]}>
  {#if live}<StatusDot kind="live" />{/if}<span><span class="hash" aria-hidden="true">#</span><span
      class="visually-hidden"
    >Number </span>{rank}</span>
</span>

<style>
.chart-rank {
  display: inline-flex;
  align-items: center;
  gap: var(--chart-rank-gap);
  padding: var(--chart-rank-padding);
  border-radius: var(--radius-round);
  background-color: var(--color-chart-rank-bg);
  box-shadow: inset 0 0 0 1px var(--color-chart-rank-line);
  backdrop-filter: blur(var(--chart-rank-blur));
  color: var(--color-chart-rank-text);
  font-size: var(--font-size-chart-rank);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;

  &.hero {
    padding: var(--chart-rank-hero-padding);
    font-size: var(--font-size-chart-rank-hero);
  }

  /* The live dot, sized up to the number. */
  --social-dot: var(--chart-rank-dot);
  --color-social-live: var(--color-chart-rank-live);
  --color-social-live-glow: var(--color-chart-rank-live-glow);
}

.hash {
  margin-inline-end: var(--chart-rank-hash-gap);
  opacity: var(--opacity-chart-rank-hash);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
