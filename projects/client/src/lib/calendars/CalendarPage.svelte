<!--
  The calendars (`/calendars/[calendar]/[[start]]` and `/calendars/my/[calendar]/[[start]]`): a month of one calendar in
  a SidebarFrame. The sidebar holds every control, so the content is only the month: the calendar picker with the
  fade/hide and filter tools, the counts, the month pager over a heat-map mini month that follows the scroll, the
  applied filters, the display choices and the iCal feed. The month shows as a list of days or as a month grid, with a
  show's episodes from one day grouped into one card when the viewer wants that.
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import CalendarFeed from '$lib/components/calendar/CalendarFeed.svelte';
import MiniMonth from '$lib/components/calendar/MiniMonth.svelte';
import MonthPager from '$lib/components/calendar/MonthPager.svelte';
import WeekBars from '$lib/components/calendar/WeekBars.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FiltersPanel from '$lib/components/filters/FiltersPanel.svelte';
import AdvancedFiltersToggle from '$lib/components/filters/AdvancedFiltersToggle.svelte';
import { type AdvancedFilters, advancedFiltersSearch } from '$lib/components/filters/advancedFilters';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, fadeHideOptions, matchesFadeHide } from '$lib/components/filters/fadeHide';
import FilterChips from '$lib/components/filters/FilterChips.svelte';
import { type FilterTag, filterTags } from '$lib/components/filters/filterTags';
import { watchNowTiles } from '$lib/components/filters/watchNowFilter';
import { withoutFilterTag } from '$lib/components/filters/withoutFilterTag';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import { episodeBatchState } from '$lib/components/history/episodeBatchState';
import type QuickIcons from '$lib/components/media/QuickIcons.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import CountPill from '$lib/components/sidebar/CountPill.svelte';
import IconSwitch from '$lib/components/sidebar/IconSwitch.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import calendarDays from '$lib/icons/regular/calendar-days.svg?raw';
import grid from '$lib/icons/regular/grid-2.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { ComponentProps } from 'svelte';
import type { CalendarItem } from './calendarDays.ts';
import {
  CALENDAR_ARTWORK,
  CALENDAR_DISPLAY_COOKIES,
  type CalendarArtwork,
  type CalendarDisplay,
  type CalendarView,
} from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import { calendarFilterState } from './calendarFilterState.ts';
import CalendarList from './CalendarList.svelte';
import CalendarMonth from './CalendarMonth.svelte';
import { type CalendarGroup, groupCalendarItems } from './groupCalendarItems.ts';
import { groupLabel } from './groupLabel.ts';
import type { loadCalendar } from './loadCalendar.ts';
import { MY_CALENDARS } from './myCalendars.ts';
import { nearbyMonths } from './nearbyMonths.ts';
import { PUBLIC_CALENDARS } from './publicCalendars.ts';
import { toCalendarCard } from './toCalendarCard.ts';
import { toCalendarGroupCard } from './toCalendarGroupCard.ts';
import { visibleCalendarDays } from './visibleCalendarDays.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadCalendar>> & { user: HeaderUser | null; datePreferences: DatePreferences };
};

const { data }: Props = $props();

const vip = $derived(data.user?.isVip ?? false);
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const weekStart = $derived(Math.max(0, WEEKDAYS.indexOf(data.preferences.startDay)));

/* ---------- display ---------- */

let display = $derived<CalendarDisplay>(data.display);
function setDisplay(patch: Partial<CalendarDisplay>) {
  display = { ...display, ...patch };
  for (const key of Object.keys(patch) as (keyof CalendarDisplay)[]) {
    document.cookie = `${CALENDAR_DISPLAY_COOKIES[key]}=${display[key]}; path=/; samesite=lax; max-age=31536000`;
  }
}
const views: readonly { value: CalendarView; label: string; icon: string }[] = [
  { value: 'list', label: 'List', icon: grid },
  { value: 'month', label: 'Month', icon: calendarDays },
];
const artworkLabels: Record<CalendarArtwork, string> = {
  logo: 'Logo',
  fanart: 'Fanart',
  screenshot: 'Still',
  poster: 'Poster',
  none: 'Text',
  thumb: 'Thumb',
  banner: 'Banner',
};
const artworkChoices = $derived<readonly CalendarArtwork[]>(
  data.preferences.imagesAllowed ? CALENDAR_ARTWORK : ['logo'],
);

