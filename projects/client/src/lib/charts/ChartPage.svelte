<!--
  One chart page in a SidebarFrame, like the calendar's. The sidebar holds every control: the chart picker (Shows or
  Movies over the chart's name) with the fade/hide and filter tools, the counts, the under-title, the page pager, the
  period and the applied filters. The content is the chart. Page 1 opens with larger cards, each ranked: on trending
  #1 as an edge-to-edge hero and #2 and #3 as large framed cards with their logos, on the other charts #1 and #2 as
  those large cards. Then every page is a grid of framed fanart cards.
  `/shows/[chart]` and `/movies/[chart]` render it; Box Office has its own page.
-->
<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import type { ComponentProps } from 'svelte';
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import AdvancedFiltersToggle from '#lib/components/filters/AdvancedFiltersToggle.svelte';
import AppliedFiltersSection from '#lib/components/filters/AppliedFiltersSection.svelte';
import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
import { expireHideCookie } from '#lib/components/filters/expireHideCookie.ts';
import FiltersPanel from '#lib/components/filters/FiltersPanel.svelte';
import { type AdvancedFilters, advancedFiltersSearch } from '#lib/components/filters/advancedFilters.ts';
import { filterChips } from '#lib/components/filters/filterChips.ts';
import { fromFilterDraft, toFilterDraft } from '#lib/components/filters/filterDraft.ts';
import { withoutFilterTag } from '#lib/components/filters/withoutFilterTag.ts';
import { trackFilterChanges } from '#lib/components/filters/trackFilterChanges.ts';
import {
  apiHideOptions,
  type FadeHide,
  type FadeHideOption,
  fadeHideOptions,
  matchesFadeHide,
} from '#lib/components/filters/fadeHide.ts';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import FrameGrid from '#lib/components/frame/FrameGrid.svelte';
import FanartCard from '#lib/components/media/FanartCard.svelte';
import { mediaQuickIcons } from '#lib/components/media/mediaQuickIcons.ts';
import type QuickIcons from '#lib/components/media/QuickIcons.svelte';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import NoResults from '#lib/components/empty/NoResults.svelte';
import { pageHref } from '#lib/components/pagination/pageWindow.ts';
import CountPill from '#lib/components/sidebar/CountPill.svelte';
import PagePager from '#lib/components/sidebar/PagePager.svelte';
import RailGroup from '#lib/components/sidebar/RailGroup.svelte';
import RailPager from '#lib/components/sidebar/RailPager.svelte';
import SidebarFrame from '#lib/components/sidebar/SidebarFrame.svelte';
import SidebarTitle from '#lib/components/sidebar/SidebarTitle.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import { chartFilters } from '#lib/charts/chartFilters.ts';
import ChartPicker from '#lib/charts/ChartPicker.svelte';
import FollowingWatchingSection from '#lib/charts/FollowingWatchingSection.svelte';
import LiveNowSection from '#lib/charts/LiveNowSection.svelte';
import { chartPeriodText } from '#lib/charts/chartPeriod.ts';
import ChartHero from '#lib/charts/ChartHero.svelte';
import ChartRank from '#lib/charts/ChartRank.svelte';
import type { ChartCard } from '#lib/charts/toChartCard.ts';
import { proxiedLogoUrl } from '#lib/utils/proxiedLogoUrl.ts';
import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import type { loadChart } from '#lib/charts/loadChart.ts';
import SmartListsSection from '#lib/charts/SmartListsSection.svelte';
import SmartListStatus from '#lib/charts/SmartListStatus.svelte';
import { isStandardApi } from '#lib/api/isStandardApi.ts';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import { viewerFetch } from '#lib/auth/viewerFetch.ts';
import ManageConfirm from '#lib/components/comments/ManageConfirm.svelte';
import SmartListDialog from '#lib/components/lists/SmartListDialog.svelte';
import deleteIcon from '#lib/icons/regular/trash-xmark.svg?raw';
import { deleteSmartList } from '#lib/lists/smart/deleteSmartList.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import { emptyFilters } from '#lib/components/filters/advancedFilters.ts';
import { fromSmartListFilters } from '#lib/lists/smart/fromSmartListFilters.ts';
import { isSmartListChart } from '#lib/lists/smart/isSmartListChart.ts';
import { saveSmartList } from '#lib/lists/smart/saveSmartList.ts';
import { SMART_LIST_PARAM } from '#lib/lists/smart/SMART_LIST_PARAM.ts';
import type { SmartList, SmartListPrivacy } from '#lib/lists/smart/SmartList.ts';
import { uniqueBy } from '#lib/utils/uniqueBy.ts';
import { smartListChartHref } from '#lib/lists/smart/smartListChartHref.ts';
import { smartListPath } from '#lib/lists/smart/smartListPath.ts';
import { smartListSourceLabel } from '#lib/lists/smart/smartListSourceLabel.ts';
import { toSmartListFilters } from '#lib/lists/smart/toSmartListFilters.ts';
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';

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
// Web's names where it has the chart. The library chart isn't web's `library`, a member's own collection.
const CHART_SOURCES: Partial<Record<string, string>> = { recommendations: 'recommended', library: 'library-chart' };
const source = $derived(CHART_SOURCES[data.chart] ?? data.chart);

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

