<script lang="ts">
  import SeoHead from '#lib/seo/SeoHead.svelte';
  import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
  import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import CalendarFeed from '#lib/components/calendar/CalendarFeed.svelte';
  import MiniMonth from '#lib/components/calendar/MiniMonth.svelte';
  import MonthPager from '#lib/components/calendar/MonthPager.svelte';
  import { trackCalendarPeriod } from '#lib/components/calendar/trackCalendarPeriod.ts';
  import WeekBars from '#lib/components/calendar/WeekBars.svelte';
  import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
  import FiltersPanel from '#lib/components/filters/FiltersPanel.svelte';
  import AdvancedFiltersToggle from '#lib/components/filters/AdvancedFiltersToggle.svelte';
  import { type AdvancedFilters, advancedFiltersSearch } from '#lib/components/filters/advancedFilters.ts';
  import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
  import { type FadeHide, fadeHideOptions, matchesFadeHide } from '#lib/components/filters/fadeHide.ts';
  import SmartListStatus from '#lib/charts/SmartListStatus.svelte';
  import ManageConfirm from '#lib/components/comments/ManageConfirm.svelte';
  import AppliedFiltersSection from '#lib/components/filters/AppliedFiltersSection.svelte';
  import SaveFiltersDialog from '#lib/components/filters/SaveFiltersDialog.svelte';
  import SavedFiltersSection from '#lib/components/filters/SavedFiltersSection.svelte';
  import { toast } from '#lib/components/toast/toast.svelte.ts';
  import { filterChips } from '#lib/components/filters/filterChips.ts';
  import { withoutFilterTag } from '#lib/components/filters/withoutFilterTag.ts';
  import { trackFilterChanges } from '#lib/components/filters/trackFilterChanges.ts';
  import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
  import { episodeBatchState } from '#lib/components/history/episodeBatchState.ts';
  import type QuickIcons from '#lib/components/media/QuickIcons.svelte';
  import { quickIconFill } from '#lib/components/media/quickIconFill.ts';
  import CountPill from '#lib/components/sidebar/CountPill.svelte';
  import IconSwitch from '#lib/components/sidebar/IconSwitch.svelte';
  import RailGroup from '#lib/components/sidebar/RailGroup.svelte';
  import RailPager from '#lib/components/sidebar/RailPager.svelte';
  import SidebarFrame from '#lib/components/sidebar/SidebarFrame.svelte';
  import SidebarSection from '#lib/components/sidebar/SidebarSection.svelte';
  import SidebarTitle from '#lib/components/sidebar/SidebarTitle.svelte';
  import Icon from '#lib/icons/Icon.svelte';
  import calendarDays from '#lib/icons/regular/calendar-days.svg?raw';
  import deleteIcon from '#lib/icons/regular/trash-xmark.svg?raw';
  import grid from '#lib/icons/regular/grid-2.svg?raw';
  import list from '#lib/icons/regular/list.svg?raw';
  import { overlay } from '#lib/overlay/overlay.ts';
  import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
  import { type ComponentProps, onMount, tick } from 'svelte';
  import { on } from 'svelte/events';
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
  import CalendarAgenda from './CalendarAgenda.svelte';
  import CalendarList from './CalendarList.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import { type CalendarGroup, groupCalendarItems } from './groupCalendarItems.ts';
  import { groupLabel } from './groupLabel.ts';
  import type { loadCalendar } from './loadCalendar.ts';
  import { MY_CALENDARS } from './myCalendars.ts';
  import { nearbyMonths } from './nearbyMonths.ts';
  import { PUBLIC_CALENDARS } from './publicCalendars.ts';
  import {
    type SavedCalendarFilter,
    savedCalendarFilterHref,
    savedCalendarFilterLabel,
    savedCalendarFilterPath,
    readSavedCalendarFilters,
    SAVED_CALENDAR_FILTERS_KEY,
    SAVED_FILTER_PARAM,
    savedCalendarFilterId,
    withoutSavedCalendarFilter,
    withSavedCalendarFilter,
  writeSavedCalendarFilters,
  } from './savedCalendarFilters.ts';
  import { toCalendarCard } from './toCalendarCard.ts';
  import { toCalendarGroupCard } from './toCalendarGroupCard.ts';
  import { visibleCalendarDays } from './visibleCalendarDays.ts';
  import { prefersReducedMotion } from 'svelte/motion';

  type Props = { 
  data: Awaited<ReturnType<typeof loadCalendar>> & { user: HeaderUser | null; datePreferences: DatePreferences };
   };

  const { data }: Props = $props();

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekStart = $derived(Math.max(0, WEEKDAYS.indexOf(data.preferences.startDay)));

  /* ---------- display ---------- */

  let display = $derived<CalendarDisplay>(data.display);
  function setDisplay(patch: Partial<CalendarDisplay>) {
    const viewChanged = patch.view !== undefined && patch.view !== display.view;
    display = { ...display, ...patch };
    if (viewChanged) tick().then(scrollToToday);
    for (const key of Object.keys(patch) as (keyof CalendarDisplay)[]) {
      document.cookie = `${CALENDAR_DISPLAY_COOKIES[key]}=${display[key]}; path=/; samesite=lax; max-age=31536000`;
    }
  }
  const views: readonly { value: CalendarView; label: string; icon: string }[] = [
    { value: 'month', label: 'Grid', icon: calendarDays },
    { value: 'list', label: 'List', icon: grid },
  { value: 'agenda', label: 'Agenda', icon: list },
  ];
  const artworkLabels: Record<CalendarArtwork, string> = {
    logo: 'Logo',
    fanart: 'Fanart',
    screenshot: 'Still',
    poster: 'Poster',
    none: 'None',
    thumb: 'Thumb',
  banner: 'Banner',
  };

  /* ---------- filters ---------- */

  const chips = $derived(filterChips({
    filters: data.filters,
    sources: data.filterSources ?? new Map(),
    country: data.watchNowCountry,
  favorites: data.watchNowFavorites,
  }));
  const filterCount = $derived(chips.length);
  let panelOpen = $state(false);
  let funnel = $state<HTMLButtonElement>();
  const panelId = $props.id();

  // The open saved filter's id stays along, so its row stays current and changes can be saved back to it.
  function search(filters: AdvancedFilters) {
  const query = [advancedFiltersSearch(filters), current ? `${SAVED_FILTER_PARAM}=${savedCalendarFilterId(current.name)}` : '']
    .filter(Boolean)
    .join('&');
    return `${page.url.pathname}${query ? `?${query}` : ''}`;
  }
  // The panel filters as you go, so the history keeps one entry per visit, not one per click.
  function applyFilters(filters: AdvancedFilters) {
     
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and month, new filters
    goto(search(filters), { reset: false, replace: true });
  }
  function closePanel() {
    panelOpen = false;
    funnel?.focus();
  }
  function removeChip(id: string) {
    const next = withoutFilterTag(data.filters, id);
    trackFilterChanges(data.filters, next);
     
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and month, new filters
    goto(search(next), { reset: false });
  }

  /* ---------- saved filters ---------- */

  // Kept in the browser's storage: the API has nowhere for them, and smart lists can't fill from a calendar. They show
  // once the page runs, and follow saves and deletes from the viewer's other tabs.
  const storage = () => localStorage;
  let savedFilters = $state.raw<readonly SavedCalendarFilter[]>([]);
  onMount(() => {
    savedFilters = readSavedCalendarFilters(storage);
    return on(window, 'storage', ({ key }) => {
      if (key === SAVED_CALENDAR_FILTERS_KEY || key === null) savedFilters = readSavedCalendarFilters(storage);
    });
  });
  const here = $derived(savedCalendarFilterPath({ target: data.target, slug: data.calendar.slug }));
  const hereQuery = $derived(advancedFiltersSearch(data.filters));
  // The saved filter this calendar was opened from, while it's this calendar's: its filters are the starting point.
  const currentId = $derived(page.url.searchParams.get(SAVED_FILTER_PARAM));
