<!--
  The dashboard's Upcoming Schedule panel, over the first three days from the start day with anything on the viewer's
  calendars. On the left, the first of them: as many cards as the right side leaves room for (at least three), then
  the rest of that day as rows. On the right, the days after it as rows. The sides stack in a narrow panel. Pass the unawaited `fetchSchedule` promise from the loader,
  so the page streams in and this panel spins until it lands, and fails on its own if it doesn't.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import type { ScheduleDay } from '$lib/dashboard/ScheduleDay';
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';
import { toScheduleLayout } from '$lib/dashboard/toScheduleLayout';
import DashboardPanel from './DashboardPanel.svelte';
import ScheduleCard from './ScheduleCard.svelte';
import ScheduleRows from './ScheduleRows.svelte';

interface Props {
  schedule: Promise<readonly ScheduleDay[]>;
  /** The filter, for the help line and the Calendar link. Left out, OG's Shows & Movies. */
  filter?: DashboardSettings['schedule']['filter'];
}

const { schedule, filter = 'shows-movies' }: Props = $props();

// OG printed the raw filter value; og says what it means.
const FILTER_NAMES: Readonly<Record<NonNullable<Props['filter']>, string>> = {
  'shows-movies': 'shows',
  shows: 'shows',
  premieres: 'premieres',
  'new-shows': 'new shows',
  finales: 'finales',
};

let watching = $state<NonNullable<ScheduleItem['watchNow']>>();
let open = $state(false);

function watchNow(item: NonNullable<ScheduleItem['watchNow']>) {
  watching = item;
  open = true;
}
</script>

<!-- The settings page isn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet panel(loading: boolean, content: Snippet, empty = false)}
  <DashboardPanel
  --panel-bg="var(--color-schedule-bg)"
  --panel-padding-end="calc(var(--gutter) + var(--space-lg-block))"
  --panel-min-height={empty ? 'auto' : 'var(--schedule-min-height)'}
  title="Upcoming Schedule"
  {loading}
  seeMore={{ href: `/calendars/my/${filter}`, text: 'Calendar' }}
>
    {#snippet help()}All of your {FILTER_NAMES[filter]} + movies on your watchlist.{/snippet}
    {@render content()}
  </DashboardPanel>
{/snippet}

{#await schedule}
  {@render panel(true, pending)}
{:then days}
  {@const layout = toScheduleLayout(days)}
  {#snippet content()}
    {#if !layout}
      <p class="nothing">Nothing coming up on your calendar. <a href="/calendars/my/{filter}">Open the calendar</a>.</p>
    {:else}
      {@const { spotlight } = layout}
      <div class="schedule">
  <div class="split">
          <div class="spotlight">
            {#if spotlight.nothing}<p class="nothing">{spotlight.nothing}</p>{/if}
            <h3>{spotlight.heading} <span>{spotlight.short}</span></h3>
            <div class="cards">
              {#each spotlight.cards as row (row.key)}
                <ScheduleCard {row} onwatchnow={watchNow} />
              {/each}
            </div>
            {#if spotlight.also}
              <h3 class="also">{spotlight.also.heading} <span>{spotlight.also.count} more</span></h3>
              <ScheduleRows rows={spotlight.also} />
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
</div>
    {/if}
  {/snippet}
  {@render panel(false, content, !layout)}
{:catch}
  {@render panel(false, failed)}
{/await}

{#if watching}
  {#key watching}
    <WatchNowDialog bind:open button={watching.button} title={watching.title} year={watching.year}
  fanart={watching.fanart} />
  {/key}
{/if}

{#snippet pending()}{/snippet}

{#snippet failed()}
  <div class="notice">
  <NoData>The schedule didn't load. Refresh the page to try again.</NoData>
</div>
{/snippet}

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
}

.split {
  display: grid;
  grid-template-columns: var(--schedule-split);
  gap: var(--space-schedule-split);
  align-items: start;

  @container (width < 900px) {
    grid-template-columns: 1fr;
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

  &.also {
    margin-block-start: var(--space-schedule-day);
  }
}

.cards {
  display: grid;
  gap: var(--space-schedule-card);
}

.day + .day {
  margin-block-start: var(--space-schedule-day);
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
</style>
