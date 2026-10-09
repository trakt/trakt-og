<!--
  The calendar sidebar's month at a glance: a square per day, redder the more airs that day, today ringed in white and
  the first day in view outlined in blue. Picking a day jumps the page to it.
    <MiniMonth month="2026-10" counts={countsByDate} today="2026-10-09" marked={firstVisible} onpick={jump} />
-->
<script lang="ts">
import { monthGrid } from '$lib/calendars/monthGrid';

interface Props {
  /** `YYYY-MM`, or any day in it. */
  month: string;
  /** Cards per day. */
  counts: ReadonlyMap<string, number>;
  today: string;
  /** The first day in view. */
  marked?: string;
  weekStart?: number;
  onpick: (date: string) => void;
}

const { month, counts, today, marked, weekStart = 0, onpick }: Props = $props();

const weeks = $derived(monthGrid({ month, weekStart }));
const max = $derived(Math.max(1, ...counts.values()));
const weekdays = $derived(
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat('en-US', { weekday: 'narrow', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 9, 4 + ((weekStart + i) % 7))),
    )),
);
const fullDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
const heat = (date: string) => `calc(var(--mini-month-heat-max) * ${(counts.get(date) ?? 0) / max})`;
</script>

<table class="mini-month">
  <thead>
    <tr>{#each weekdays as weekday, i (i)}<th scope="col" abbr={weekday}>{weekday}</th>{/each}</tr>
  </thead>
  <tbody>
    {#each weeks as week (week.at(0)?.date)}
      <tr>
        {#each week as cell (cell.date)}
          <td>
            {#if cell.inMonth}
              {@const count = counts.get(cell.date) ?? 0}
              <button type="button" class={{ today: cell.date === today, marked: cell.date === marked }}
                style:--heat={heat(cell.date)} aria-current={cell.date === today ? 'date' : undefined}
                aria-label="{fullDate(cell.date)}, {count} {count === 1 ? 'item' : 'items'}"
                onclick={() => onpick(cell.date)}>{Number(cell.date.slice(8))}</button>
            {:else}
              <span class="out" aria-hidden="true">{Number(cell.date.slice(8))}</span>
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
.mini-month {
  inline-size: 100%;
  border-collapse: separate;
  border-spacing: var(--mini-month-gap);
  margin: calc(-1 * var(--mini-month-gap));
  table-layout: fixed;
}

th {
  padding-block-end: var(--space-xs-block);
  color: var(--color-sidebar-label);
  font-size: var(--font-size-mini-month-weekday);
  font-weight: var(--font-weight-menu-header);
  text-align: center;
}

td {
  padding: 0;
}

button,
.out {
  display: grid;
  place-items: center;
  inline-size: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-mini-month-cell);
  font-size: var(--font-size-mini-month);
  font-weight: var(--font-weight-menu-header);
  font-variant-numeric: tabular-nums;
}

button {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background-color: color-mix(in srgb, var(--color-mini-month-heat) var(--heat), var(--color-mini-month-cell));
  color: var(--color-frame-text);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    outline: 2px solid var(--color-frame-text);
    outline-offset: -2px;
  }

  &.today {
    box-shadow: inset 0 0 0 2px var(--color-frame-text);
  }

  &.marked {
    outline: 2px solid var(--color-mini-month-marked);
    outline-offset: -2px;
  }

  &.today.marked {
    box-shadow: inset 0 0 0 2px var(--color-frame-text), 0 0 0 2px var(--color-mini-month-marked);
    outline: 0;
  }
}

.out {
  color: var(--color-mini-month-out);
}
</style>
