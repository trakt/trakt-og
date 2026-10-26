<!--
  Every country's releases as one thin box row, like the stats page's Second Opinions: its flag, name and
  certification, then its releases as dots on one date axis shared by every row, colored by type (a limited run
  hollow), with today as a line down them all. Each dot's tooltip has its date, rating, notes and disc logos. The
  boxes share one grid, so the names, ratings and axis line up down the page.
    <ReleaseRows columns={releases.columns} ticks={releases.ticks} today={releases.today} countries={shown} />
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import CountryFlag from '$lib/components/table/CountryFlag.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { releaseLabel } from './releaseLabel.ts';
import ReleaseTip from './ReleaseTip.svelte';
import type { ReleaseDate } from './toMovieReleases.ts';

interface Props {
  columns: readonly { readonly id: string; readonly label: string }[];
  ticks: readonly { readonly at: number; readonly label: string }[];
  /** Today's position along the axis, in percent; null outside it. */
  today: number | null;
  countries: readonly {
    readonly code: string;
    readonly name: string;
    readonly original: boolean;
    readonly certification: string;
    readonly marks: readonly { readonly column: string; readonly at: number; readonly release: ReleaseDate }[];
  }[];
}

const { columns, ticks, today, countries }: Props = $props();
const limited = $derived(countries.some(({ marks }) => marks.some(({ release }) => release.limited)));
</script>

<div class="scroll">
  <div class="rows">
    <div class="axis" aria-hidden="true">
      <span class="legend">
        {#each columns as column (column.id)}
          <span class="key" style:--type="var(--color-release-{column.id})">{column.label}</span>
        {/each}
        {#if limited}<span class="key limited" style:--type="var(--color-release-theatrical)">Limited</span>{/if}
      </span>
      <span class="scale">
        <span class="today-row">
          {#if today !== null}<span class="at" style:--at="{today}%"><TagPills tags={[{ text: 'Today', kind: 'light' }]} /></span
            >{/if}
        </span>
        <span class="tick-row">
          {#each ticks as tick (tick.at)}<span class="at tick" style:--at="{tick.at}%">{tick.label}</span>{/each}
        </span>
      </span>
    </div>
    <ol aria-label="Release dates by country">
      {#each countries as country (country.code)}
        <li class="row">
          <span class="country">
            <CountryFlag code={country.code} holdSpace />
            <span class="name">{country.name}</span>
            {#if country.original}<TagPills tags={[{ text: 'Original Country', kind: 'primary' }]} />{/if}
          </span>
          <span class="rating">
            {#if country.certification}<TagPills tags={[{ text: country.certification, kind: 'badge' }]} />{/if}
          </span>
          <span class="lane">
            {#if today !== null}<span class="now" style:--at="{today}%" aria-hidden="true"></span>{/if}
            {#each country.marks as mark, i (i)}
              <Tooltip toggles>
                {#snippet trigger(tooltip)}
                  <button type="button" class={['mark', { limited: mark.release.limited }]} style:--at="{mark.at}%"
                    style:--type="var(--color-release-{mark.column})" aria-label={releaseLabel(mark.release)} {...tooltip}
                  ></button>
                {/snippet}
                <ReleaseTip release={mark.release} />
              </Tooltip>
            {/each}
          </span>
        </li>
      {/each}
    </ol>
  </div>
</div>

<style>
.scroll {
  overflow-x: auto;
}

/* One grid for every box: zero-width edge columns let the column gap pad each box. */
.rows {
  display: grid;
  grid-template-columns:
    [edge-start] 0 [country] max-content [rating] max-content [lane] minmax(var(--release-lane-min), 1fr)
    [edge-end] 0;
  gap: var(--space-release-rows) var(--space-release-cell);
}

.axis,
ol,
.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

ol {
  gap: var(--space-release-rows);
  margin: 0;
  padding: 0;
  list-style: none;
}

.axis {
  align-items: end;
  color: var(--color-release-detail);
  font-family: var(--font-headings);
  font-size: var(--font-size-release-detail);
  font-weight: var(--font-weight-headings);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  grid-column: country / lane;
  gap: var(--space-release-stack) var(--space-release-legend);
}

.key {
  display: inline-flex;
  align-items: center;
  gap: var(--space-release-stack);

  &::before {
    content: '';
    inline-size: var(--release-mark);
    block-size: var(--release-mark);
    border-radius: 50%;
    background: var(--type);
  }

  &.limited::before {
    background: transparent;
    box-shadow: inset 0 0 0 var(--release-mark-ring) var(--type);
  }
}

.scale {
  display: grid;
  grid-column: lane;
  gap: var(--space-release-axis);
}

.today-row,
.tick-row {
  position: relative;
  min-block-size: 1lh;
}

.at {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: var(--at);
  translate: -50% 0;
  white-space: nowrap;
}

.today-row {
  min-block-size: var(--release-axis-today);
}

.row {
  --row-bg: var(--color-release-box);
  align-items: center;
  padding-block: var(--space-release-cell);
  border-radius: var(--radius-release-box);
  background-color: var(--row-bg);
  transition: background-color var(--transition-card);

  &:hover {
    --row-bg: var(--color-release-box-hover);
  }
}

.country {
  display: flex;
  grid-column: country;
  align-items: center;
  gap: var(--space-release-cell);
  white-space: nowrap;
}

.name {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

.rating {
  grid-column: rating;
}

.lane {
  position: relative;
  grid-column: lane;
  block-size: var(--release-lane-height);

  &::before {
    content: '';
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc((var(--release-lane-height) - var(--release-lane-line)) / 2);
    block-size: var(--release-lane-line);
    border-radius: var(--release-lane-line);
    background: var(--color-release-lane);
  }
}

.now {
  position: absolute;
  inset-block: calc(-1 * var(--space-release-cell));
  inset-inline-start: var(--at);
  inline-size: var(--release-lane-line);
  translate: -50% 0;
  background: var(--color-release-lane-today);
}

.mark {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: var(--at);
  z-index: 1;
  inline-size: var(--release-mark);
  block-size: var(--release-mark);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--type);
  box-shadow: 0 0 0 var(--release-mark-ring) var(--row-bg);
  translate: -50% -50%;
  cursor: pointer;
  transition: scale var(--transition-card);

  &.limited {
    background: var(--row-bg);
    box-shadow:
      inset 0 0 0 var(--release-mark-ring) var(--type),
      0 0 0 var(--release-mark-ring) var(--row-bg);
  }

  /* A bigger target than the dot, for the pointer and touch. */
  &::after {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--release-mark-hit));
    border-radius: 50%;
  }

  &:is(:hover, :focus-visible) {
    z-index: 2;
    scale: var(--release-mark-hover-scale);
  }

  &:focus-visible {
    outline: var(--release-mark-ring) solid var(--color-text);
    outline-offset: var(--release-mark-ring);
  }
}

@media (prefers-reduced-motion: reduce) {
  .row,
  .mark {
    transition: none;
  }
}
</style>
