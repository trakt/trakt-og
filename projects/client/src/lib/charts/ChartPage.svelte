<!--
  One chart page in a SidebarFrame, like the calendar's: the chart picker (Shows or Movies over the chart's name) with
  the fade/hide and filter tools, the counts, the under-title and the applied filters in the sidebar, then the flush
  fanart grid and the bottom pagination. `/shows/[chart]`, `/movies/[chart]` and `/movies/boxoffice` render it.
-->
<script lang="ts">
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import AdvancedFiltersPanel from '$lib/components/filters/AdvancedFiltersPanel.svelte';
import AdvancedFiltersToggle from '$lib/components/filters/AdvancedFiltersToggle.svelte';
import AppliedFilters from '$lib/components/filters/AppliedFilters.svelte';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import { type AdvancedFilters, advancedFiltersSearch } from '$lib/components/filters/advancedFilters';
import { fromFilterDraft, toFilterDraft } from '$lib/components/filters/filterDraft';
import { filterTags } from '$lib/components/filters/filterTags';
import { watchNowTiles } from '$lib/components/filters/watchNowFilter';
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
import PageNav from '$lib/components/pagination/PageNav.svelte';
import { pageHref } from '$lib/components/pagination/pageWindow';
import CountPill from '$lib/components/sidebar/CountPill.svelte';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarTitle from '$lib/components/sidebar/SidebarTitle.svelte';
import { overlay } from '$lib/overlay/overlay';
import { chartFilters } from '$lib/charts/chartFilters';
import { chartLinks } from '$lib/charts/chartLinks';
import { type ChartName, isPeriodChart } from '$lib/charts/chartNames';
import { chartPeriodText } from '$lib/charts/chartPeriod';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { loadBoxOffice } from '$lib/charts/loadBoxOffice';
import type { loadChart, MediaType } from '$lib/charts/loadChart';

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
  const tags = filterTags(filters);
  const tiles = watchNowTiles({
    watchnow: filters.watchnow,
    sources: data.filterSources ?? new Map(),
    country: data.watchNowCountry,
    favorites: data.watchNowFavorites,
  });
  return { config, filters, tags, tiles, count: tags.length + tiles.length };
});
let panelOpen = $state(false);
let funnel = $state<HTMLButtonElement>();
const panelId = $props.id();

function closePanel() {
  panelOpen = false;
  funnel?.focus();
}

function applyFilters(filters: AdvancedFilters, period: string | undefined) {
  if (!('filters' in data)) return;
  const search = advancedFiltersSearch(filters);
  const path = period && isPeriodChart(data.chart)
    ? `/${data.type}/${data.chart}/${period}`
    : `/${data.type}/${data.chart}`;
  panelOpen = false;
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- a chart path built from the page's own params
  goto(search ? `${path}?${search}` : path);
}

// The picker lists both types' charts, Shows then Movies, so the title switches either way.
const pickerLinks = (type: MediaType) =>
  chartLinks({
    type,
    current: type === data.type ? data.chart : '',
    period: data.period,
    search: page.url.searchParams,
    signedIn: data.user !== null,
  });
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
    <AdvancedFiltersPanel
  id="{panelId}-filters"
  open={panelOpen}
  config={advanced.config}
  filters={data.filters}
  {vip}
  country={data.watchNowCountry}
  favorites={data.watchNowFavorites}
  sources={data.filterSources}
  clearHref={page.url.pathname}
  onapply={applyFilters}
  onclose={closePanel}
/>
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

<SidebarFrame label="{title} charts" collapsed={data.sidebarCollapsed} {prevHref} {nextHref}
  panel={advanced ? filtersPanel : undefined} {panelOpen}>
  {#snippet sidebar()}
    <SidebarTitle tools={menu || advanced ? tools : undefined}>
      {#snippet heading()}
        <Dropdown variant="title" label="Pick a chart">
          {#snippet trigger()}<span class="eyebrow">{title}</span><span class="name">{CHART_NAMES[data.chart]}</span
            >{/snippet}
          {#each ['shows', 'movies'] as const as type, i (type)}
            {#if i > 0}<hr />{/if}
            <ul>
              <li class="header">{type === 'shows' ? 'Shows' : 'Movies'}</li>
              {#each pickerLinks(type) as link (link.href)}
                <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
              {/each}
            </ul>
          {/each}
        </Dropdown>
      {/snippet}
    </SidebarTitle>

    <div class="counts">
      {#if data.chart === 'boxoffice' || data.chart === 'recommendations'}
        <CountPill count={data.cards.length} label={data.type} one={noun} />
      {:else}
        <CountPill count={data.itemCount} total={data.totalCount} label={data.type} one={noun} />
        {#if data.chart === 'trending'}
          <CountPill count={data.watcherCount} label="watchers" one="watcher" />
        {/if}
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

    {#if advanced && advanced.count > 0}
      <AppliedFilters tags={advanced.tags} tiles={advanced.tiles} {vip} clearHref={page.url.pathname}
        onedit={() => (panelOpen = true)} />
    {/if}
  {/snippet}

  {#snippet rail()}
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
    <div class="page-nav">
      <PageNav {prevHref} {nextHref} />
    </div>
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

.page-nav:has(:global(nav)) {
  border-block-end: 1px solid var(--color-frame-border);
}

/* OG centred the droids in the frame from 1025px up. */
.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