// Smart picks come without reasons. Only VIPs get any, and the route is Official-only.
const reasons = $derived(Boolean(data.user?.isVip) && !isStandardApi());
// Recommendations have no eye menu.
const menu = $derived(data.chart !== 'recommendations');
const options = $derived(fadeHideOptions.filter((option) => data.type === 'shows' || !('showsOnly' in option)));
let fadeHide = $derived<FadeHide>(data.fadeHide);

// The cards the hide menu leaves, each with its place in the chart, its quick icons and whether it's faded.
type Entry = {
  card: ChartCard;
  rank: number;
  icons: ReturnType<typeof mediaQuickIcons> & { favorite: true; why?: ComponentProps<typeof QuickIcons>['why'] };
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
      why: card.why && { why: card.why, type: card.type, pick: card.id, title: card.title, poster: card.poster, reasons },
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

function clearHide() {
  expireHideCookie(data.type);
  save({ ...fadeHide, hide: [] });
}

// The advanced filters.
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
  return { config, filters, chips, count: chips.length };
});
let panelOpen = $state(false);
let funnel = $state<HTMLButtonElement>();
const panelId = $props.id();

function closePanel() {
  panelOpen = false;
  funnel?.focus();
}

// The viewer's smart lists for this type, each linking to the chart that shows it or else to its own page.
const owner = $derived(data.user?.slug ?? 'me');
// What this page saved and deleted. The API's cache can answer the read right after a write with the lists from
// before it, so the page's own saves come first and stand in, and its deletes stay out, until a fresh read agrees.
let saved = $state.raw<readonly SmartList[]>([]);
let deleted = $state.raw<readonly string[]>([]);
const remember = (list: SmartList) => {
  saved = [list, ...saved.filter(({ slug }) => slug !== list.slug)];
};
const smartLists = $derived(
  uniqueBy([...saved, ...(data.smartLists ?? [])], ({ slug }) => slug)
    .filter(({ slug }) => !deleted.includes(slug))
    .filter(({ mediaType }) => mediaType === data.type || mediaType === 'media')
    .map((list) => ({ ...list, href: smartListChartHref({ list, now: new Date() }) ?? smartListPath(owner, list.slug) })),
);
// The smart list this chart was opened from, while it's this chart's: its filters are the starting point.
const currentSlug = $derived(page.url.searchParams.get(SMART_LIST_PARAM) ?? undefined);
const current = $derived(
  smartLists.find(({ slug, href }) => slug === currentSlug && href.startsWith(`${page.url.pathname}?`)),
);
const smartKey = (filters: AdvancedFilters) => JSON.stringify(toSmartListFilters(filters));
const changed = $derived(
  current !== undefined &&
    smartKey(advanced.filters) !== smartKey(fromSmartListFilters(current.filters) ?? emptyFilters),
);
// Saving needs an Official app, so a Standard app's og leaves it out.
const savable = $derived(data.user !== null && isSmartListChart(data.chart) && !isStandardApi());

