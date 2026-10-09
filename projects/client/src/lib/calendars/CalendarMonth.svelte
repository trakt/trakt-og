<!--
  The calendar's month view: whole weeks under a pinned weekday row, each day a cell with its number pinned while its
  week scrolls, then its cards stacked one wide, each with the full quick-icon bar. Today's cell has a red top edge, a
  red date and a TODAY tag, and today's weekday column is tinted; past dates are grey. Days from the neighbouring months
  only pad the weeks.
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
  cardIcons: (entry: CalendarEntry) => Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { month, days, today, artwork, weekStart = 0, cardIcons }: Props = $props();

const weeks = $derived(monthGrid({ month, weekStart }));
const byDate = $derived(new Map(days.map((day) => [day.date, day.entries])));
const todayColumn = $derived(
  today.slice(0, 7) === month.slice(0, 7) ? (new Date(`${today}T00:00:00Z`).getUTCDay() - weekStart + 7) % 7 : -1,
);
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
    {#each { length: 7 } as _, i (i)}<span class={{ today: i === todayColumn }}>{weekday(i, 'short')}</span>{/each}
  </div>
  <div class="grid">
    {#each weeks as week (week.at(0)?.date)}
      {#each week as cell, column (cell.date)}
        {#if cell.inMonth}
          {@const entries = byDate.get(cell.date) ?? []}
          <section id="day-{cell.date}" data-day={cell.date} aria-label={longDate(cell.date)}
            class={['cell', { today: cell.date === today, past: cell.date < today, column: column === todayColumn }]}>
            <h2 class="number">
              <span class="date">{Number(cell.date.slice(8))}</span>
              {#if cell.date === today}<span class="tag">Today</span>{/if}
            </h2>
            <div class="cards">
              {#each entries as entry (entry.key)}<CalendarEntryCard {entry} icons={cardIcons(entry)} {artwork} compact />{/each}
            </div>
          </section>
        {:else}
          <div class={['cell', 'out', { column: column === todayColumn }]} aria-hidden="true">
            <span class="number"><span class="date">{Number(cell.date.slice(8))}</span></span>
          </div>
        {/if}
      {/each}
    {/each}
  </div>
</div>

<style>
.weekdays {
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  block-size: var(--calendar-weekdays-height);
  background-color: var(--color-date-separator);
  border-block-end: 1px solid var(--color-frame-border);

  & span {
    align-self: center;
    padding-inline: var(--space-sm-inline);
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
}

.cell {
  min-inline-size: 0;
  min-block-size: var(--calendar-month-cell-min);
  background-color: var(--color-frame);
  border-inline-end: 1px solid var(--color-frame-border);
  border-block-end: 1px solid var(--color-frame-border);
  scroll-margin-block-start: calc(var(--header-height) + var(--calendar-weekdays-height));

  &:nth-child(7n) {
    border-inline-end: 0;
  }

  &.column {
    background-color: var(--color-calendar-today-tint);
  }

  /* Narrow cards: smaller captions, and the network left to the card's link. */
  & :global(.fanart .titles h3) {
    font-size: var(--font-size-base);
  }

  & :global(.fanart .tag.generic) {
    display: none;
  }

  &.out {
    background-color: var(--color-calendar-out);
  }

  &.today {
    box-shadow: inset 0 3px 0 var(--brand-primary);
  }
}

/* Pinned under the weekday row while its week scrolls. */
.number {
  position: sticky;
  inset-block-start: calc(var(--header-height) + var(--calendar-weekdays-height));
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin: 0;
  padding: var(--space-base-block) var(--space-sm-inline);
  background-color: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;

  .cell:not(.out) & {
    border-block-end: 1px solid var(--color-frame-border);
  }

  .past & .date {
    color: var(--color-calendar-past);
  }

  .out & .date {
    color: var(--color-mini-month-out);
  }

  .today & {
    background-color: var(--color-date-separator);
  }

  .today & .date {
    display: grid;
    place-items: center;
    inline-size: 24px;
    block-size: 24px;
    border-radius: 50%;
    background-color: var(--brand-primary);
    color: var(--color-text-inverse);
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
}
</style>
