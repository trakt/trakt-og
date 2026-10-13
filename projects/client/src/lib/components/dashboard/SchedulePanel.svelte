<!--
  The dashboard's Upcoming Schedule panel, over the first five days from the start day with anything on the viewer's
  calendars. On top, the first of them as cards with medium posters (six, then "Show N more"); under it, the next four
  as columns of rows with small posters. Pass the unawaited `fetchSchedule` promise from the loader, so the page
  streams in and this panel spins until it lands, and fails on its own if it doesn't. With `onfilter`, pill buttons
  under the title switch the calendar type in place: the old days stay dimmed until the new ones land.
-->
<script lang="ts">
import NoData from '$lib/components/empty/NoData.svelte';
import PillTabs from '$lib/components/tabs/PillTabs.svelte';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import type { ScheduleDay } from '$lib/dashboard/ScheduleDay';
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';
import { toScheduleLayout } from '$lib/dashboard/toScheduleLayout';
import calendarLines from '$lib/icons/regular/calendar-lines.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import ScheduleCard from './ScheduleCard.svelte';
import ScheduleRows from './ScheduleRows.svelte';

type Filter = DashboardSettings['schedule']['filter'];
type Days = readonly ScheduleDay[];

interface Props {
  schedule: Promise<Days>;
  /** The filter, for the picked pill and the Calendar link. Left out, OG's Shows & Movies. */
  filter?: Filter;
  /** Loads (and saves) another calendar type. Left out, the type buttons don't show. */
  onfilter?: (filter: Filter) => Promise<Days>;
}

const { schedule, filter = 'shows-movies', onfilter }: Props = $props();

// OG's settings form offered these four. "All shows" is the Shows & Movies calendar the dashboard opens on.
const TYPES = [
  { id: 'shows-movies', label: 'All shows' },
  { id: 'premieres', label: 'Premieres' },
  { id: 'new-shows', label: 'New shows' },
  { id: 'finales', label: 'Finales' },
] as const satisfies readonly { id: Filter; label: string }[];

let picked = $state<{ filter: Filter; schedule: Promise<Days> }>();
const active = $derived(picked ?? { filter, schedule });
const selectedType = $derived(active.filter === 'shows' ? 'shows-movies' : active.filter);

/** The last schedule that landed: its days, or null when it failed. */
let settled = $state<{ schedule: Promise<Days>; days: Days | null }>();
const loading = $derived(settled?.schedule !== active.schedule);
const layout = $derived(settled?.days ? toScheduleLayout(settled.days) : undefined);

// Only the newest request lands, so a slow earlier type can't overwrite a later one.
$effect(() => {
  const current = active.schedule;
  const land = (days: Days | null) => {
    if (active.schedule === current) settled = { schedule: current, days };
  };
  current.then(land, () => land(null));
});

function choose(id: string) {
  const type = TYPES.find((option) => option.id === id);
  if (!type || !onfilter || type.id === selectedType) return;

  picked = { filter: type.id, schedule: onfilter(type.id) };
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
  seeMore={{ href: `/calendars/my/${active.filter}`, text: 'Calendar' }}
>
  {#if onfilter}
    <PillTabs label="Calendar type" tabs={TYPES} bind:selected={() => selectedType, choose}>
      {#snippet panel()}{@render body()}{/snippet}
    </PillTabs>
  {:else}
    {@render body()}
  {/if}
</DashboardPanel>

{#snippet body()}
  {#if settled?.days === null}
    <div class="notice">
  <NoData>The schedule didn't load. Refresh the page to try again.</NoData>
</div>
  {:else if layout === null}
    <p
  class="nothing">Nothing coming up on your calendar. <a href="/calendars/my/{active.filter}">Open the calendar</a>.</p>
  {:else if layout}
    {@const { spotlight } = layout}
    {@const cards = allCards ? [...spotlight.shown, ...spotlight.more] : spotlight.shown}
    <div class="schedule" class:stale={loading}>
      <div class="spotlight">
        {#if spotlight.nothing}<p class="nothing">{spotlight.nothing}</p>{/if}
        <h3>{spotlight.heading} <span>{spotlight.short}</span></h3>
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
              <h3>{day.relative} <span>{day.short}</span></h3>
              <ScheduleRows rows={day} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

{#if watching}
  {#key watching}
    <WatchNowDialog bind:open button={watching.button} title={watching.title} year={watching.year}
  fanart={watching.fanart} />
  {/key}
{/if}

<style>
/* OG's alert sat in a row, which kept 20px above it. */
.notice {
  padding-block-start: var(--gutter);
  --color-no-data-bg: var(--color-schedule-no-data-bg);
}

.nothing {
  margin: var(--gutter) 0 var(--space-schedule-heading);
  padding: var(--schedule-nothing-padding);
  border: 1px dashed var(--color-schedule-separator);
  color: var(--color-schedule-muted);
  font-size: var(--font-size-schedule-row);

  .spotlight & {
    margin-block-start: 0;
  }
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

  & span {
    margin-inline-start: var(--space-schedule-code);
    color: var(--color-schedule-muted);
    font-weight: var(--font-weight-headings-light);
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
