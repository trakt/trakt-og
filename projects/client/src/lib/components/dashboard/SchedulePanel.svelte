<!--
  The dashboard's Upcoming Schedule panel, over the first five days from the start day with anything on the viewer's
  calendars. On top, the first of them as cards with medium posters (six, then "Show N more"); under it, the next four
  as columns of rows with small posters. Pass the unawaited `fetchSchedule` promise from the loader, so the page
  streams in and shimmering cards and rows hold their place until it lands, and it fails on its own if it doesn't. With `onpick`, Shows and
  Movies dropdowns under the title switch what it reads in place: the old days stay dimmed until the new ones land.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import LoadFailed from '$lib/components/empty/LoadFailed.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import PanelPrompt from '$lib/components/empty/PanelPrompt.svelte';
import { panelQuotes } from '$lib/firstNight/panelQuotes';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import type { ScheduleDay } from '$lib/dashboard/ScheduleDay';
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';
import { scheduleCalendars } from '$lib/dashboard/scheduleCalendars';
import { toScheduleLayout } from '$lib/dashboard/toScheduleLayout';
import calendarLines from '$lib/icons/regular/calendar-lines.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import ScheduleCard from './ScheduleCard.svelte';
import ScheduleRows from './ScheduleRows.svelte';

type Picks = Pick<DashboardSettings['schedule'], 'filter' | 'movies'>;
type Days = readonly ScheduleDay[];

interface Props {
  schedule: Promise<Days>;
  /** The Shows pick, for its dropdown and the Calendar link. Left out, OG's Shows & Movies. */
  filter?: Picks['filter'];
  /** The Movies pick. Left out, all of them, as OG always showed. */
  movies?: Picks['movies'];
  /** Loads (and saves) other picks. Left out, the dropdowns don't show. */
  onpick?: (picks: Picks) => Promise<Days>;
}

const { schedule, filter = 'shows-movies', movies = 'all', onpick }: Props = $props();

// OG's settings form offered the first four. "All" is the Shows & Movies calendar the dashboard opens on.
const SHOWS = [
  { id: 'shows-movies', label: 'All' },
  { id: 'premieres', label: 'Premieres' },
  { id: 'new-shows', label: 'New' },
  { id: 'finales', label: 'Finales' },
  { id: 'none', label: 'None' },
] as const satisfies readonly { id: Picks['filter']; label: string }[];

const MOVIES = [
  { id: 'all', label: 'All' },
  { id: 'none', label: 'None' },
] as const satisfies readonly { id: Picks['movies']; label: string }[];

let picked = $state<Picks & { schedule: Promise<Days> }>();
const active = $derived(picked ?? { filter, movies, schedule });
// OG's "All my TV shows" is All here too.
const shows = $derived(active.filter === 'shows' ? 'shows-movies' : active.filter);
const calendar = $derived(scheduleCalendars(active).at(0) ?? 'shows-movies');

/** The last schedule that landed: its days, or null when it failed. */
let settled = $state<{ schedule: Promise<Days>; days: Days | null }>();
const loading = $derived(settled?.schedule !== active.schedule);
const layout = $derived(settled?.days ? toScheduleLayout(settled.days) : undefined);

// Only the newest request lands, so a slow earlier pick can't overwrite a later one.
$effect(() => {
  const current = active.schedule;
  const land = (days: Days | null) => {
    if (active.schedule === current) settled = { schedule: current, days };
  };
  current.then(land, () => land(null));
});

function pick(next: Partial<Picks>) {
  const picks = { filter: shows, movies: active.movies, ...next };
  if (!onpick || (picks.filter === shows && picks.movies === active.movies)) return;

  picked = { ...picks, schedule: onpick(picks) };
}

// A pick's own request goes again; the dashboard's first schedule comes from its loader.
async function retry() {
  if (!picked || !onpick) {
    await invalidateAll();
    return;
  }
  picked = { ...picked, schedule: onpick(picked) };
}

let allCards = $state(false);

let watching = $state<NonNullable<ScheduleItem['watchNow']>>();
let open = $state(false);

function watchNow(item: NonNullable<ScheduleItem['watchNow']>) {
  watching = item;
  open = true;
}
</script>

