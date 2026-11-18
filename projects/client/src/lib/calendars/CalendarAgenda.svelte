<!--
  The calendar's agenda view: every day of the month under its pinned day bar, its entries as rows grouped by air
  time. A slot's time stays pinned under the day bar while its rows scroll by; a day's movies, which have no time,
  share an "All day" slot at the top. Each day is a section the sidebar can jump to and follow.
    <CalendarAgenda {days} today={data.today} artwork="fanart" {cardIcons} />
-->
<script lang="ts">
import CalendarDayHeader from '#lib/components/calendar/CalendarDayHeader.svelte';
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import type QuickIcons from '#lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import { agendaSlots } from './agendaSlots.ts';
import CalendarAgendaRow from './CalendarAgendaRow.svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';

interface Props {
  days: readonly { readonly date: string; readonly entries: readonly CalendarEntry[] }[];
  today: string;
  artwork: CalendarArtwork;
  /** Shows and movies on one calendar: movies get a Movie tag. */
  mixed?: boolean;
  /** The month is still reading: an empty day holds a shimmering row instead of saying it's empty. */
  loading?: boolean;
  cardIcons: (entry: CalendarEntry) => Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { days, today, artwork, mixed = false, loading = false, cardIcons }: Props = $props();
</script>

<div class={['calendar-agenda', artwork]}>
  {#each days as day (day.date)}
    <section class="day" id="day-{day.date}" data-day={day.date}>
      <CalendarDayHeader date={day.date} today={day.date === today} past={day.date < today} />
      {#if day.entries.length === 0 && loading}
        <div class="slot" aria-hidden="true">
          <p class="time"><Shimmer inline="var(--card-shimmer-subtitle-width)" block="var(--font-size-card-subtitle)" /></p>
          <ul class="rows">
            <li class={['row-shimmer', artwork]}><Shimmer inline="100%" block="100%" /></li>
          </ul>
        </div>
      {:else if day.entries.length === 0}
        <div class="empty"><EmptyState title="Nothing on this day." /></div>
      {:else}
        {#each agendaSlots(day.entries) as slot, i (i)}
          <div class="slot">
            <p class="time">{slot.time ?? 'All day'}</p>
            <ul class="rows">
              {#each slot.entries as entry (entry.key)}
                <li><CalendarAgendaRow {entry} icons={cardIcons(entry)} {artwork} {mixed} /></li>
              {/each}
            </ul>
          </div>
        {/each}
      {/if}
    </section>
  {/each}
</div>

<style>
/* The theme's quiet box, set in like the cards. */
.empty {
  padding: var(--calendar-list-padding);

  & :global(.empty-state) {
    margin: 0;
    border-radius: var(--radius-calendar-card);
  }
}

.day {
  scroll-margin-block-start: var(--header-height);
}

.slot {
  display: grid;
  grid-template-columns: var(--calendar-agenda-time-width) minmax(0, 1fr);

  & + & {
    border-block-start: 1px solid var(--color-calendar-slot-line);
  }
}

/* Pinned under the day bar while the slot's rows scroll by. */
.time {
  position: sticky;
  inset-block-start: calc(var(--header-height) + var(--calendar-day-bar-height));
  align-self: start;
  display: flex;
  align-items: center;
  block-size: var(--calendar-agenda-row-height);
  margin: 0;
  padding-inline-start: var(--space-lg-inline);
  font-size: var(--font-size-calendar-agenda-time);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  .none & {
    block-size: var(--calendar-agenda-text-row-height);
  }
}

.rows {
  margin: 0;
  padding: 0;
  list-style: none;

  & li + li {
    border-block-start: 1px solid var(--color-frame-line);
  }
}

/* A row's place while the month reads, at the loaded row's height for the artwork. */
.row-shimmer {
  display: flex;
  block-size: var(--calendar-agenda-row-height);

  &.none {
    block-size: var(--calendar-agenda-text-row-height);
  }
}
</style>
