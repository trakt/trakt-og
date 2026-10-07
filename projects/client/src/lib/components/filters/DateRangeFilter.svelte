<!--
  OG's date range (`.btn-date-range`, `global.js:2922-3021`): a calendar icon, red while a range is set, that opens
  the shared filter panel with Start Date and End Date pickers. Apply reloads with `start_at` and `end_at`, and
  Clear drops them. While a range is set, a two-line chip beside it reads the label over "Sep 1, 2026 → Sep 10,
  2026", or "→ present" with no end. The pickers are native datetime-local inputs in the viewer's zone.
    <DateRangeFilter start={filters.startAt} end={filters.endAt} label="Watched At" {datePreferences} />
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { watchDateInput } from '$lib/components/history/watchDateInput';
import { watchDateInstant } from '$lib/components/history/watchDateInstant';
import Icon from '$lib/icons/Icon.svelte';
import FilterPopover from '$lib/components/filters/FilterPopover.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import arrowRight from '$lib/icons/trakt/arrow-right.svg?raw';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { formatDate } from '$lib/utils/formatDate';

interface Props {
  /** UTC instants. */
  start?: string;
  end?: string;
  /** The chip's first line: "Watched At", "Collected At". */
  label: string;
  datePreferences: DatePreferences;
}

const { start, end, label, datePreferences }: Props = $props();
let from = $state('');
let to = $state('');
let maximum = $state('');

const day = (at: string) => formatDate(at, { ...datePreferences, format: 'll' });
// OG left the end off when it fell on the start's day.
const sameDay = $derived(
  start && end && watchDateInput(new Date(end), datePreferences.timeZone).slice(0, 10) <=
      watchDateInput(new Date(start), datePreferences.timeZone).slice(0, 10),
);

function prepare() {
  const now = new Date();
  maximum = watchDateInput(now, datePreferences.timeZone);
  from = watchDateInput(start ? new Date(start) : now, datePreferences.timeZone);
  to = watchDateInput(end ? new Date(end) : now, datePreferences.timeZone);
}

function reload(range: { start_at: string; end_at: string } | null) {
  const url = new URL(page.url);
  for (const key of ['start_at', 'end_at', 'days', 'page']) url.searchParams.delete(key);
  if (range) { for (const [key, value] of Object.entries(range)) url.searchParams.set(key, value); }
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the current page with a new query string
  void goto(url);
}

function apply() {
  const start_at = watchDateInstant(from, datePreferences.timeZone);
  const end_at = watchDateInstant(to, datePreferences.timeZone);
  if (start_at && end_at) reload({ start_at, end_at });
}
</script>

<FilterPopover svg={calendar} label="Date range" tooltip="Date Range" title={label}
  help="Only display items from this date range." align="start" active={Boolean(start)} clearable={Boolean(start)}
  onopen={prepare} onapply={apply} onclear={() => reload(null)}>
  <div class="dates">
    <label>
      <span class="field-label">Start date</span>
      <input type="datetime-local" bind:value={from} max={maximum} required />
    </label>
    <label>
      <span class="field-label">End date</span>
      <input type="datetime-local" bind:value={to} min={from} max={maximum} required />
    </label>
  </div>
</FilterPopover>
{#if start}
  <span class="chip">
  <strong>{label}</strong>
  <span>
      {day(start)}
      {#if !end}<span class="arrow"><Icon svg={arrowRight} /></span>present{:else if !sameDay}<span class="arrow"
        ><Icon svg={arrowRight} /></span>{day(end)}{/if}
    </span>
</span>
{/if}

<style>
.dates {
  display: grid;
  gap: var(--space-filter-popover);
}

label {
  display: grid;
  gap: var(--space-filter-popover-title);
}

.field-label {
  color: var(--color-control-muted);
  font-size: var(--font-size-small);
}

.chip {
  display: inline-grid;
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-date-range-chip);
  line-height: 1.3;
  text-transform: uppercase;

  & strong {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.arrow {
  margin-inline: 5px;
  color: var(--color-text-muted);
}
</style>
