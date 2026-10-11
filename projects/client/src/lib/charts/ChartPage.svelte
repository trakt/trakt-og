<!--
  One chart page in a SidebarFrame, like the calendar's. The sidebar holds every control: the chart picker (Shows or
  Movies over the chart's name) with the fade/hide and filter tools, the counts, the under-title, the page pager, the
  period and the applied filters. The content is only the flush fanart grid. `/shows/[chart]`, `/movies/[chart]` and
  `/movies/boxoffice` render it.
-->
<script lang="ts">
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import AdvancedFiltersToggle from '$lib/components/filters/AdvancedFiltersToggle.svelte';
import AppliedFiltersSection from '$lib/components/filters/AppliedFiltersSection.svelte';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import FiltersPanel from '$lib/components/filters/FiltersPanel.svelte';
import { type AdvancedFilters, advancedFiltersSearch } from '$lib/components/filters/advancedFilters';
import { filterChips } from '$lib/components/filters/filterChips';
import { fromFilterDraft, toFilterDraft } from '$lib/components/filters/filterDraft';
import { withoutFilterTag } from '$lib/components/filters/withoutFilterTag';
import {
  apiHideOptions,
  type FadeHide,
  type FadeHideOption,
  fadeHideOptions,
  matchesFadeHide,
} from '$lib/components/filters/fadeHide';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FrameGrid from '$lib/components/frame/FrameGrid.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import NoResults from '$lib/components/empty/NoResults.svelte';
import { pageHref } from '$lib/components/pagination/pageWindow';
import CountPill from '$lib/components/sidebar/CountPill.svelte';
import PagePager from '$lib/components/sidebar/PagePager.svelte';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import RailPager from '$lib/components/sidebar/RailPager.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarTitle from '$lib/components/sidebar/SidebarTitle.svelte';
import { overlay } from '$lib/overlay/overlay';
import { chartFilters } from '$lib/charts/chartFilters';
import { chartLinks } from '$lib/charts/chartLinks';
import type { ChartName } from '$lib/charts/chartNames';
import { chartPeriodText } from '$lib/charts/chartPeriod';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { loadBoxOffice } from '$lib/charts/loadBoxOffice';
import type { loadChart } from '$lib/charts/loadChart';

type Props = {
  data: Awaited<ReturnType<typeof loadChart> | ReturnType<typeof loadBoxOffice>> & {
    user: HeaderUser | null;
    datePreferences: DatePreferences;
  };
};

const { data }: Props = $props();

const noun = $derived(data.type === 'shows' ? 'show' : 'movie');
const title = $derived(data.type === 'shows' ? 'Shows' : 'Movies');
const periodText = $derived(chartPeriodText(data.period));

// The `meta(...)` call in each action.
const meta = $derived(
  data.chart === 'boxoffice' ? { title: 'Weekend Box Office', description: data.description } : {
    trending: {
      title: `Trending ${data.type}`,
      description: `All ${data.type} the Trakt community has watched recently!`,
    },
    popular: { title: `Popular ${data.type}`, description: `Popular ${data.type} as voted by the Trakt community.` },
    anticipated: {
      title: `Anticipated ${data.type}`,
      description: `Most anticipated ${data.type} in the Trakt community.`,
    },
    favorited: {
      title: `Most favorited ${data.type} for ${periodText}`,
      description: `The most favorited ${data.type} for ${periodText} by the Trakt community.`,
    },
    watched: {
      title: `Most watched ${data.type} for ${periodText}`,
      description: `Most watched ${data.type} for ${periodText} by the Trakt community.`,
    },
    played: {
      title: `Most played ${data.type} for ${periodText}`,
      description: `The most played ${data.type} for ${periodText} by the Trakt community.`,
    },
    library: {
      title: `${title} added to libraries for ${periodText}`,
      description: `${title} added to libraries for ${periodText} by the Trakt community.`,
    },
    recommendations: {
      title: `Recommended ${data.type}`,
      description: `Your personalized ${noun} recommendations.`,
    },
  }[data.chart],
);

const prevHref = $derived(data.page.current > 1 ? pageHref(page.url, data.page.current - 1) : undefined);
const nextHref = $derived(
  data.page.type === 'paginated' && data.page.current < data.page.total
    ? pageHref(page.url, data.page.current + 1)
    : undefined,
);

// Box office and recommendations have no eye menu.
const menu = $derived('fadeHide' in data && data.chart !== 'recommendations');
const options = $derived(fadeHideOptions.filter((option) => data.type === 'shows' || !('showsOnly' in option)));
let fadeHide = $derived<FadeHide>('fadeHide' in data ? data.fadeHide : { fade: [], hide: [] });

