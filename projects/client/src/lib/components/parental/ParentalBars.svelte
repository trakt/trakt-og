<!--
  A title's parental guide at a glance: a line per category, in the filter's order, as tall as its level and in its
  color; None is a dot. Decorative: what holds it names the levels.
    <ParentalBars guide={[{ category: 'violence', level: 2 }]} />
-->
<script lang="ts">
import { parentalLevelLabels } from '#lib/components/filters/parentalGuide.ts';
import type { ParentalGuide } from '#lib/parental/ParentalGuide.ts';

const { guide }: { guide: ParentalGuide } = $props();
</script>

<span class="bars" aria-hidden="true">
  {#each guide as { category, level } (category)}
    <span class="bar" style:--level={level}
      style:--level-color="var(--color-parental-{parentalLevelLabels[level].toLowerCase()})"></span>
  {/each}
</span>

<style>
.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: var(--space-parental-bars);
  block-size: var(--parental-bars-height);
}

.bar {
  inline-size: var(--parental-bar-width);
  block-size: max(var(--parental-bar-min), calc(var(--parental-bars-height) * var(--level) / 3));
  border-radius: var(--radius-parental-bar);
  background: var(--level-color);
}
</style>
