<!--
  One chart page in a SidebarFrame, like the calendar's. The sidebar holds every control: the chart picker (Shows or
  Movies over the chart's name) with the fade/hide and filter tools, the counts, the under-title, the page pager, the
  period and the applied filters. The content is the chart. Page 1 opens with larger cards, each ranked: on trending
  #1 as an edge-to-edge hero and #2 and #3 as large framed cards with their logos, on the other charts #1 and #2 as
  those large cards. Then every page is a grid of framed fanart cards.
  `/shows/[chart]` and `/movies/[chart]` render it; Box Office has its own page.
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
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import NoData from '$lib/components/empty/NoData.svelte';
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
import ChartPicker from '$lib/charts/ChartPicker.svelte';
import FollowingWatchingSection from '$lib/charts/FollowingWatchingSection.svelte';
import LiveNowSection from '$lib/charts/LiveNowSection.svelte';
import { chartPeriodText } from '$lib/charts/chartPeriod';
import ChartHero from '$lib/charts/ChartHero.svelte';
import ChartRank from '$lib/charts/ChartRank.svelte';
import type { ChartCard } from '$lib/charts/toChartCard';
import { proxiedLogoUrl } from '$lib/utils/proxiedLogoUrl';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { loadChart } from '$lib/charts/loadChart';