function save(next: FadeHide) {
  const reload = apiHideOptions.some((id) => fadeHide.hide.includes(id) !== next.hide.includes(id));
  fadeHide = next;
  // The loader asks the API to drop these, so the page comes back full instead of short.
  if (reload) invalidateAll();
}

// The advanced filters. Box office has none.
const vip = $derived(data.user?.isVip ?? false);
const advanced = $derived.by(() => {
  if (!('filters' in data)) return null;
  const config = chartFilters({ type: data.type, chart: data.chart, period: data.period, now: new Date() });
  // Only what this chart's panel offers counts, and a range at its ends is no filter.
  const filters = fromFilterDraft(toFilterDraft(data.filters, config), config);
  const chips = filterChips({
    filters,
    sources: data.filterSources ?? new Map(),
    country: data.watchNowCountry,
    favorites: data.watchNowFavorites,
  });
  return { config, chips, count: chips.length };
});
let panelOpen = $state(false);
let funnel = $state<HTMLButtonElement>();
const panelId = $props.id();

function closePanel() {
  panelOpen = false;
  funnel?.focus();
}

// The panel filters as you go, back on the first page, so the history keeps one entry per visit, not one per click.
function search(filters: AdvancedFilters) {
  const query = advancedFiltersSearch(filters);
  return `${page.url.pathname}${query ? `?${query}` : ''}`;
}
function applyFilters(filters: AdvancedFilters) {
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and period, new filters
  goto(search(filters), { noScroll: true, keepFocus: true, replaceState: true });
}
function removeChip(id: string) {
  if (!('filters' in data)) return;
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and period, new filters
  goto(search(withoutFilterTag(data.filters, id)), { noScroll: true, keepFocus: true });
}

// The period charts' Time Period, which OG kept in the filter panel: the same chart and filters on the first page.
const periodHref = (period: string) =>
  `/${data.type}/${data.chart}/${period}${pageHref(page.url, 1).slice(page.url.pathname.length)}`;
const period = $derived(advanced?.config.period);

const pickerLinks = $derived(
  chartLinks({
    type: data.type,
    current: data.chart,
    period: data.period,
    search: page.url.searchParams,
    signedIn: data.user !== null,
  }),
);
// Played has no link in the picker, like OG's nav, so its name comes from here.
const CHART_NAMES: Readonly<Record<ChartName | 'boxoffice', string>> = {
  trending: 'Trending',
  recommendations: 'Recommendations',
  anticipated: 'Anticipated',
  popular: 'Popular',
  favorited: 'Favorited',
  watched: 'Watched',
  played: 'Played',
  library: 'Libraries',
  boxoffice: 'Box Office',
};
</script>

<svelte:head>
  <title>{meta.title} - Trakt</title>
  <meta name="description" content={meta.description} />
</svelte:head>

