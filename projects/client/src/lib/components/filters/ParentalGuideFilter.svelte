<!--
  The filter panel's parental guide: IMDb's five categories as rows of four cells, None to Severe, with the scale
  printed once above them. A cell sets the most its row allows and fills the cells up to it; pressing the last filled
  cell clears the row. Any, Kids and Teens on the heading line fill every row, and none of them is lit for a custom
  mix. A set row also leaves out titles IMDb hasn't rated.
    <ParentalGuideFilter value={draft.parental} onchange={(parental) => apply({ ...draft, parental })} />
-->
<script lang="ts">
import ToggleChips from '$lib/components/toggle-chips/ToggleChips.svelte';
import {
  type ParentalCategory,
  type ParentalLevel,
  type ParentalLimits,
  parentalCategories,
  parentalCategoryLabels,
  parentalLevelLabels,
  parentalLevels,
  parentalLimitLabel,
} from './parentalGuide.ts';
import { parentalPreset, parentalPresets } from './parentalPreset.ts';

interface Props {
  value: ParentalLimits;
  onchange: (value: ParentalLimits) => void;
}

const { value, onchange }: Props = $props();

const uid = $props.id();

const presets = [
  { id: 'any', label: 'Any' },
  { id: 'kids', label: 'Kids' },
  { id: 'teens', label: 'Teens' },
] as const;

const preset = $derived(parentalPreset(value) ?? '');

function pickPreset(id: string) {
  const picked = presets.find((option) => option.id === id);
  if (picked) onchange(parentalPresets[picked.id]);
}

function pick(category: ParentalCategory, level: ParentalLevel) {
  const { [category]: current, ...rest } = value;
  onchange(current === level ? rest : { ...rest, [category]: level });
}

const cellLabel = (category: ParentalCategory, level: ParentalLevel) =>
  `${parentalCategoryLabels[category]} ${parentalLimitLabel(level)}`;
</script>

<div class="parental" role="group" aria-labelledby="{uid}-title">
  <div class="heading">
    <p class="label" id="{uid}-title">Parental Guide</p>
    <ToggleChips label="Parental guide presets" options={presets} bind:selected={() => preset, pickPreset} />
  </div>

  <div class="grid">
    <span></span>
    {#each parentalLevels as level (level)}
      <span class="level" aria-hidden="true">{parentalLevelLabels[level]}</span>
    {/each}
    {#each parentalCategories as category (category)}
      {@const limit = value[category]}
      <span class="category">{parentalCategoryLabels[category]}</span>
      {#each parentalLevels as level (level)}
        <button type="button" class={['cell', { on: limit !== undefined && level <= limit }]}
          aria-pressed={limit === level} aria-label={cellLabel(category, level)}
          onclick={() => pick(category, level)}></button>
      {/each}
    {/each}
  </div>
</div>

<style>
.parental {
  display: flex;
  flex-direction: column;
  gap: var(--space-base-inline);
  margin-block-start: var(--space-base-block);
}

/* The presets shrink to the sidebar's Clear button, so they sit on the heading line like a section's action. */
.heading {
  --control-height: var(--control-height-mini);
  --space-control-inline: var(--space-base-block);
  --font-size-control: var(--font-size-small);
  --space-dropdown-row: var(--space-xs-inline);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-base-block);
}

/* The panel's section label, as "Site Ratings" above it. */
.label {
  margin: 0;
  color: var(--color-sidebar-label);
  font-size: var(--font-size-sidebar-section);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-sidebar-label);
  text-transform: uppercase;
}

.grid {
  display: grid;
  grid-template-columns: var(--parental-category-width) repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: var(--space-parental-cell);
}

.level {
  color: var(--color-sidebar-label);
  font-size: var(--font-size-sidebar-section);
  text-align: center;
  white-space: nowrap;
}

.category {
  font-family: var(--font-headings);
  font-size: var(--font-size-filter-control);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;
}

.cell {
  block-size: var(--parental-cell-height);
  min-block-size: 0;
  padding: 0;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-parental-cell);
  background-color: var(--color-control-bg);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-input-border-focus);
    outline-offset: 1px;
  }

  &.on {
    border-color: var(--color-tab-picked-border);
    background-color: var(--color-tab-picked-bg);
  }

  &.on:hover {
    background-color: var(--color-tab-picked-bg-hover);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .cell {
    transition: background-color 0.2s, border-color 0.2s;
  }
}
</style>
