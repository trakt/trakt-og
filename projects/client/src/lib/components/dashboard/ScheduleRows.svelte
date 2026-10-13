<!--
  A day's Upcoming Schedule rows, one per show, in the same order as the cards: a small poster, then the show, its
  episodes, and the calendar's tags (the premiere or finale, the air time, the network). "Show N more" opens the rest.
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import type { ScheduleLayout } from '$lib/dashboard/toScheduleLayout';
import ScheduleEpisodes from './ScheduleEpisodes.svelte';
import ScheduleTags from './ScheduleTags.svelte';

const { rows }: { rows: Pick<ScheduleLayout['week'][number], 'shown' | 'more'> } = $props();

let expanded = $state(false);
const shown = $derived(expanded ? [...rows.shown, ...rows.more] : rows.shown);
</script>

<!-- Show pages are linked by slug paths built in the mapper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<ul>
  {#each shown as row (row.key)}
    <li class="row">
      <img class="poster" src={row.poster ?? posterPlaceholder} alt="" loading="lazy" decoding="async" />
      <span class="text">
        <a class="show" href={row.href}>{row.title}</a>
        <ScheduleEpisodes {row} />
        <ScheduleTags {row} />
      </span>
    </li>
  {/each}
</ul>
{#if rows.more.length > 0}
  <button type="button" class="more" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
    {expanded ? 'Show fewer' : `Show ${rows.more.length} more`}
  </button>
{/if}

<style>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: var(--schedule-day-poster) minmax(0, 1fr);
  gap: var(--space-schedule-row-gap);
  align-items: start;
  padding: var(--space-schedule-day-row) var(--space-schedule-row);
  border-block-start: 1px solid var(--color-schedule-separator);
  font-size: var(--font-size-schedule-row);

  &:hover {
    background-color: var(--color-schedule-row-hover);
  }
}

.poster {
  inline-size: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
}

.text {
  display: grid;
  justify-items: start;
  min-inline-size: 0;

  & > :global(*) {
    max-inline-size: 100%;
  }
}

.show {
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);

  &:hover {
    color: var(--color-link);
  }
}

.more {
  display: block;
  inline-size: 100%;
  padding: var(--space-schedule-more);
  border: 0;
  border-block-start: 1px solid var(--color-schedule-separator);
  background: none;
  color: var(--color-link);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  text-align: start;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: var(--color-schedule-row-hover);
  }
}
</style>
