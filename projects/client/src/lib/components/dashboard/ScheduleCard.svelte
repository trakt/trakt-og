<!--
  One of the Upcoming Schedule spotlight's cards: the poster, the show or movie, its episodes, the premiere or finale
  tag with "9:00 pm on CBS", and Watch Now (or Buy Tickets) when there's somewhere to watch it.
-->
<script lang="ts">
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';
import type { ScheduleRow } from '$lib/dashboard/toScheduleLayout';
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import Icon from '$lib/icons/Icon.svelte';
import play from '$lib/icons/trakt/play2-thick.svg?raw';
import tickets from '$lib/icons/trakt/tickets.svg?raw';
import ScheduleEpisodes from './ScheduleEpisodes.svelte';
import ScheduleTag from './ScheduleTag.svelte';

interface Props {
  row: ScheduleRow;
  onwatchnow: (watchNow: NonNullable<ScheduleItem['watchNow']>) => void;
}

const { row, onwatchnow }: Props = $props();
</script>

<!-- The popular shows page takes a network filter og hasn't built yet; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class="card">
  <img class="poster" src={row.poster ?? posterPlaceholder} alt="" loading="lazy" decoding="async" />
  <div class="text">
    <h4><a href={row.href}>{row.title}</a></h4>
    <div class="episodes"><ScheduleEpisodes {row} /></div>
    {#if row.label || row.time}
      <div class="meta">
        {#if row.label}<ScheduleTag label={row.label} />{/if}
        {#if row.time}
          <span>{row.time}{row.network ? ' on ' : ''}{#if row.network?.href}<a href={row.network.href}>{row.network.name}</a>{:else}{row.network?.name}{/if}</span>
        {/if}
      </div>
    {/if}
    {#if row.watchNow}
      {@const watchNow = row.watchNow}
      <button type="button" class="watch-now" aria-haspopup="dialog" onclick={() => onwatchnow(watchNow)}>
        <span class="icon"><Icon svg={watchNow.button.cinemaOnly ? tickets : play} /></span>
        {watchNow.button.cinemaOnly ? 'Buy Tickets' : 'Watch Now'}
      </button>
    {/if}
  </div>
</article>

<style>
.card {
  display: flex;
  gap: var(--space-schedule-card-gap);
  padding: var(--space-schedule-card);
  border-inline-start: var(--border-schedule-card) solid var(--brand-primary);
  background-color: var(--color-surface);
}

.poster {
  flex-shrink: 0;
  inline-size: var(--schedule-card-poster);
  aspect-ratio: 2 / 3;
  align-self: start;
  object-fit: cover;
}

.text {
  display: grid;
  gap: var(--space-schedule-line);
  align-content: start;
  min-inline-size: 0;
}

h4 {
  margin: 0;
  font-size: var(--font-size-h4);
}

.episodes {
  min-inline-size: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-schedule-line);
  align-items: center;
  color: var(--color-schedule-muted);
  font-size: var(--font-size-small);

  & a {
    color: inherit;
  }
}

.watch-now {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-schedule-tag);
  line-height: var(--line-height-base);
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    color: var(--color-link);
  }
}

.icon {
  display: inline-block;
  margin-inline-end: var(--space-schedule-watch-now-icon);
  font-size: var(--font-size-schedule-watch-now-icon);
  line-height: 1;
  vertical-align: top;
}
</style>