/* ---------- filters ---------- */

const tags = $derived(filterTags(data.filters));
const tiles = $derived(watchNowTiles({
  watchnow: data.filters.watchnow,
  sources: data.filterSources ?? new Map(),
  country: data.watchNowCountry,
  favorites: data.watchNowFavorites,
}));
const chips = $derived<FilterTag[]>([
  ...tiles.map((tile) => ({
    id: `watchnow-${tile.id}`,
    text: tile.kind === 'bundle' ? tile.name : tile.source.name,
    without: false,
  })),
  ...tags,
]);
const filterCount = $derived(chips.length);
let panelOpen = $state(false);
let funnel = $state<HTMLButtonElement>();
const panelId = $props.id();

function search(filters: AdvancedFilters) {
  const query = advancedFiltersSearch(filters);
  return `${page.url.pathname}${query ? `?${query}` : ''}`;
}
// The panel filters as you go, so the history keeps one entry per visit, not one per click.
function applyFilters(filters: AdvancedFilters) {
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and month, new filters
  goto(search(filters), { noScroll: true, keepFocus: true, replaceState: true });
}
function closePanel() {
  panelOpen = false;
  funnel?.focus();
}
function removeChip(id: string) {
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and month, new filters
  goto(search(withoutFilterTag(data.filters, id)), { noScroll: true, keepFocus: true });
}

// OG's calendars leave out the partial options.
const options = fadeHideOptions.filter((option) => !('showsOnly' in option));
let fadeHide = $derived<FadeHide>(data.fadeHide);

/* ---------- cards ---------- */

const clock = $derived({ ...data.datePreferences, imageType: display.artwork });
const shown = $derived(
  visibleCalendarDays({ days: data.days, isHidden: (type, id) => overlay.isHidden('calendar', type, id) }),
);

type Match = (typeof options)[number]['id'];
function itemState(item: CalendarItem) {
  const card = toCalendarCard(item, clock);
  const state = overlay.state(card.overlay.type, card.overlay.id, card.collectionContext);
  const fill = quickIconFill({ state, datePreferences: data.datePreferences });
  const filterState = calendarFilterState(state, card.show ? overlay.state('show', card.show) : undefined);
  return { card, state, fill, matches: (id: Match) => matchesFadeHide(id, filterState, fill) };
}

// A group fades or hides only when every episode in it would.
function toEntries(group: CalendarGroup): CalendarEntry[] {
  const items = group.items.map(itemState);
  if (fadeHide.hide.some((id) => items.every(({ matches }) => matches(id)))) return [];
  const faded = fadeHide.fade.some((id) => items.every(({ matches }) => matches(id)));
  const label = groupLabel({ group, days: data.days });
  const grouped = label ? toCalendarGroupCard({ group, label, clock }) : undefined;
  if (grouped) {
    const state = episodeBatchState(items.map(({ state }) => state));
    return [{ ...grouped, state, fill: quickIconFill({ state, airedEpisodes: items.length }), faded }];
  }
  const first = items.at(0);
  return first ? [{ ...first.card, state: first.state, fill: first.fill, faded }] : [];
}

const days = $derived(
  shown.map((day) => ({
    date: day.date,
    entries: groupCalendarItems(day.items, display.episodes === 'grouped').flatMap(toEntries),
  })),
);

function cardIcons(entry: CalendarEntry): Omit<ComponentProps<typeof QuickIcons>, 'small'> {
  if ('group' in entry) {
    const { group } = entry;
    const show = { type: 'show' as const, id: group.show.id, title: group.show.title };
    const batch = {
      type: 'season' as const,
      id: entry.overlay.id,
      title: `${group.show.title} ${entry.number ?? ''}`.trim(),
      season: { show: group.show.id, number: group.season },
      airedEpisodes: group.episodes.length,
      onlyEpisodeIds: group.episodes.map(({ id }) => id),
      released: entry.released,
    };
    return {
      watchTarget: batch,
      collectionTarget: batch,
      listTarget: show,
      ratingTarget: show,
      fill: entry.fill,
      rating: entry.rating,
      released: entry.released,
      watchNow: 'play',
      hide: 'show',
      hideTarget: entry.hideTarget,
      hideSection: 'calendar',
    };
  }
  return {
    collectionTarget: { ...entry.overlay, title: entry.title, season: entry.collectionContext },
    listTarget: { ...entry.overlay, title: entry.title },
    fill: entry.fill,
    rating: entry.rating,
    released: entry.released,
    ratingTarget: { ...entry.overlay, title: entry.title },
    listLabel: entry.episode ? 'Add to list' : undefined,
    watchNow: entry.episode || display.artwork === 'none' ? 'play' : undefined,
    hide: entry.episode ? 'show' : undefined,
    hideTarget: entry.hideTarget,
    hideSection: 'calendar',
  };
}

