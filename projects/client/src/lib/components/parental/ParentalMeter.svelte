<!--
  One parental guide level as three steps, Mild, Moderate and Severe, lit up to the level in its color; None lights
  none. Decorative: the level's word sits beside it.
    <ParentalMeter level={2} />
-->
<script lang="ts">
import { parentalLevelLabels, type ParentalLevel } from '#lib/components/filters/parentalGuide.ts';

const { level }: { level: ParentalLevel } = $props();
const color = $derived(`var(--color-parental-${parentalLevelLabels[level].toLowerCase()})`);
</script>

<span class="meter" style:--level-color={color} aria-hidden="true">
  {#each [1, 2, 3] as step (step)}<span class={['step', { lit: step <= level }]}></span>{/each}
</span>

<style>
.meter {
  display: inline-grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-parental-meter);
  inline-size: var(--parental-meter-width);
}

.step {
  block-size: var(--parental-meter-height);
  border-radius: var(--radius-parental-meter);
  background: var(--color-parental-cell);

  &.lit {
    background: var(--level-color);
  }
}
</style>
