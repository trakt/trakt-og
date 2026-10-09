<!--
  The calendar's list view: every day of the month under its pinned day bar, its cards in a grid that adds columns as
  the content gets wider (more for posters). Each day is a section the sidebar can jump to and follow.
    <CalendarList {days} today={data.today} artwork="logo" {cardIcons} />
-->
<script lang="ts">
import CalendarDayHeader from '$lib/components/calendar/CalendarDayHeader.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import type QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import CalendarEntryCard from './CalendarEntryCard.svelte';

interface Props {
  days: readonly { readonly date: string; readonly entries: readonly CalendarEntry[] }[];
  today: string;
  artwork: CalendarArtwork;
  autoscroll?: boolean;
  cardIcons: (entry: CalendarEntry) => Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { days, today, artwork, autoscroll = false, cardIcons }: Props = $props();
</script>

<div class={['calendar-list', artwork]}>
  {#each days as day (day.date)}
    <section class="day" id="day-{day.date}" data-day={day.date}>
      <CalendarDayHeader date={day.date} today={day.date === today} past={day.date < today} {autoscroll} />
      {#if day.entries.length === 0}
        <NoData inFrame>Nothing on this day.</NoData>
      {:else}
        <div class="width">
          <div class="cards">
            {#each day.entries as entry (entry.key)}
              <div class="card"><CalendarEntryCard {entry} icons={cardIcons(entry)} {artwork} /></div>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
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
}

/* OG's calendar columns by width; posters are narrower, so more fit. */
@container (width >= 468px) {
  .cards {
    --columns: 2;

    .poster & {
      --columns: 4;
    }
  }
}

@container (width >= 692px) {
  .cards {
    --columns: 3;

    .poster & {
      --columns: 5;
    }
  }
}

@container (width >= 892px) {
  .cards {
    .poster & {
      --columns: 6;
    }
  }
}

@container (width >= 1200px) {
  .cards {
    .poster & {
      --columns: 8;
    }
  }
}

@container (width >= 1300px) {
  .cards {
    --columns: 4;
  }
}

.card {
  min-inline-size: 0;
  border-inline-end: 1px solid var(--color-frame-border);
  border-block-end: 1px solid var(--color-frame-border);
}
</style>
