<!--
  A thin bar under a field filling toward its limit, with the characters left beside it: green, then amber under 100
  left, red under 25.
    <CharacterMeter length={draft.length} max={500} />
-->
<script lang="ts">
import { characterMeterLevel } from './characterMeterLevel.ts';

const { length, max }: { length: number; max: number } = $props();
const left = $derived(Math.max(0, max - length));
const level = $derived(characterMeterLevel(left));
</script>

<div class={['meter', level]}>
  <span class="bar" aria-hidden="true"><span class="fill" style:inline-size="{Math.min(100, (length / max) * 100)}%"></span></span>
  <span class="left" aria-live="polite">{left} left</span>
</div>

<style>
.meter {
  --meter-color: var(--color-dialog-art-meter-ok);
  display: flex;
  align-items: center;
  gap: var(--dialog-art-meter-gap);
  margin-block-start: var(--dialog-art-label-gap);

  &.warn {
    --meter-color: var(--color-dialog-art-meter-warn);
  }

  &.full {
    --meter-color: var(--color-dialog-art-meter-full);
  }
}

.bar {
  flex: 1;
  block-size: var(--dialog-art-meter-height);
  overflow: hidden;
  border-radius: var(--dialog-art-meter-height);
  background-color: var(--color-dialog-art-meter-track);
}

.fill {
  display: block;
  block-size: 100%;
  background-color: var(--meter-color);
}

.left {
  color: var(--meter-color);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-meter);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .fill {
    transition: inline-size var(--transition-see-more), background-color var(--transition-see-more);
  }
}
</style>
