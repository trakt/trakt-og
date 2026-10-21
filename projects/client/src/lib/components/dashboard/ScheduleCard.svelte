<!--
  One of the Upcoming Schedule spotlight's cards: the poster, then the show, its episodes, the calendar's tags (the
  premiere or finale, the air time, the network), and a Watch Now (or Buy Tickets) button when there's somewhere to
  watch it.
-->
<script lang="ts">
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';
import type { ScheduleRow } from '$lib/dashboard/toScheduleLayout';
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import Icon from '$lib/icons/Icon.svelte';
import play from '$lib/icons/trakt/play2-thick.svg?raw';
import tickets from '$lib/icons/trakt/tickets.svg?raw';
import ScheduleEpisodes from './ScheduleEpisodes.svelte';
import ScheduleTags from './ScheduleTags.svelte';

interface Props {
  row: ScheduleRow;
  onwatchnow: (watchNow: NonNullable<ScheduleItem['watchNow']>) => void;
}

const { row, onwatchnow }: Props = $props();
</script>

<!-- Show pages are linked by slug paths built in the mapper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class="card">
  <img class="poster" src={row.poster ?? posterPlaceholder} alt="" loading="lazy" decoding="async" />
  <div class="text">
    <h4><a href={row.href}>{row.title}</a></h4>
    <div class="episodes"><ScheduleEpisodes {row} /></div>
    <ScheduleTags {row} />
    {#if row.watchNow}
      {@const watchNow = row.watchNow}
      <button type="button" class="watch-now" aria-haspopup="dialog" onclick={() => onwatchnow(watchNow)}>
        <Icon svg={watchNow.button.cinemaOnly ? tickets : play} />
        {watchNow.button.cinemaOnly ? 'Buy Tickets' : 'Watch Now'}
      </button>
    {/if}
  </div>
</article>

<style>
.card {
  display: flex;
  gap: var(--space-schedule-card-gap);
  padding: var(--space-schedule-card-padding);
  border-inline-start: var(--border-schedule-card) solid var(--brand-primary);
  /* The red edge stays straight; only the far side rounds. */
  border-start-end-radius: var(--radius-schedule-card);
  border-end-end-radius: var(--radius-schedule-card);
  background-color: var(--color-surface);
}

.poster {
  flex-shrink: 0;
  inline-size: var(--schedule-card-poster);
  aspect-ratio: 2 / 3;
  align-self: start;
  border-radius: var(--radius-schedule-card);
  object-fit: cover;
}

.text {
  display: grid;
  align-content: start;
  justify-items: start;
  min-inline-size: 0;
}

h4 {
  margin: 0;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-headings);

  & a {
    color: var(--color-text);

    &:hover {
      color: var(--color-link);
    }
  }
}

.episodes {
  inline-size: 100%;
  min-inline-size: 0;
  line-height: var(--line-height-large);
}

.watch-now {
  display: inline-flex;
  gap: var(--space-schedule-watch-now-icon);
  align-items: center;
  min-block-size: var(--control-height-small);
  margin-block-start: var(--space-schedule-watch-now);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-tab);
  font-weight: var(--font-weight-control);
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }
}
</style>