const current = $derived(
  savedFilters.find((filter) => filter.path === here && savedCalendarFilterId(filter.name) === currentId),
);
  const changed = $derived(current !== undefined && current.query !== hereQuery);
  const savedLinks = $derived(savedFilters.map((filter) => ({
    name: filter.name,
    href: savedCalendarFilterHref(filter),
    tag: savedCalendarFilterLabel(filter.path),
    here: filter.path === here,
  current: filter === current,
  })));
  let saveOpen = $state(false);
  let saveError = $state('');

  function keep(next: readonly SavedCalendarFilter[]) {
    if (!writeSavedCalendarFilters(storage, next)) return false;
    savedFilters = next;
    return true;
  }
  function openSave() {
    saveError = '';
    saveOpen = true;
  }
  const BLOCKED = "Doh! This browser won't let us save filters. Please check it allows site data.";

  // The same month, its filters and which saved filter is open.
  function stay(query: string, filter?: SavedCalendarFilter) {
  const id = filter ? `${SAVED_FILTER_PARAM}=${savedCalendarFilterId(filter.name)}` : '';
    const search = [query, id].filter(Boolean).join('&');
    return `${page.url.pathname}${search ? `?${search}` : ''}`;
  }
  // Save, and Save as new: the dialog names it, then the calendar reopens as that saved filter.
  function saveFilters(name: string) {
    const filter = { name, path: here, query: hereQuery };
    if (!keep(withSavedCalendarFilter(savedFilters, filter))) {
      saveError = BLOCKED;
      return;
    }
    saveOpen = false;
    toast.success(`You saved ${name}.`);
     
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and filters, now saved
    goto(stay(hereQuery, filter), { reset: false, replace: true });
  }
  function saveChanges() {
    if (!current) return;
    if (!keep(withSavedCalendarFilter(savedFilters, { ...current, query: hereQuery }))) {
      toast.error(BLOCKED);
      return;
    }
    toast.success(`You saved ${current.name}.`);
  }
  // Deleting the open saved filter keeps its filters on the calendar, unsaved, so they can be saved again.
  function deleteCurrent() {
    if (!current) return;
    const { name } = current;
    if (!keep(withoutSavedCalendarFilter(savedFilters, name))) {
      toast.error("Doh! We couldn't delete this saved filter.");
      return;
    }
    toast.success(`You deleted ${name}.`);
     
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same calendar and filters, no longer saved
    goto(stay(hereQuery), { reset: false, replace: true });
  }

  // OG's calendars leave out the partial options.
  const options = fadeHideOptions.filter((option) => !('showsOnly' in option));
  let fadeHide = $derived<FadeHide>(data.fadeHide);

  /* ---------- cards ---------- */

  // Off the calendar: anything hidden from it, and any show the viewer dropped.
  const isHidden = (type: 'show' | 'movie', id: number) => overlay.isHidden('calendar', type, id) || type === 'show' && overlay.state('show', id).dropped === true;

  const clock = $derived({ ...data.datePreferences, imageType: display.artwork });
  const shown = $derived(visibleCalendarDays({ days: data.days, isHidden }));
  const cardOf = $derived(new Map(data.days.flatMap((day) => day.items.map((item) => [item, toCalendarCard(item, clock)] as const))));

  type Match = (typeof options)[number]['id'];
  function itemState(item: CalendarItem) {
    const card = cardOf.get(item) ?? toCalendarCard(item, clock);
    const state = overlay.state(card.overlay.type, card.overlay.id, card.collectionContext);
  const fill = quickIconFill({ state, runtime: card.runtime, datePreferences: data.datePreferences });
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

      return [
        {
          ...grouped,
          state,
          fill: quickIconFill({ state, airedEpisodes: items.length }),
          faded
        }
      ];
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

  // An episode's ••• drops its show; a movie has nothing to drop, so no •••.
const dropMenu = (entry: CalendarEntry) =>
  entry.hideTarget ? [{ kind: 'drop' as const, target: entry.hideTarget }] : [];
  // A month's day and a poster are short on room for full-size quick icons: Watch Now moves into the •••.
  const watchNowInMenu = $derived(display.view === 'month' || display.view !== 'agenda' && display.artwork === 'poster');

  const moreMenu = (entry: CalendarEntry) => watchNowInMenu
    ? [{ kind: 'watch-now' as const }, ...dropMenu(entry)]
    : dropMenu(entry);

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
        hideTarget: entry.hideTarget,
        hideSection: 'calendar',
      more: moreMenu(entry),
      };
    }
    return {
    watchTarget: { ...entry.overlay, title: entry.title, season: entry.collectionContext, runtime: entry.runtime },
    collectionTarget: { ...entry.overlay, title: entry.title, season: entry.collectionContext },
      listTarget: { ...entry.overlay, title: entry.title },
      fill: entry.fill,
      rating: entry.rating,
      released: entry.released,
      ratingTarget: { ...entry.overlay, title: entry.title },
      listLabel: entry.episode ? 'Add to list' : undefined,
      hideTarget: entry.hideTarget,
      hideSection: 'calendar',
      more: moreMenu(entry),
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
  const mixed = $derived(kind === 'both');
  const FEED_MODES = { both: 'media', movies: 'movie', shows: 'show' } as const;
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
  // Landing on a month that holds today, or switching its view, opens at today; filter changes stay on the same path
  // and keep their place. The server-rendered page also jumps there before its first paint, ahead of hydration.
  // The closing tag is split so it doesn't end this script block.
  function todayScript(today: string) {
    const day = JSON.stringify(`day-${today}`);
    return `<script>document.getElementById(${day})?.scrollIntoView({ block: 'start' })${'<'}/script>`;
  }
  function scrollToToday() {
    document.getElementById(`day-${data.today}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  afterNavigate(({ type, from, to, shallow }) => {
    if (shallow && type === 'goto') return;
    if (type === 'enter' || from?.url.pathname !== to?.url.pathname) scrollToToday();
  });
  function jump(date: string) {
    document.getElementById(`day-${date}`)?.scrollIntoView({
      block: 'start',
    behavior: prefersReducedMotion.current ? 'instant' : 'smooth',
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
    const count = days.filter((day) => day.date >= start && day.date < end).reduce((sum, day) => sum + day.entries.length, 0);

    return {
      start,
      count,
      label: `${monthName(start, 'short')} ${Number(start.slice(8))}`
    };
  }));

  const markedWeek = $derived(firstVisible
    ? weekStarts.findLast((start) => start <= (firstVisible ?? ''))
    : undefined);

  const feedUrl = $derived(data.target === 'my' ? data.feedUrls[data.calendar.slug] ?? null : null);
  const title = $derived(`${data.target === 'my' ? 'My ' : ''}${data.calendar.label} Calendar · ${monthLabel}`);
</script>

<!--
  The calendars (`/calendars/[calendar]/[[start]]` and `/calendars/my/[calendar]/[[start]]`): a month of one calendar in
  a SidebarFrame. The sidebar holds every control, so the content is only the month: the calendar picker with the
  fade/hide and filter tools, the counts, the month pager over a heat-map mini month that follows the scroll, the
  applied filters with their Save, the display choices, the iCal feed and the viewer's saved filters. The month shows
  as a grid of weeks, a list of days or an agenda of rows by air time, without the shows the viewer dropped, and with a
  show's episodes from one day grouped into one card when the viewer wants that.
-->

<SeoHead
  title={title}
  description="What's on the {data.calendar.label} calendar in {monthLabel}, day by day, on Trakt."
/>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  <FadeHideMenu
    value={fadeHide}
    options={options}
    cookie="calendars"
    onchange={(next) => fadeHide = next}
  />

  <AdvancedFiltersToggle
    bind:open={panelOpen}
    bind:button={funnel}
    controls="{panelId}-filters"
    active={filterCount > 0}
    count={filterCount}
  />
{/snippet}

{#if saveOpen}
  <SaveFiltersDialog
    bind:open={saveOpen}
    page={savedCalendarFilterLabel(here) ?? data.calendar.label}
    chips={chips}
    fanart={entries.at(0)?.fanart}
    error={saveError}
    onsave={saveFilters}
  />
{/if}

<SidebarFrame
  label="Calendar"
  collapsed={data.sidebar.collapsed}
  panelOpen={panelOpen}
>
  {#snippet sidebar()}
    <SidebarTitle tools={tools}>
      {#snippet heading()}
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
      {/snippet}
    </SidebarTitle>

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
        todayHref={href(data.target, data.calendar.slug)}
        todayLabel={todayLabel}
        years={years}
      />

      <MiniMonth
        month={month}
        counts={heat}
        today={data.today}
        marked={firstVisible}
        markWeek={display.view === 'month'}
        weekStart={weekStart}
        onpick={jump}
      />
    </div>

    {#if filterCount > 0 || current}
      <AppliedFiltersSection
        chips={chips}
        open={data.sidebar.filters}
        clearHref={page.url.pathname}
        onremove={removeChip}
        onsave={current ? undefined : openSave}
        saveAs="filters"
      >
        {#snippet tools()}
          {#if current}
            <ManageConfirm name="delete" svg={deleteIcon} label="Delete this saved filter" yes="Yes, delete it!"
              onconfirm={deleteCurrent}>Delete this saved filter?</ManageConfirm>
          {/if}
        {/snippet}
        {#if current}
          <SmartListStatus
            kind="filters"
            name={current.name}
            changed={changed}
            undoHref={stay(current.query, current)}
            onsavechanges={saveChanges}
            onsaveas={openSave}
          />
        {/if}
      </AppliedFiltersSection>
    {/if}

    <SidebarSection id="display" title="Display" open={data.sidebar.display} remember>
      <IconSwitch label="View" value={display.view} options={views} onchange={(view) => setDisplay({ view })} />
      <Dropdown block section="Artwork">
        {#snippet trigger()}{artworkLabels[display.artwork]}{/snippet}
        <ul>
          {#each CALENDAR_ARTWORK as artwork (artwork)}
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

    <!-- Only a VIP's own (My) calendars have a feed; the rest of the time the section isn't there. -->
    {#if feedUrl}
      <SidebarSection id="feed" title="iCal Feed" open={data.sidebar.feed} remember>
        <CalendarFeed url={feedUrl} mode={FEED_MODES[kind]} />
      </SidebarSection>
    {/if}

    <!-- Last, as on OG. -->
    {#if savedLinks.length > 0}
      <SavedFiltersSection filters={savedLinks} open={data.sidebar.saved} />
    {/if}
  {/snippet}

  {#snippet rail()}
    <RailGroup>
      <Tooltip text="Today, {todayLabel}" placement="right">
        {#snippet trigger(tooltip)}
          <a class="today" href={href(data.target, data.calendar.slug)} onclick={() => trackCalendarPeriod('reset')}
            {...tooltip}>
            <small>{monthName(data.today, 'short')}</small><b>{Number(data.today.slice(8))}</b>
          </a>
        {/snippet}
      </Tooltip>
      <RailPager unit="month" label={monthName(data.window.start, 'short')}
        prevHref={href(data.target, data.calendar.slug, data.window.previous)}
        nextHref={href(data.target, data.calendar.slug, data.window.next)} onstep={trackCalendarPeriod} />
    </RailGroup>
    <RailGroup tools>{@render tools()}</RailGroup>
    <RailGroup>
      {#each views as view (view.value)}
        <Tooltip text="{view.label} view" placement="right">
          {#snippet trigger(tooltip)}
            <button type="button" class="rail-view" aria-pressed={display.view === view.value}
              onclick={() => setDisplay({ view: view.value })} {...tooltip}><Icon svg={view.icon} label="{view.label} view"
              /></button>
          {/snippet}
        </Tooltip>
      {/each}
    </RailGroup>
    <RailGroup><WeekBars weeks={weeks} marked={markedWeek} onpick={jump} /></RailGroup>
  {/snippet}

  {#snippet panel()}
    <FiltersPanel id="{panelId}-filters" open={panelOpen} config={data.filterConfig} filters={data.filters}
      country={data.watchNowCountry} favorites={data.watchNowFavorites} sources={data.filterSources}
      onchange={applyFilters} onclose={closePanel} onsave={filterCount > 0 && !current ? openSave : undefined}
      saveAs="filters" />
  {/snippet}

  <div class="calendar" {@attach followScroll}
    {@attach trackDrilldowns({ source: data.target === 'my' ? 'calendar' : 'releases' })}>
    {#if display.view === 'month'}
      <CalendarMonth
        month={month}
        days={days}
        today={data.today}
        artwork={display.artwork}
        weekStart={weekStart}
        mixed={mixed}
        cardIcons={cardIcons}
      />
    {:else if display.view === 'agenda'}
      <CalendarAgenda
        days={days}
        today={data.today}
        artwork={display.artwork}
        mixed={mixed}
        cardIcons={cardIcons}
      />
    {:else}
      <CalendarList
        days={days}
        today={data.today}
        artwork={display.artwork}
        mixed={mixed}
        cardIcons={cardIcons}
      />
    {/if}
  </div>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- a fixed script built from an ISO date -->
  {@html todayScript(data.today)}
</SidebarFrame>

<style>
  .counts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-base-block);
  }

  .month {
    display: grid;
    gap: var(--space-lg-block);
  }

  .today {
    display: grid;
    justify-items: center;
    inline-size: var(--rail-today-width);
    padding: 4px 0 5px;
    border-radius: var(--radius-control);
    background-color: var(--color-mini-month-cell);
    color: var(--color-frame-ink);
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
      color: var(--color-frame-ink);
    }

    &[aria-pressed="true"] {
      background-color: var(--color-control-raised-bg);
      color: var(--color-frame-ink);
    }
  }
</style>
