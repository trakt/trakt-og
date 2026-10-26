<!--
  The calendar's list view: every day of the month under its pinned day bar, its cards in a grid with gutters that
  adds columns as the content gets wider (posters fill the width at their own size). Each day is a section the sidebar
  can jump to and follow.
    <CalendarList {days} today={data.today} artwork="logo" {cardIcons} />
-->
<script lang="ts">
import CalendarDayHeader from '$lib/components/calendar/CalendarDayHeader.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import type QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import CalendarEntryCard from './CalendarEntryCard.svelte';

interface Props {
  days: readonly { readonly date: string; readonly entries: readonly CalendarEntry[] }[];
  today: string;
  artwork: CalendarArtwork;
  /** Shows and movies on one calendar: movies get a Movie tag. */
  mixed?: boolean;
  cardIcons: (entry: CalendarEntry) => Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { days, today, artwork, mixed = false, cardIcons }: Props = $props();
</script>

<div class={['calendar-list', artwork]}>
  {#each days as day (day.date)}
    <section class="day" id="day-{day.date}" data-day={day.date}>
      <CalendarDayHeader date={day.date} today={day.date === today} past={day.date < today} />
      {#if day.entries.length === 0}
        <div class="empty"><EmptyState title="Nothing on this day." /></div>
      {:else}
        <div class="width">
          <div class="cards">
            {#each day.entries as entry (entry.key)}
              <CalendarEntryCard {entry} icons={cardIcons(entry)} {artwork} {mixed} />
            {/each}
          </div>
        </div>
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
  background: none;
  scroll-margin-block-start: var(--header-height);
}

/* Measured for the columns. The day itself isn't, so its bar can stay pinned. */
.width {
  container-type: inline-size;
}

.cards {
  display: grid;
  grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
  gap: var(--calendar-card-gap);
  padding: var(--calendar-list-padding);
}

/* OG's calendar columns by width. */
@container (width >= 468px) {
  .cards {
    --columns: 2;
  }
}

@container (width >= 692px) {
  .cards {
    --columns: 3;
  }
}

@container (width >= 1300px) {
  .cards {
    --columns: 4;
  }
}

/* Posters fill the row at about their own width. */
.poster .cards {
  grid-template-columns: repeat(auto-fill, minmax(var(--calendar-poster-min-width), 1fr));
}
</style>