{#snippet filtersPanel()}
  {#if advanced && 'filters' in data}
    <FiltersPanel id="{panelId}-filters" open={panelOpen} config={advanced.config} filters={data.filters} {vip}
  country={data.watchNowCountry} favorites={data.watchNowFavorites} sources={data.filterSources}
  onchange={applyFilters} onclose={closePanel} />
  {/if}
{/snippet}

<!-- The picker's hrefs come built by chartLinks, query included, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  {#if menu}
    <FadeHideMenu value={fadeHide} {options} cookie={data.type} variant="default" onchange={save} />
  {/if}
  {#if advanced}
    <AdvancedFiltersToggle bind:open={panelOpen} bind:button={funnel} controls="{panelId}-filters" regular
  active={advanced.count > 0} count={vip ? advanced.count : 0} />
  {/if}
{/snippet}

<SidebarFrame label="{title} charts" collapsed={data.sidebar.collapsed} {prevHref} {nextHref}
  panel={advanced ? filtersPanel : undefined} {panelOpen}>
  {#snippet sidebar()}
    <SidebarTitle tools={menu || advanced ? tools : undefined}>
      {#snippet heading()}
        <Dropdown variant="title" label="Pick a chart">
          {#snippet trigger()}<span class="eyebrow">{title}</span><span class="name">{CHART_NAMES[data.chart]}</span
            >{/snippet}
          <ul>
            {#each pickerLinks as link (link.href)}
              <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
            {/each}
          </ul>
        </Dropdown>
      {/snippet}
    </SidebarTitle>

    <div class="counts">
      {#if data.chart === 'boxoffice' || data.chart === 'recommendations'}
        <CountPill count={data.cards.length} label={data.type} one={noun} />
      {:else}
        {#if data.chart === 'trending'}
          <CountPill count={data.watcherCount} label="watchers" one="watcher" />
        {/if}
        <CountPill count={data.itemCount} total={data.totalCount} label={data.type} one={noun} />
      {/if}
    </div>

    <!-- Trending's under-title was its counts, which the pills now carry. -->
    {#if data.chart !== 'trending'}
      <p class="subtitle">
        {#if data.chart === 'boxoffice'}
          {data.description}
        {:else if data.chart === 'popular'}
          The most popular {data.type} for <strong>all time</strong>.
        {:else if data.chart === 'recommendations'}
          Your personalized {noun} recommendations.
        {:else if data.chart === 'anticipated'}
          The most anticipated {data.type} based on the number of lists a {noun} appears on.
        {:else if data.chart === 'favorited'}
          The most favorited {data.type} for <b>{periodText}</b>.
        {:else if data.chart === 'watched'}
          The most watched {data.type} for <b>{periodText}</b>. Sorted by number of unique watchers.
        {:else if data.chart === 'played'}
          The most played {data.type} for <b>{periodText}</b>. Sorted by number of plays.
        {:else}
          {title} added to libraries for <b>{periodText}</b>. Sorted by number of owners.
        {/if}
      </p>
    {/if}

    {#if data.page.type === 'paginated' && data.page.total > 1}
      <PagePager current={data.page.current} total={data.page.total} href={(n) => pageHref(page.url, n)} />
    {/if}

    {#if period}
      <Dropdown block section="Period">
        {#snippet trigger()}{period.options.find((option) => option.value === period.value)?.label}{/snippet}
        <ul>
          {#each period.options as option (option.value)}
            <li><a href={periodHref(option.value)} aria-current={option.value === period.value ? 'page' : undefined}
              >{option.label}</a></li>
          {/each}
        </ul>
      </Dropdown>
    {/if}

    {#if advanced && advanced.count > 0 && 'filters' in data.sidebar}
      <AppliedFiltersSection chips={advanced.chips} open={data.sidebar.filters} {vip} clearHref={page.url.pathname}
        onremove={removeChip} />
    {/if}
  {/snippet}

  {#snippet rail()}
    {#if data.page.type === 'paginated' && data.page.total > 1}
      <RailGroup><RailPager unit="page" label="P{data.page.current}" {prevHref} {nextHref} /></RailGroup>
    {/if}
    {#if menu || advanced}<RailGroup tools>{@render tools()}</RailGroup>{/if}
  {/snippet}

  {#if data.cards.length > 0}
    <FrameGrid>
      {#each data.cards as card (card.id)}
        {@const state = overlay.state(card.type, card.id)}
        {@const fill = quickIconFill({ state, airedEpisodes: card.airedEpisodes, datePreferences: data.datePreferences })}
        {@const matches = (id: FadeHideOption) => matchesFadeHide(id, state, fill)}
        {#if !menu || !fadeHide.hide.some(matches)}
        <FanartCard
          href={card.href}
          title={card.title}
          year={card.year}
          image={card.image}
          tags={card.tags}
          userRating={state.rating}
          dropped={state.dropped}
          faded={menu && fadeHide.fade.some(matches)}
          icons={{
            fill,
            ratingTarget: { type: card.type, id: card.id, title: card.title },
            watchTarget: { type: card.type, id: card.id, title: card.title, airedEpisodes: card.airedEpisodes, runtime: card.runtime },
            rating: card.released ? card.rating : undefined,
            // movies/_boxoffice.html.slim is the one chart grid without the favorite action.
            favorite: data.chart !== 'boxoffice',
            // ponytail: OG showed watch now only with sources in the user's country. Until #60 brings sources, an
            // item that isn't out yet is taken to have none.
            watchNow: card.released ? 'play' : undefined,
          }}
        />
        {/if}
      {/each}
    </FrameGrid>
  {:else}
    <div class="no-results">
      <NoResults />
    </div>
  {/if}
</SidebarFrame>

<style>
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-base-block);
}

.subtitle {
  margin: 0;
  color: var(--color-sidebar-note);
  font-size: var(--font-size-control);

  & :is(b, strong) {
    color: var(--color-frame-text);
  }
}

/* OG centred the droids in the frame from 1025px up. */
.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