// The panel filters as you go, back on the first page, so the history keeps one entry per visit, not one per click.
// The open smart list's slug stays along, so its row stays current and changes can be saved back to it.
function search(filters: AdvancedFilters) {
  const query = [advancedFiltersSearch(filters), current ? `${SMART_LIST_PARAM}=${encodeURIComponent(current.slug)}` : '']
    .filter(Boolean)
    .join('&');
  return `${page.url.pathname}${query ? `?${query}` : ''}`;
}
function applyFilters(filters: AdvancedFilters) {
   
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and period, new filters
  goto(search(filters), { reset: false, replace: true });
}
function removeChip(id: string) {
  const next = withoutFilterTag(data.filters, id);
  trackFilterChanges(data.filters, next);
   
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and period, new filters
  goto(search(next), { reset: false });
}

// The period charts' Time Period, which OG kept in the filter panel: the same chart and filters on the first page.
const periodHref = (period: string) =>
  `/${data.type}/${data.chart}/${period}${pageHref(page.url, 1).slice(page.url.pathname.length)}`;
const period = $derived(advanced.config.period);

// Save as a smart list: the dialog names it, then the chart reopens as that list.
let dialogOpen = $state(false);
let saving = $state(false);
let atLimit = $state(false);
let saveError = $state('');
const request = (path: string, method: string, body?: unknown) =>
  rawApiFetch({
    fetch: viewerFetch(),
    path,
    init: {
      method,
      ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    },
  });

function openSave() {
  saveError = '';
  dialogOpen = true;
}

async function create({ name, privacy }: { name: string; privacy: SmartListPrivacy }) {
  if (!isSmartListChart(data.chart) || saving) return;
  saving = true;
  saveError = '';
  const write = {
    name,
    privacy,
    source: data.chart,
    mediaType: data.type,
    filters: toSmartListFilters(advanced.filters),
  };
  const result = await saveSmartList({ request, write });
  saving = false;
  if (!result.ok) {
    atLimit = result.reason === 'limit';
    if (!atLimit) saveError = "Doh! We couldn't save this smart list. Please try again.";
    return;
  }
  remember({ ...write, id: result.id ?? 0, slug: result.slug, updatedAt: new Date().toISOString(), posters: [] });
  dialogOpen = false;
  toast.success(`You saved ${name}.`);
  const query = [advancedFiltersSearch(advanced.filters), `${SMART_LIST_PARAM}=${encodeURIComponent(result.slug)}`];
   
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and filters, now a smart list
  await goto(`${page.url.pathname}?${query.filter(Boolean).join('&')}`, { reset: false });
}

// Deleting the open smart list keeps its filters on the chart, unsaved, so they can be saved again.
async function deleteCurrent() {
  if (!current || saving) return;
  const list = current;
  saving = true;
  const ok = await deleteSmartList({ request, slug: list.slug });
  saving = false;
  if (!ok) {
    toast.error("Doh! We couldn't delete this smart list. Please try again.");
    return;
  }
  deleted = [...deleted, list.slug];
  saved = saved.filter(({ slug }) => slug !== list.slug);
  toast.success(`You deleted ${list.name}.`);
   
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and filters, no longer a smart list
  await goto(search(advanced.filters), { reset: false, replace: true });
}

async function saveChanges() {
  if (!current || saving) return;
  const list = current;
  const filters = toSmartListFilters(advanced.filters);
  saving = true;
  const result = await saveSmartList({ request, slug: list.slug, write: { filters } });
  saving = false;
  if (!result.ok) {
    toast.error("Doh! We couldn't save your changes. Please try again.");
    return;
  }
  const { id, slug, name, privacy, source, mediaType, posters } = list;
  remember({ id, slug, name, privacy, source, mediaType, posters, filters, updatedAt: new Date().toISOString() });
  toast.success(`You saved ${list.name}.`);
  // The open list's link moves to its new filters.
  const query = [advancedFiltersSearch(advanced.filters), `${SMART_LIST_PARAM}=${encodeURIComponent(list.slug)}`];
   
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same chart and filters, saved
  await goto(`${page.url.pathname}?${query.filter(Boolean).join('&')}`, {
    reset: false,
    replace: true,
    invalidateAll: true,
  });
}
</script>

