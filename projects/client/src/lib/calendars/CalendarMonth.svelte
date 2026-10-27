<!--
  The calendar's month view: whole weeks under a pinned weekday row, each day a rounded tile with gutters between the
  days and between its cards, its number pinned while its week scrolls, then its cards stacked one wide, each with the
  full quick-icon bar. Today's tile has a red date, a TODAY tag and a red tint; past dates are grey.
  Days from the neighbouring months only pad the weeks.
    <CalendarMonth month="2026-10" {days} today={data.today} artwork="poster" {cardIcons} />
-->
<script lang="ts">
import type QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import CalendarEntryCard from './CalendarEntryCard.svelte';
import { monthGrid } from './monthGrid.ts';

interface Props {
  month: string;
  days: readonly { readonly date: string; readonly entries: readonly CalendarEntry[] }[];
  today: string;
  artwork: CalendarArtwork;
  weekStart?: number;
  /** Shows and movies on one calendar: movies get a Movie tag. */
  mixed?: boolean;
  cardIcons: (entry: CalendarEntry) => Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { month, days, today, artwork, weekStart = 0, mixed = false, cardIcons }: Props = $props();

const weeks = $derived(monthGrid({ month, weekStart }));
const byDate = $derived(new Map(days.map((day) => [day.date, day.entries])));
const todayColumn = $derived(
  today.slice(0, 7) === month.slice(0, 7) ? (new Date(`${today}T00:00:00Z`).getUTCDay() - weekStart + 7) % 7 : -1,
);
// Today's weekday is red only while today's week is the one pinned at the top: its day header has reached the
// weekday banner and the cell still runs on below it.
let todayInView = $state(false);
function watchToday(node: HTMLElement) {
  let frame = 0;
  const update = () => {
    frame = 0;
    const style = getComputedStyle(node);
    const line = (parseFloat(style.getPropertyValue('--header-height')) || 0) +
      (parseFloat(style.getPropertyValue('--calendar-weekdays-height')) || 0);
    const { top, bottom } = node.getBoundingClientRect();
    todayInView = top <= line + 1 && bottom > line;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    todayInView = false;
  };
}
const weekday = (index: number, style: 'short' | 'long') =>
  new Intl.DateTimeFormat('en-US', { weekday: style, timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, 9, 4 + ((weekStart + index) % 7))),
  );
const longDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
</script>

<div class={['calendar-month', artwork]}>
  <div class="weekdays" aria-hidden="true">
    {#each { length: 7 } as _, i (i)}<span class={{ today: todayInView && i === todayColumn }}><span class="long">{weekday(i, 'long')}</span
      ><span class="short">{weekday(i, 'short')}</span></span>{/each}
  </div>
  <div class="grid">
    {#each weeks as week (week.at(0)?.date)}
      {#each week as cell (cell.date)}
        {#if cell.inMonth}
          {@const entries = byDate.get(cell.date) ?? []}
          <section id="day-{cell.date}" data-day={cell.date} aria-label={longDate(cell.date)}
            class={['cell', { today: cell.date === today, past: cell.date < today }]}
            {@attach (node) => (cell.date === today ? watchToday(node) : undefined)}>
            <h2 class="number">
              <span class="date">{Number(cell.date.slice(8))}</span>
              {#if cell.date === today}<span class="tag">Today</span>{/if}
            </h2>
            <div class="cards">
              {#each entries as entry (entry.key)}<CalendarEntryCard {entry} icons={cardIcons(entry)} {artwork} {mixed} small />{/each}
            </div>
          </section>
        {:else}
          <div class={['cell', 'out']} aria-hidden="true">
            <span class="number"><span class="date">{Number(cell.date.slice(8))}</span></span>
          </div>
        {/if}
      {/each}
    {/each}
  </div>
</div>

<style>
.weekdays {
  container-type: inline-size;
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--calendar-month-gap);
  block-size: var(--calendar-weekdays-height);
  padding-inline: var(--calendar-month-gap);
  background-color: var(--color-calendar-weekdays);
  border-block-end: 1px solid var(--color-frame-line);

  /* Full names when every column has room for "Wednesday". */
  & .long {
    display: none;
  }

  @container (width >= 760px) {
    & .long {
      display: inline;
    }

    & .short {
      display: none;
    }
  }

  & > span {
    align-self: center;
    padding-inline: var(--space-xs-inline);
    color: var(--color-sidebar-label);
    font-size: var(--font-size-sidebar-section);
    font-weight: var(--font-weight-menu-header);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;

    &.today {
      color: var(--brand-primary);
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--calendar-month-gap);
  padding: var(--calendar-month-gap);
}

.cell {
  display: flex;
  flex-direction: column;
  gap: var(--calendar-month-gap);
  min-inline-size: 0;
  min-block-size: var(--calendar-month-cell-min);
  padding: 0 var(--calendar-month-cell-padding) var(--calendar-month-gap);
  border-radius: var(--radius-calendar-day);
  background-color: var(--color-calendar-day);
  scroll-margin-block-start: calc(var(--header-height) + var(--calendar-weekdays-height));

  &.out {
    background-color: var(--color-calendar-out);
  }

  &.today {
    background-color: var(--color-calendar-today-tint);
  }

  & :global(.calendar-entry) {
    block-size: auto;
    border-radius: var(--radius-calendar-month-card);
  }
}

/* Pinned under the weekday row while its week scrolls, on the tile's own color. */
.number {
  position: sticky;
  inset-block-start: calc(var(--header-height) + var(--calendar-weekdays-height));
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  box-sizing: border-box;
  min-block-size: var(--calendar-month-day-height);
  margin: 0 calc(-1 * var(--calendar-month-cell-padding));
  padding: 0 var(--space-sm-inline);
  border-radius: var(--radius-calendar-day) var(--radius-calendar-day) 0 0;
  background-color: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;

  .past & .date {
    color: var(--color-calendar-past);
  }

  .out & .date {
    color: var(--color-mini-month-out);
  }

  .today & .date {
    color: var(--brand-primary);
  }
}

.date {
  font-size: var(--font-size-sidenav-subtitle);
  font-variant-numeric: tabular-nums;
}

.tag {
  margin-inline-start: auto;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-calendar-today-tag);
  letter-spacing: var(--letter-spacing-sidebar-label);
  line-height: 1.4;
  text-transform: uppercase;
}

.cards {
  display: grid;
  gap: var(--calendar-month-gap);
}
</style>