<!-- The settings page isn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<DashboardPanel
  --panel-bg="var(--color-schedule-bg)"
  --panel-padding-end="calc(var(--gutter) + var(--space-lg-block))"
  --panel-min-height={layout === null ? 'auto' : 'var(--schedule-min-height)'}
  title="Upcoming Schedule"
  icon={calendarLines}
  {loading}
  seeMore={{ href: `/calendars/my/${calendar}`, text: 'Calendar' }}
>
  {#if onpick}
    <div class="picks">
      {@render menu('Shows', SHOWS, shows, (id) => pick({ filter: id }))}
      {@render menu('Movies', MOVIES, active.movies, (id) => pick({ movies: id }))}
    </div>
  {/if}
  {@render body()}
</DashboardPanel>

{#snippet menu<Id extends string>(
  section: string,
  options: readonly { id: Id; label: string }[],
  current: Id,
  onchoose: (id: Id) => void,
)}
  <Dropdown {section}>
    {#snippet trigger()}{options.find(({ id }) => id === current)?.label}{/snippet}
    <ul>
      {#each options as option (option.id)}
        <li>
          <button type="button" aria-current={option.id === current ? 'true' : undefined}
            onclick={() => onchoose(option.id)}>{option.label}</button>
        </li>
      {/each}
    </ul>
  </Dropdown>
{/snippet}

<!-- "Oct 14" (or "14 Oct"), muted, with the day number bold: the only digits in it. -->
{#snippet date(short: string)}
  <span
  class="date">{#each short.split(/(\d+)/) as part, i (i)}{#if i % 2 === 1}<b>{part}</b>{:else}{part}{/if}{/each}</span>
{/snippet}

{#snippet body()}
  {#if settled?.days === null}
    <div class="notice">
  <LoadFailed what="Upcoming Schedule" onretry={retry} />
</div>
  {:else if layout === null}
    {@const off = active.filter === 'none' && active.movies === 'none'}
    {#if off}
      <div class="notice">
        <EmptyState action={{ onclick: () => pick({ filter: 'shows-movies', movies: 'all' }), text: 'Show shows and movies' }} />
      </div>
    {:else}
      <PanelPrompt quote={panelQuotes.schedule} tall roomy
  --panel-prompt-offset="calc(var(--gutter) + var(--space-lg-block))"
  text="Add shows you watch. New episodes land here the day they air."
  action={{ href: resolve('/shows/[chart=chart]', { chart: 'trending' }), text: 'Find a show' }} />
    {/if}
  {:else if layout}
    {@const { spotlight } = layout}
    {@const cards = allCards ? [...spotlight.shown, ...spotlight.more] : spotlight.shown}
    <div class="schedule" class:stale={loading}>
      <div class="spotlight">
        <h3>
          {spotlight.heading} {@render date(spotlight.short)}{#if spotlight.nothing}<span class="note"
          ><span class="dash">—</span>{spotlight.nothing}</span>{/if}
        </h3>
        <div class="cards">
          {#each cards as row (row.key)}
            <ScheduleCard {row} onwatchnow={watchNow} />
          {/each}
        </div>
        {#if spotlight.more.length > 0}
          <button type="button" class="more" aria-expanded={allCards} onclick={() => (allCards = !allCards)}>
            {allCards ? 'Show fewer' : `Show ${spotlight.more.length} more`}
          </button>
        {/if}
      </div>
      {#if layout.week.length > 0}
        <div class="week">
          {#each layout.week as day (day.date)}
            <div class="day">
              <h3>{day.relative} {@render date(day.short)}</h3>
              <ScheduleRows rows={day} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    {@render shimmers()}
  {/if}
{/snippet}

<!-- The first day's cards and the week's columns of rows, shimmering in their places until the first schedule lands. -->
{#snippet shimmers()}
  {@const count = (n: number) => Array.from({ length: n }, (_, i) => i)}
  <div class="schedule">
    <div class="spotlight">
      <h3><Shimmer inline="var(--schedule-shimmer-day-width)" block="var(--font-size-schedule-day)" /></h3>
      <div class="cards">
        {#each count(3) as card (card)}
          <div class="card-shimmer">
            <span class="poster-shimmer"><Shimmer inline="100%" block="100%" /></span>
            <span class="lines">
              <Shimmer inline="var(--schedule-shimmer-title-width)" block="var(--font-size-h4)" />
              <Shimmer inline="var(--schedule-shimmer-line-width)" block="var(--font-size-schedule-row)" />
              <Shimmer inline="var(--schedule-shimmer-short-width)" block="var(--font-size-schedule-row)" />
            </span>
          </div>
        {/each}
      </div>
    </div>
    <div class="week">
      {#each count(4) as day (day)}
        <div class="day">
          <h3><Shimmer inline="var(--schedule-shimmer-day-width)" block="var(--font-size-schedule-day)" /></h3>
          {#each count(2) as row (row)}
            <div class="row-shimmer">
              <span class="poster-shimmer"><Shimmer inline="100%" block="100%" /></span>
              <span class="lines">
                <Shimmer inline="var(--schedule-shimmer-line-width)" block="var(--font-size-base)" />
                <Shimmer inline="var(--schedule-shimmer-short-width)" block="var(--font-size-schedule-row)" />
              </span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#if watching}
  {#key watching}
    <WatchNowDialog bind:open button={watching.button} title={watching.title} year={watching.year}
  fanart={watching.fanart} />
  {/key}
{/if}

<style>
/* Under the title, as far as the Social Feed's dropdowns sit from its. */
.picks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-dropdown-row);
  align-items: center;
  padding-block-start: var(--space-heading-dropdowns);
}

/* OG's alert sat in a row, which kept 20px above it. */
.notice {
  padding-block-start: var(--gutter);
}

.schedule {
  container-type: inline-size;
  padding-block-start: var(--gutter);
  animation: fade-in var(--transition-card) ease-out;

  &.stale {
    opacity: var(--schedule-stale-opacity);
  }
}

h3 {
  margin: 0 0 var(--space-schedule-heading);
  font-size: var(--font-size-schedule-day);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;

  & .date {
    color: var(--color-schedule-muted);
    font-weight: var(--font-weight-headings-light);

    & b {
      font-weight: var(--font-weight-headings-heavy);
    }
  }

  /* "Nothing on today.", an aside after the date. */
  & .note {
    color: var(--color-schedule-note);
    font-weight: var(--font-weight-headings-light);
    font-style: italic;
    text-transform: none;
  }

  & .dash {
    padding-inline: var(--space-schedule-note-dash);
  }

  .spotlight & {
    color: var(--brand-primary);
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--schedule-card-min), 100%), 1fr));
  gap: var(--space-schedule-card);
}

.more {
  display: block;
  inline-size: 100%;
  margin-block-start: var(--space-schedule-card);
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

.week {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-schedule-day) var(--space-schedule-split);
  align-items: start;
  margin-block-start: var(--space-schedule-band);

  @container (width < 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container (width < 500px) {
    grid-template-columns: 1fr;
  }
}

/* A card's place: its poster and lines on the card's own surface. */
.card-shimmer {
  display: flex;
  gap: var(--space-schedule-card-gap);
  padding: var(--space-schedule-card-padding);
  border-radius: var(--radius-schedule-card);
  background-color: var(--color-surface);

  & .poster-shimmer {
    inline-size: var(--schedule-card-poster);
  }
}

/* A day's row: its small poster and two lines, under the row's separator. */
.row-shimmer {
  display: grid;
  grid-template-columns: var(--schedule-day-poster) minmax(0, 1fr);
  gap: var(--space-schedule-row-gap);
  align-items: start;
  padding: var(--space-schedule-day-row) var(--space-schedule-row);
  border-block-start: 1px solid var(--color-schedule-separator);
}

.poster-shimmer {
  display: flex;
  flex-shrink: 0;
  aspect-ratio: var(--ratio-poster);
}

.lines {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--space-schedule-shimmer-lines);
  min-inline-size: 0;
}

/* Its rows stack poster beside text in a column this narrow. */
.day {
  container-type: inline-size;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .schedule {
    animation: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .schedule {
    transition: opacity var(--transition-card);
  }
}
</style>