<SeoHead title={meta.title} description={meta.description} />

{#snippet filtersPanel()}
  <FiltersPanel id="{panelId}-filters" open={panelOpen} config={advanced.config} filters={data.filters}
  country={data.watchNowCountry} favorites={data.watchNowFavorites} sources={data.filterSources}
  onchange={applyFilters} onclose={closePanel} onsave={savable && !current && advanced.count > 0 ? openSave : undefined} />
{/snippet}

<!-- The picker's hrefs come built by chartLinks, query included, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet tools()}
  {#if menu}
    <FadeHideMenu value={fadeHide} {options} cookie={data.type} onchange={save} />
  {/if}
  <AdvancedFiltersToggle bind:open={panelOpen} bind:button={funnel} controls="{panelId}-filters"
  active={advanced.count > 0} count={advanced.count} />
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

{#if dialogOpen && isSmartListChart(data.chart)}
  <SmartListDialog bind:open={dialogOpen} source={smartListSourceLabel(data.chart, data.type)} chips={advanced.chips}
    fanart={data.cards.at(0)?.fanart} busy={saving} {atLimit} vip={data.user?.isVip} error={saveError}
    onsave={create} />
{/if}

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
          <!-- The API's own count only sums the page's rows; Live now reads the whole chart, filtered or not. -->
          <CountPill count={data.liveFiltered ?? data.live?.[data.type] ?? data.watcherCount}
            total={data.liveFiltered !== null ? data.live?.[data.type] : undefined} label="watchers" one="watcher" />
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

    {#if advanced.count > 0 || current}
      <AppliedFiltersSection chips={advanced.chips} open={data.sidebar.filters} clearHref={page.url.pathname}
        onremove={removeChip} onsave={savable && !current && advanced.count > 0 ? openSave : undefined}>
        {#snippet tools()}
          {#if current && savable}
            <ManageConfirm name="delete" svg={deleteIcon} label="Delete this smart list" yes="Yes, delete it!"
              warning="This can't be undone!" busy={saving} onconfirm={deleteCurrent}>Delete this smart list?</ManageConfirm>
          {/if}
        {/snippet}
        {#if current}
          <SmartListStatus name={current.name} href={smartListPath(owner, current.slug)} {changed}
            undoHref={current.href} busy={saving} onsavechanges={saveChanges} onsaveas={openSave} />
        {/if}
      </AppliedFiltersSection>
    {/if}

    {#if data.live}
      <LiveNowSection live={data.live} type={data.type} filtered={data.liveFiltered} open={data.sidebar.live} />
    {/if}
    {#if data.chart === 'trending' && data.user}
      <FollowingWatchingSection type={data.type} open={data.sidebar.following} />
    {/if}

    <!-- The viewer's smart lists come last, after the chart's own sections. -->
    {#if smartLists.length > 0}
      <SmartListsSection lists={smartLists} current={current?.slug} chartPath={page.url.pathname}
        manageHref="/users/{owner}/smart-lists" open={data.sidebar.smart} />
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
      <LoadFailed inFrame what={meta.title} />
    </div>
  {:else if entries.length > 0}
    <div class="chart" {@attach trackDrilldowns({ source })}>
      {#if hero}
        <ChartHero card={hero.card} rank={hero.rank} live={data.chart === 'trending'} icons={hero.icons} />
      {/if}
      {#if pair.length > 0}
        <div class="pair-frame" data-sveltekit-preload-data="tap">
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
    </div>
  {:else}
    <div class="no-results">
      {#if advanced.count > 0}
        <NoResults action={{ href: page.url.pathname, text: 'Clear filters' }} />
      {:else if menu && fadeHide.hide.length > 0}
        <NoResults action={{ onclick: clearHide, text: `Show hidden ${noun}s` }} />
      {:else}
        <EmptyState inFrame />
      {/if}
    </div>
  {/if}
</SidebarFrame>

<style>
.chart {
  display: contents;
}

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

/* OG centred the droids in the frame from 1025px up; the other empty states sit there too. */
.no-results {
  display: grid;
  place-items: center;
  min-block-size: calc(100vh - var(--header-height));
}
</style>