/* ---------- counts ---------- */

const kind = $derived(
  data.calendar.slug === 'shows-movies' ? 'both' : data.calendar.itemType === 'movies' ? 'movies' : 'shows',
);
const entries = $derived(days.flatMap((day) => day.entries));
const episodeCount = $derived(
  entries.reduce((sum, entry) => sum + ('group' in entry ? entry.group.episodes.length : entry.episode ? 1 : 0), 0),
);
const movieCount = $derived(entries.filter((entry) => !('group' in entry) && !entry.episode).length);
const heat = $derived(new Map(days.map((day) => [day.date, day.entries.length])));

/* ---------- paging and the calendar picker ---------- */

const month = $derived(data.window.start.slice(0, 7));
const base = { all: '/calendars', my: '/calendars/my' } as const;
const href = (target: 'all' | 'my', slug: string, start?: string) =>
  `${base[target]}/${slug}${start ? `/${start}` : ''}${page.url.search}`;
const monthName = (iso: string, style: 'long' | 'short' = 'long') =>
  new Intl.DateTimeFormat('en-US', { month: style, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const monthLabel = $derived(`${monthName(data.window.start)} ${data.window.start.slice(0, 4)}`);
const nearby = $derived(nearbyMonths({ month: data.window.start, before: 6, after: 6 }));
const years = $derived(
  [...new Set(nearby.map((start) => start.slice(0, 4)))].map((year) => ({
    year,
    months: nearby.filter((start) => start.startsWith(year)).map((start) => ({
      label: monthName(start),
      href: href(data.target, data.calendar.slug, start),
      current: start === data.window.start,
      note: start.slice(0, 7) === data.today.slice(0, 7) ? 'this month' : undefined,
    })),
  })),
);
const todayLabel = $derived(`${monthName(data.today, 'short')} ${Number(data.today.slice(8))}`);
const pickerLinks = (target: 'all' | 'my', calendars: readonly { slug: string; label: string }[]) =>
  calendars.map(({ slug, label }) => ({
    label,
    href: href(target, slug, data.window.start),
    current: target === data.target && slug === data.calendar.slug,
  }));

/* ---------- following the scroll ---------- */

let firstVisible = $state<string>();
function followScroll(node: HTMLElement) {
  let frame = 0;
  const update = () => {
    frame = 0;
    const style = getComputedStyle(node);
    const header = parseFloat(style.getPropertyValue('--header-height')) || 0;
    const weekdays = display.view === 'month'
      ? parseFloat(style.getPropertyValue('--calendar-weekdays-height')) || 0
      : 0;
    const first = [...node.querySelectorAll<HTMLElement>('[data-day]')]
      .find((day) => day.getBoundingClientRect().bottom > header + weekdays + 40);
    firstVisible = first?.dataset.day;
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
  };
}
function jump(date: string) {
  document.getElementById(`day-${date}`)?.scrollIntoView({
    block: 'start',
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
const weekStarts = $derived(
  days.filter((day, i) => i === 0 || new Date(`${day.date}T00:00:00Z`).getUTCDay() === weekStart).map(({ date }) =>
    date
  ),
);
const weeks = $derived(
  weekStarts.map((start, i) => {
    const end = weekStarts.at(i + 1) ?? '9999-12-31';
    const count = days.filter((day) => day.date >= start && day.date < end).reduce(
      (sum, day) => sum + day.entries.length,
      0,
    );
    return { start, count, label: `${monthName(start, 'short')} ${Number(start.slice(8))}` };
  }),
);
const markedWeek = $derived(firstVisible ? weekStarts.findLast((start) => start <= (firstVisible ?? '')) : undefined);

const title = $derived(`${data.target === 'my' ? 'My ' : ''}${data.calendar.label} Calendar · ${monthLabel}`);
</script>

<svelte:head>
  <title>{title} - Trakt</title>
  <meta
    name="description"
    content="{episodeCount} episodes and {movieCount} movies on the {data.calendar.label} calendar in {monthLabel}."
  />
</svelte:head>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  <FadeHideMenu value={fadeHide} {options} cookie="calendars" variant="default"
  onchange={(next) => (fadeHide = next)} />
  <AdvancedFiltersToggle bind:open={panelOpen} bind:button={funnel} controls="{panelId}-filters" regular
  active={filterCount > 0} count={vip ? filterCount : 0} />
{/snippet}

<SidebarFrame label="Calendar" collapsed={data.sidebar.collapsed} {panelOpen}>
  {#snippet sidebar()}
    <div class="title-row">
      <h1>
        <Dropdown variant="title" label="Pick a calendar">
          {#snippet trigger()}<span class="eyebrow">{data.target === 'my' ? 'My' : 'All'}</span><span class="name"
            >{data.calendar.label}</span>{/snippet}
          {#if data.user}
            <ul>
              <li class="header">My</li>
              {#each pickerLinks('my', MY_CALENDARS) as link (link.href)}
                <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
              {/each}
            </ul>
            <hr />
          {/if}
          <ul>
            <li class="header">All</li>
            {#each pickerLinks('all', PUBLIC_CALENDARS) as link (link.href)}
              <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
            {/each}
          </ul>
        </Dropdown>
      </h1>
      <div class="tools">{@render tools()}</div>
    </div>

    <div class="counts">
      {#if kind !== 'movies'}
        <CountPill count={episodeCount} total={data.totals?.episodes} label="episodes" one="episode" />
      {/if}
      {#if kind !== 'shows'}
        <CountPill count={movieCount} total={data.totals?.movies} label="movies" one="movie" />
      {/if}
    </div>

    <div class="month">
      <MonthPager label={monthLabel} prevHref={href(data.target, data.calendar.slug, data.window.previous)}
        nextHref={href(data.target, data.calendar.slug, data.window.next)}
        todayHref={href(data.target, data.calendar.slug)} {todayLabel} {years} />
      <MiniMonth {month} counts={heat} today={data.today} marked={firstVisible} {weekStart} onpick={jump} />
      {#if month !== data.today.slice(0, 7)}
        <a class="back" href={href(data.target, data.calendar.slug)}><Icon svg={angleLeft} /> Back to today</a>
      {/if}
    </div>

    {#if filterCount > 0}
      <SidebarSection id="filters" title="Applied Filters" open={data.sidebar.filters} remember>
        {#snippet action()}<a class="clear" href={page.url.pathname}>Clear all</a>{/snippet}
        <FilterChips {chips} onremove={removeChip} disabled={!vip} />
      </SidebarSection>
    {/if}

    <SidebarSection id="display" title="Display" open={data.sidebar.display} remember>
      <IconSwitch label="View" value={display.view} options={views} onchange={(view) => setDisplay({ view })} />
      <Dropdown block section="Artwork">
        {#snippet trigger()}{artworkLabels[display.artwork]}{/snippet}
        <ul>
          {#each artworkChoices as artwork (artwork)}
            <li>
              <button type="button" aria-current={display.artwork === artwork} onclick={() => setDisplay({ artwork })}
              >{artworkLabels[artwork]}</button>
            </li>
          {/each}
        </ul>
      </Dropdown>
      <Dropdown block section="Episodes">
        {#snippet trigger()}{display.episodes === 'grouped' ? 'Grouped' : 'Every episode'}{/snippet}
        <ul>
          <li>
            <button type="button" aria-current={display.episodes === 'grouped'}
              onclick={() => setDisplay({ episodes: 'grouped' })}>Grouped</button>
          </li>
          <li>
            <button type="button" aria-current={display.episodes === 'each'}
              onclick={() => setDisplay({ episodes: 'each' })}>Every episode</button>
          </li>
        </ul>
      </Dropdown>
    </SidebarSection>

    <SidebarSection id="feed" title="iCal Feed" open={data.sidebar.feed} remember>
      <CalendarFeed url={data.target === 'my' ? data.feedUrls[data.calendar.slug] ?? null : null} {vip}
        mine={data.target === 'my'} />
    </SidebarSection>
  {/snippet}

  {#snippet rail()}
    <div class="rail-group">
      <a class="today" href={href(data.target, data.calendar.slug)} title="Today, {todayLabel}">
        <small>{monthName(data.today, 'short')}</small><b>{Number(data.today.slice(8))}</b>
      </a>
      <div class="rail-month">
        <a href={href(data.target, data.calendar.slug, data.window.previous)} rel="prev"><Icon svg={angleLeft}
            label="Previous month" /></a>
        <span>{monthName(data.window.start, 'short')}</span>
        <a href={href(data.target, data.calendar.slug, data.window.next)} rel="next"><Icon svg={angleRight}
            label="Next month" /></a>
      </div>
    </div>
    <div class="rail-group">{@render tools()}</div>
    <div class="rail-group">
      {#each views as view (view.value)}
        <button type="button" class="rail-view" aria-pressed={display.view === view.value} title="{view.label} view"
          onclick={() => setDisplay({ view: view.value })}><Icon svg={view.icon} label="{view.label} view" /></button>
      {/each}
    </div>
    <div class="rail-group"><WeekBars {weeks} marked={markedWeek} onpick={jump} /></div>
  {/snippet}

  {#snippet panel()}
    <FiltersPanel id="{panelId}-filters" open={panelOpen} config={data.filterConfig} filters={data.filters} {vip}
      country={data.watchNowCountry} favorites={data.watchNowFavorites} sources={data.filterSources}
      onchange={applyFilters} onclose={closePanel} />
  {/snippet}

  <div class="calendar" {@attach followScroll}>
    {#if display.view === 'month'}
      <CalendarMonth {month} {days} today={data.today} artwork={display.artwork} {weekStart} {cardIcons} />
    {:else}
      <CalendarList {days} today={data.today} artwork={display.artwork} autoscroll={data.preferences.autoscroll}
        {cardIcons} />
    {/if}
  </div>
</SidebarFrame>

<style>
.title-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-base-block);

  & h1 {
    flex: 1;
    min-inline-size: 0;
    margin: 0;
    font-size: inherit;
  }
}

.tools {
  display: flex;
  flex: none;
  gap: var(--space-tools);
  margin-block-end: -4px;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-base-block);
}

.month {
  display: grid;
  gap: var(--space-lg-block);
}

.back,
.clear {
  justify-self: start;
  color: var(--color-sidebar-pill-text);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-menu-header);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-frame-text);
  }
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
}

.clear {
  padding: 3px var(--space-base-block);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
  }
}

/* The collapsed rail: today, the month, the tools, the views and the weeks, in spaced groups. */
.rail-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-base-block);
  inline-size: 100%;
  padding-block: var(--space-base-inline);
  border-block-start: 1px solid var(--color-sidebar-rule);
}

.today {
  display: grid;
  justify-items: center;
  inline-size: var(--rail-today-width);
  padding: 4px 0 5px;
  border-radius: var(--radius-control);
  background-color: var(--color-mini-month-cell);
  color: var(--color-frame-text);
  line-height: 1.05;
  text-decoration: none;

  & small {
    color: var(--brand-primary);
    font-size: var(--font-size-mini-month-weekday);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;
  }

  & b {
    font-size: var(--font-size-icon-lg);
  }

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
  }
}

.rail-month {
  display: flex;
  align-items: center;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;

  & a {
    padding: 4px 3px;
    color: var(--color-sidebar-label);

    &:is(:hover, :focus-visible) {
      color: var(--color-frame-text);
    }
  }
}

.rail-view {
  display: grid;
  place-items: center;
  inline-size: var(--tool-size);
  block-size: var(--control-height-small);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-sidebar-pill-text);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
    color: var(--color-frame-text);
  }

  &[aria-pressed='true'] {
    background-color: var(--color-control-raised-bg);
    color: var(--color-frame-text);
  }
}
</style>
