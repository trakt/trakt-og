<!--
  The parental guide page's levels: a tile per category in the stats page's Community look, ruled in its level's
  color, with the category's icon and short name on one line, the level and its meter. Five across, three on a small
  tablet's column.
    <ParentalGuideTiles guide={[{ category: 'violence', level: 2 }]} />
-->
<script lang="ts">
import { parentalCategoryLabels, parentalLevelLabels } from '#lib/components/filters/parentalGuide.ts';
import ParentalMeter from '#lib/components/parental/ParentalMeter.svelte';
import Icon from '#lib/icons/Icon.svelte';
import { parentalCategoryIcons } from '#lib/components/parental/parentalCategoryIcons.ts';
import type { ParentalGuide } from './ParentalGuide.ts';

const { guide }: { guide: ParentalGuide } = $props();
</script>

<div class="guide">
<ul class="tiles">
  {#each guide as { category, level } (category)}
    <li class="tile" style:--color="var(--color-parental-{parentalLevelLabels[level].toLowerCase()})">
      <span class="label"><span class="glyph"><Icon svg={parentalCategoryIcons[category]} /></span>{parentalCategoryLabels[category]}</span>
      <span class="value">{parentalLevelLabels[level]}</span>
      <ParentalMeter {level} />
    </li>
  {/each}
</ul>
</div>

<style>
.guide {
  container-type: inline-size;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  display: grid;
  align-content: start;
  gap: var(--space-stats-tile-value);
  padding: var(--space-stats-tile);
  border-block-start: var(--stats-tile-rule) solid var(--color);
  border-end-start-radius: var(--radius-stats-tile);
  border-end-end-radius: var(--radius-stats-tile);
  background-color: var(--color-stats-tile-bg);
}

.label {
  display: flex;
  align-items: center;
  gap: var(--strip-item-gap);
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-label);
  font-weight: var(--font-weight-headings);
  text-transform: uppercase;
  white-space: nowrap;
}

.glyph {
  display: inline-flex;
  color: var(--color);
}

.value {
  color: var(--color);
  font-family: var(--font-headings);
  font-size: var(--font-size-stats-tile-value);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

/* Too narrow for "Moderate" in five, so three and two. */
@container (width < 800px) {
  .tiles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.tile :global(.meter) {
  inline-size: 100%;
}
</style>
