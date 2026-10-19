<!--
  A list position, centred over the top edge of the nearest positioned ancestor like OG's `.rank-wrapper`, drawn as a
  dark glass pill: a list item's poster, a list row's poster fan.
-->
<script lang="ts">
interface Props {
  rank: number;
}

const { rank }: Props = $props();
</script>

<p class="rank">{rank}</p>

<style>
.rank {
  position: absolute;
  inset-block-start: calc(var(--rank-pill-height) / -2);
  inset-inline-start: 50%;
  z-index: 20;
  translate: -50% 0;
  display: grid;
  place-items: center;
  min-inline-size: var(--rank-pill-height);
  block-size: var(--rank-pill-height);
  margin: 0;
  padding-inline: var(--rank-pill-padding);
  border: var(--rank-pill-border) solid var(--color-rank-pill-border);
  border-radius: calc(var(--rank-pill-height) / 2);
  background-color: var(--color-rank-pill-bg);
  backdrop-filter: var(--blur-rank-pill);
  box-shadow: var(--shadow-rank-pill);
  color: var(--color-card-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-rank-pill);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  pointer-events: none;
}
</style>