type Props = {
  data: Awaited<ReturnType<typeof loadChart>> & {
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
  {
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

// Recommendations have no eye menu.
const menu = $derived(data.chart !== 'recommendations');
const options = $derived(fadeHideOptions.filter((option) => data.type === 'shows' || !('showsOnly' in option)));
let fadeHide = $derived<FadeHide>(data.fadeHide);

// The cards the hide menu leaves, each with its place in the chart, its quick icons and whether it's faded.
type Entry = {
  card: ChartCard;
  rank: number;
  icons: ReturnType<typeof mediaQuickIcons> & { favorite: true };
  faded: boolean;
  rating?: number | null;
  dropped?: boolean;
};
const entries = $derived(
  data.cards.flatMap((card, i): Entry[] => {
    const state = overlay.state(card.type, card.id);
    const icons = {
      ...mediaQuickIcons({ item: card, state, datePreferences: data.datePreferences }),
      favorite: true as const,
    };
    const matches = (id: FadeHideOption) => matchesFadeHide(id, state, icons.fill);
    if (menu && fadeHide.hide.some(matches)) return [];
    const faded = menu && fadeHide.fade.some(matches);
    return [{ card, rank: i + 1, icons, faded, rating: state.rating, dropped: state.dropped }];
  }),
);
// Page 1 opens with larger cards: trending's hero and the pair after it, or the pair alone.
const opening = $derived(data.page.current === 1);
const withHero = $derived(opening && data.chart === 'trending');
const hero = $derived(withHero ? entries.at(0) : undefined);
const pairStart = $derived(withHero ? 1 : 0);
const pair = $derived(opening ? entries.slice(pairStart, pairStart + 2) : []);
const grid = $derived(opening ? entries.slice(pairStart + 2) : entries);

function save(next: FadeHide) {
  const reload = apiHideOptions.some((id) => fadeHide.hide.includes(id) !== next.hide.includes(id));
  fadeHide = next;
  // The loader asks the API to drop these, so the page comes back full instead of short.
  if (reload) invalidateAll();
}

// The advanced filters.
const vip = $derived(data.user?.isVip ?? false);
const advanced = $derived.by(() => {
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
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and period, new filters
  goto(search(withoutFilterTag(data.filters, id)), { noScroll: true, keepFocus: true });
}

// The period charts' Time Period, which OG kept in the filter panel: the same chart and filters on the first page.
const periodHref = (period: string) =>
  `/${data.type}/${data.chart}/${period}${pageHref(page.url, 1).slice(page.url.pathname.length)}`;
const period = $derived(advanced.config.period);
</script>

<svelte:head>
  <title>{meta.title} - Trakt</title>
  <meta name="description" content={meta.description} />
</svelte:head>

{#snippet filtersPanel()}
  <FiltersPanel id="{panelId}-filters" open={panelOpen} config={advanced.config} filters={data.filters} {vip}
  country={data.watchNowCountry} favorites={data.watchNowFavorites} sources={data.filterSources}
  onchange={applyFilters} onclose={closePanel} />
{/snippet}

<!-- The picker's hrefs come built by chartLinks, query included, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  {#if menu}
    <FadeHideMenu value={fadeHide} {options} cookie={data.type} variant="default" onchange={save} />
  {/if}
  <AdvancedFiltersToggle bind:open={panelOpen} bind:button={funnel} controls="{panelId}-filters" regular
  active={advanced.count > 0} count={vip ? advanced.count : 0} />
{/snippet}

{#snippet fanart(entry: Entry, large = false)}
  <FanartCard framed href={entry.card.href} title={entry.card.title} year={entry.card.year}
  image={large ? (entry.card.fanart ?? entry.card.image) : entry.card.image}
  titleLogo={large ? proxiedLogoUrl(entry.card.logo) : undefined} tags={entry.card.tags} userRating={entry.rating}
  dropped={entry.dropped} faded={entry.faded} icons={entry.icons}>
    {#snippet fanartOverlay()}
      {#if large}<span class="rank"><ChartRank rank={entry.rank} live={data.chart === 'trending'} /></span>{/if}
    {/snippet}
  </FanartCard>
{/snippet}

<SidebarFrame label="{title} charts" collapsed={data.sidebar.collapsed} {prevHref} {nextHref}
  panel={filtersPanel} {panelOpen}>
  {#snippet sidebar()}
    <SidebarTitle {tools}>
      {#snippet heading()}
        <ChartPicker type={data.type} chart={data.chart} period={data.period} signedIn={data.user !== null} />
      {/snippet}
    </SidebarTitle>

    <div class="counts">
      {#if data.chart === 'recommendations'}
        <CountPill count={data.cards.length} label={data.type} one={noun} />
      {:else}
        {#if data.chart === 'trending'}
          <!-- The API's own count only sums the page's rows; Live now reads the whole chart. -->
          <CountPill count={data.live?.[data.type] ?? data.watcherCount} label="watchers" one="watcher" />
        {/if}
        <CountPill count={data.itemCount} total={data.totalCount} label={data.type} one={noun} />
      {/if}
    </div>

    <!-- Trending's under-title was its counts, which the pills now carry. -->
    {#if data.chart !== 'trending'}
      <p class="subtitle">
        {#if data.chart === 'popular'}
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

    {#if advanced.count > 0}
      <AppliedFiltersSection chips={advanced.chips} open={data.sidebar.filters} {vip} clearHref={page.url.pathname}
        onremove={removeChip} />
    {/if}

    {#if data.live}
      <LiveNowSection live={data.live} type={data.type} open={data.sidebar.live} />
    {/if}
    {#if data.chart === 'trending' && data.user}
      <FollowingWatchingSection type={data.type} open={data.sidebar.following} datePreferences={data.datePreferences} />
    {/if}
  {/snippet}

  {#snippet rail()}
    {#if data.page.type === 'paginated' && data.page.total > 1}
      <RailGroup><RailPager unit="page" label="P{data.page.current}" {prevHref} {nextHref} /></RailGroup>
    {/if}
    <RailGroup tools>{@render tools()}</RailGroup>
  {/snippet}

  {#if data.failed}
    <div class="no-results">
      <NoData inFrame>Recommendations didn't load. Refresh the page to try again.</NoData>
    </div>
  {:else if entries.length > 0}
    {#if hero}
      <ChartHero card={hero.card} rank={hero.rank} live={data.chart === 'trending'} icons={hero.icons} />
    {/if}
    {#if pair.length > 0}
      <div class="pair-frame">
        <div class="pair">
          {#each pair as entry (entry.card.id)}{@render fanart(entry, true)}{/each}
        </div>
      </div>
    {/if}
    {#if grid.length > 0}
      <FrameGrid variant="framed">
        {#each grid as entry (entry.card.id)}{@render fanart(entry)}{/each}
      </FrameGrid>
    {/if}
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
    color: var(--color-frame-ink);
  }
}

.pair-frame {
  container-type: inline-size;
}

/* Two a row where the grid has two or more, with its gutter, and none under them: the grid's own starts the next row. */
.pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--chart-pair-gap);
  padding: var(--gutter) var(--gutter) 0;
}

@container (width >= 560px) {
  .pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.rank {
  position: absolute;
  inset-block-start: var(--chart-rank-inset);
  inset-inline-start: var(--chart-rank-inset);
}

/* OG centred the droids in the frame from 1025px up. */
.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
