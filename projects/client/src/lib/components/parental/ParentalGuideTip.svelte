<!--
  The summary badge's parental guide tooltip: a row per category with its icon in its level's color, its short name,
  the page's meter and the level's word.
    <Tooltip>{#snippet trigger(tooltip)}…{/snippet}<ParentalGuideTip {guide} /></Tooltip>
-->
<script lang="ts">
import { parentalCategoryLabels, parentalLevelLabels } from '#lib/components/filters/parentalGuide.ts';
import Icon from '#lib/icons/Icon.svelte';
import type { ParentalGuide } from '#lib/parental/ParentalGuide.ts';
import { parentalCategoryIcons } from './parentalCategoryIcons.ts';
import ParentalMeter from './ParentalMeter.svelte';

const { guide }: { guide: ParentalGuide } = $props();
</script>

<span class="tip">
  {#each guide as { category, level } (category)}
    <span class="row" style:--level-color="var(--color-parental-{parentalLevelLabels[level].toLowerCase()})">
      <span class="glyph"><Icon svg={parentalCategoryIcons[category]} fixedWidth /></span>
      <span class="name">{parentalCategoryLabels[category]}</span>
      <ParentalMeter {level} />
      <span class="level">{parentalLevelLabels[level]}</span>
    </span>
  {/each}
</span>

<style>
/* The tooltip box is always dark, so the levels take their dark colors. */
.tip {
  --parental-meter-width: var(--parental-tip-meter-width);

  display: grid;
  grid-template-columns: auto auto auto auto;
  align-items: center;
  gap: var(--space-parental-tip-row) var(--space-parental-tip-column);
  padding: var(--space-parental-tip);
  color-scheme: dark;
  text-align: start;
}

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
}

.glyph {
  display: inline-flex;
  color: var(--level-color);
}

.name {
  padding-inline-end: var(--space-parental-tip-name);
}

.level {
  color: var(--level-color);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
