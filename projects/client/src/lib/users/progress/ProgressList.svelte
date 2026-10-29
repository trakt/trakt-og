<!--
  The progress page's view: the subnav with the type dropdown, the summary strip, sort, view toggles and filters,
  then one row a show, or each show's next episode as a poster card when grid view is on. It sorts, filters, pages and totals `items` itself, so
  the same view renders live data (`ProgressPage.svelte`) and the design page's samples. `items` is null while your
  progress loads, and `listed` while a `?list=`'s shows do; shimmering rows (or a row of poster cards in grid view)
  hold their place meanwhile. The grid view, simple bar and Include Watchlisted toggles save to the viewer's watched
  progress settings, which every tab reads, and grid view reloads the page, as OG did. Include Watchlisted, on Watching
  only, keeps the watchlisted shows you haven't started; off, the default, drops them. A `?list=` puts a band naming the
  list between the subnav and the rows.
-->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { untrack } from 'svelte';
import { SvelteMap, SvelteURLSearchParams } from 'svelte/reactivity';
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import LoadFailed from '$lib/components/empty/LoadFailed.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import CardShimmerRow from '$lib/components/loading/CardShimmerRow.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import ProgressRowShimmer from '$lib/components/loading/ProgressRowShimmer.svelte';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import TermsFilter from '$lib/components/filters/TermsFilter.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import OnDeckCard from '$lib/components/media/OnDeckCard.svelte';
import type { OnDeckItem } from '$lib/components/media/OnDeckItem';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import barsProgress from '$lib/icons/regular/bars-progress.svg?raw';
import grid2 from '$lib/icons/regular/grid-2.svg?raw';
import bookmark from '$lib/icons/solid/bookmark.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { settingsRequest } from '$lib/settings/settingsRequest';
import type { ProfileUser } from '$lib/users/ProfileUser';
import { findAction } from '$lib/users/findAction';
import { fadeOnChange } from '$lib/utils/fadeOnChange';
import { nearViewport } from '$lib/utils/nearViewport';
import { changeProgressView, type ProgressView } from './changeProgressView.ts';
import { filterProgress } from './filterProgress.ts';
import { keepOrder } from './keepOrder.ts';
import type { loadProgress } from './loadProgress.ts';
import { hideOptionsFor, type ProgressHide } from './progressHide.ts';
import type { ProgressItem } from './ProgressItem.ts';
import ProgressListBand from './ProgressListBand.svelte';
import ProgressRow from './ProgressRow.svelte';
import { literalProgressSort, type ProgressSort, progressSortLabel, progressSorts } from './progressSort.ts';
import ProgressSummary from './ProgressSummary.svelte';
import { isProgressType, type ProgressType, progressTypes } from './progressTypes.ts';
import { sortProgress } from './sortProgress.ts';
import { sumProgressTotals } from './sumProgressTotals.ts';
import { toProgressCard } from './toProgressCard.ts';
import { toProgressRow } from './toProgressRow.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';
import { expireHideCookie } from '../../components/filters/expireHideCookie.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadProgress>> & { profile: ProfileUser; user: HeaderUser | null };
  /** Every show on the tab, unsorted. Null while your progress loads. */
  items: readonly ProgressItem[] | null;
  /** `?list=`'s shows. Null while they load. */
  listed?: ReadonlySet<number> | null;
  /** Shows whose catalog is being read. */
  loading?: ReadonlySet<number>;
  /** Your progress is being read again, after a watch or another change. */
  reloading?: boolean;
  /** A row opened its seasons, or a next episode was watched: read its show's catalog, which finds the next one. */
  onneed?: (id: number) => void;
  /** Your progress didn't load: Try again reads it again. */
  onretry?: () => unknown;
  /** Why the read failed, when `onretry` is set. */
  error?: unknown;
  /** A fixed clock for samples. Otherwise each rebuild of the rows reads the time, so a fresh mark isn't ahead. */
  now?: Date;
};

const { data, items, listed, loading = new Set(), reloading = false, onneed, onretry, error, now }: Props = $props();

// OG's `per(50)`, 48 in grid view (eight rows of six).
const PER_PAGE = 50;
const GRID_PER_PAGE = 48;
// Enough shimmering rows to fill the screen while your progress loads.
const SHIMMER_ROWS = 5;

const base = $derived(`/users/${data.profile.slug}/progress`);
const title = $derived(`${data.profile.displayName}'s show ${data.type} progress`);
const types = Object.keys(progressTypes).filter(isProgressType);
const listFilter = $derived(data.list !== undefined);
// A list shows every show on it, whatever you've played, like OG.
const watchlistToggle = $derived(data.type === 'watched' && !listFilter);
// Shows the new state as it saves, like the view toggles below.
let watchlisted = $derived(data.includeWatchlisted);
const hideUnstarted = $derived(watchlistToggle && !watchlisted);
const seed = Math.floor(Math.random() * 2 ** 31);

const sorted = $derived(
  items && (!listFilter || listed)
    ? sortProgress(
      filterProgress(items, {
        hide: data.hide,
        terms: data.terms,
        listed: listed ?? undefined,
        hideUnstarted,
      }),
      data.sort,
      seed,
    )
    : null,
);
// Each show keeps its place when a watch reloads the progress, so its card or row moves on to the next episode where
// it is. Another sort, filter or tab orders afresh.
let kept: { view: string; ids: readonly number[] } | null = null;
const shown = $derived.by(() => {
  if (!sorted) return sorted;
  const view = [data.type, data.sort.by, data.sort.how, data.hide.join(), hideUnstarted, data.terms, data.list].join('|');
  const ordered = kept?.view === view ? keepOrder(sorted, kept.ids) : sorted;
  kept = { view, ids: ordered.map(({ show }) => show.id) };
  return ordered;
});
const limit = $derived(data.grid ? GRID_PER_PAGE : PER_PAGE);
const pageCount = $derived(Math.max(Math.ceil((shown?.length ?? 0) / limit), 1));
const current = $derived(Math.min(data.page, pageCount));
const onPage = $derived(shown?.slice((current - 1) * limit, current * limit) ?? []);
const rows = $derived(
  onPage.map((item) => toProgressRow({ item, datePreferences: data.datePreferences, now: now ?? new Date() })),
);
// Grid view's cards, by row.
const cards = $derived(
  data.grid
    ? onPage.map((item) => toProgressCard({ item, username: data.profile.slug, simple, now: now ?? new Date() }))
    : [],
);
// Grid cards saved from, by show, with what they showed. Each holds its loader until it moves on, or the progress
// read ends without moving it.
const waiting = new SvelteMap<number, string>();
const cardKey = (card: OnDeckItem) => (card.complete ? 'complete' : String(card.episodeId));
let wasReloading = false;
$effect(() => {
  const active = reloading;
  untrack(() => {
    if (wasReloading && !active) waiting.clear();
    wasReloading = active;
  });
});
const totals = $derived(shown ? sumProgressTotals(shown) : null);
const meta = $derived({ type: 'paginated' as const, current, total: pageCount });

// The toggles show the new state as they save; grid view then reloads the page for its layout and page size.
let simple = $derived(data.simple);
let gridOn = $derived(data.grid);
let saving = $state<ProgressView | null>(null);

const viewOn = (view: ProgressView) =>
  view === 'grid_view' ? gridOn : view === 'simple_progress' ? simple : watchlisted;

async function toggleView(view: ProgressView) {
  if (saving) return;
  saving = view;
  try {
    const saved = await changeProgressView({
      view,
      settings: 'watched',
      on: !viewOn(view),
      apply: (value) => {
        if (view === 'grid_view') gridOn = value;
        else if (view === 'simple_progress') simple = value;
        else watchlisted = value;
      },
      request: settingsRequest(viewerFetch()),
      notify: toast,
    });
    // The layout's settings feed every later load, so they're read again either way.
    if (saved) await invalidateAll();
  } finally {
    saving = null;
  }
}

// OG's `link_params`: the query string without the page. A new type drops the sort, like OG's type links.
function href(type: ProgressType, sort?: Pick<ProgressSort, 'by' | 'how'>) {
  const query = new SvelteURLSearchParams(page.url.searchParams);
  query.delete('page');
  const path = sort ? `/${type}/${sort.by}/${sort.how}` : type === 'watched' ? '' : `/${type}`;
  return `${base}${path}${query.size ? `?${query}` : ''}`;
}

function withTerms(terms: string) {
  const url = new URL(page.url);
  url.searchParams.delete('page');
  if (terms) url.searchParams.set('terms', terms);
  else url.searchParams.delete('terms');
  return url.pathname + url.search;
}

// OG reloaded the page on each toggle. Turning Completed off also drops the Up Next link's `?hide_completed=true`, or
// it would stay hidden.
function changeHide(hide: ProgressHide[]) {
  const url = new URL(page.url);
  url.searchParams.delete('page');
  if (!hide.includes('completed')) url.searchParams.delete('hide_completed');
  // The same page with other filters; resolve() only takes route ids.
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  void goto(url.pathname + url.search, { invalidateAll: true, noScroll: true });
}

// Drops the search, the list and the hide toggles, and the eye's saved hide cookie as its Show All does.
function clearFilters() {
  expireHideCookie('progress');
  const url = new URL(page.url);
  for (const key of ['page', 'terms', 'list', 'hide_completed']) url.searchParams.delete(key);
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page without its filters
  void goto(url.pathname + url.search, { invalidateAll: true, noScroll: true });
}
</script>

<!-- Filter URLs keep the canonical profile slug and the query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {title} description="Check out {data.profile.firstName}'s show {data.type} progress." />

{#snippet viewToggle(label: string, svg: string, view: ProgressView, on: boolean)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <button type="button" class={['view-toggle', { selected: on }]} aria-label={label} aria-pressed={on}
        aria-busy={saving === view} onclick={() => toggleView(view)} {...tooltip}><Icon {svg} /></button>
    {/snippet}
  </Tooltip>
{/snippet}

<SectionToolbar>
  {#snippet filters()}
    <Dropdown section="Status">
      {#snippet trigger()}{progressTypes[data.type].label}{/snippet}
      <ul>
        {#each types as type (type)}
          <li><a href={href(type)} aria-current={data.type === type ? 'page' : undefined}>{progressTypes[type].label}</a
            ></li>
        {/each}
      </ul>
    </Dropdown>
  {/snippet}
  {#snippet stats()}
    <span class="strip"><ProgressSummary shows={shown?.length ?? 0} {totals} /></span>
  {/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}{#if data.sort.supported}{progressSortLabel(data.sort.by)}{:else}{progressSortLabel(data.sort.by)} <em>(unsupported)</em>{/if}{/snippet}
        <ul>
          {#each Object.keys(progressSorts) as by (by)}
            <li><a href={href(data.type, { by, how: 'asc' })}
              aria-current={data.sort.by === by ? 'page' : undefined}>{progressSortLabel(by)}</a></li>
          {/each}
        </ul>
      </Dropdown>
      <SortDirection joined descending={literalProgressSort({ by: data.sort.by, how: 'asc' }).how === 'desc'} bind:flipped={
        () => data.sort.how === 'desc',
        (next) => goto(href(data.type, { by: data.sort.by, how: next ? 'desc' : 'asc' }))
      } />
    </span>
    <span class="icons">
      {#if data.user}
        {@render viewToggle('Grid View', grid2, 'grid_view', gridOn)}
        {@render viewToggle('Simple Progress Bars', barsProgress, 'simple_progress', simple)}
        {#if watchlistToggle}
          {@render viewToggle('Include Watchlisted', bookmark, 'include_watchlisted', watchlisted)}
        {/if}
      {/if}
      <TermsFilter bind:terms={() => data.terms, (terms) => goto(withTerms(terms))} />
      <FadeHideMenu value={{ fade: [], hide: data.hide }} options={[]} hideOptions={hideOptionsFor(data.type)}
        cookie="progress" onchange={(next) => changeHide(next.hide)} />
    </span>
  {/snippet}
</SectionToolbar>

<section class="phone-strip" aria-label="Progress totals">
  <Container>
    <ProgressSummary shows={shown?.length ?? 0} {totals} />
  </Container>
</section>

{#if data.listRow}<ProgressListBand row={data.listRow} />{/if}

<!-- OG's `showLoading()` while grid view saves and the page reloads. -->
<LoadingOverlay visible={saving === 'grid_view'} />

<section class={['progress', data.type]} aria-label={title} aria-busy={shown === null}>
  <Container>
    {#if shown !== null && rows.length > 0}
      {#if pageCount > 1}<Pagination {meta} label="Progress pages" />{/if}
      {#if data.grid}
        <div class="grid">
          <PosterGrid columns={6}>
            {#each rows as row, index (row.id)}
              {@const card = cards[index]}
              {#if card}
                <div {@attach fadeOnChange(cardKey(card))}>
                  <OnDeckCard item={card} loading={waiting.get(card.showId) === cardKey(card)}
                    state={card.complete ? overlay.state('show', card.showId) : overlay.state('episode', card.episodeId)}
                    onWatchSave={() => {
                      waiting.set(card.showId, cardKey(card));
                      onneed?.(card.showId);
                    }} />
                </div>
              {:else}
                {@const state = overlay.state('show', row.id)}
                {@const done = `${row.percent}% watched`}
                <!-- Episodes left but no next one yet: the show until its catalog names it. -->
                <div {@attach nearViewport(() => onneed?.(row.id))}>
                  <PosterCard href={row.href} title={row.title} image={row.poster}
                    rewatchingSince={row.rewatchingSince} userRating={state.rating} subtitles={[done]}
                    icons={{
                      fill: quickIconFill({ state, airedEpisodes: row.aired, datePreferences: data.datePreferences }),
                      ratingTarget: { type: 'show', id: row.id, title: row.title },
                      watchTarget: { type: 'show', id: row.id, title: row.title, airedEpisodes: row.aired },
                      watchNow: 'play',
                    }}>
                    {#snippet progress()}
                      <UnderProgress href={row.href} percent={row.percent} tip={done} />
                    {/snippet}
                  </PosterCard>
                </div>
              {/if}
            {/each}
          </PosterGrid>
        </div>
      {:else}
        {#each rows as row (row.id)}
          <ProgressRow {row} type={data.type} {simple} datePreferences={data.datePreferences}
            loading={loading.has(row.id)} onneed={() => onneed?.(row.id)} />
        {/each}
      {/if}
      {#if pageCount > 1}<Pagination {meta} label="Progress pages" />{/if}
    {:else if shown === null}
      {#if data.grid}
        <div class="grid"><CardShimmerRow columns={6} ratio="poster" /></div>
      {:else}
        {#each Array.from({ length: SHIMMER_ROWS }, (_, i) => i) as slot (slot)}<ProgressRowShimmer />{/each}
      {/if}
    {:else if onretry}
      <div class="empty"><LoadFailed what="Progress" {onretry} {error} /></div>
    {:else if items?.some(({ plays }) => !hideUnstarted || plays > 0)}
      <div class="empty"><EmptyState action={{ onclick: clearFilters, text: 'Clear filters' }} /></div>
    {:else}
      <div class="empty">
        <EmptyState action={data.type === 'watched' ? findAction('shows') : undefined} />
      </div>
    {/if}
  </Container>
</section>

<style>
.sort,
.icons {
  display: flex;
  align-items: center;
}

.icons {
  gap: var(--history-icon-gap);
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-tool);
  font-size: var(--font-size-tool);
  line-height: 1;
  vertical-align: middle;
  cursor: pointer;
  transition: color 0.5s, background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-tool-hover);
  }

  &.selected {
    color: var(--brand-primary);
  }
}

.progress {
  display: flow-root;
  padding-block-end: var(--space-panel);

  /* The top pagination spacing and -bottom. */
  & :global(nav) {
    margin-block: var(--line-height-computed);
  }
}

.grid {
  margin-block: var(--progress-row-margin);
}

.empty {
  padding-block-start: var(--line-height-computed);
}

/* On a phone OG moved the strip to its own band under the subnav (`.list-stats-wrapper.visible-xs-block`). */
.phone-strip {
  display: none;
  padding-block: var(--toolbar-padding);
  background: var(--color-toolbar-bg);
  border-block-start: 1px solid var(--color-separator);
}

@media (width < 768px) {
  .strip {
    display: none;
  }

  .phone-strip {
    display: block;

    & :global(.progress-summary) {
      justify-content: flex-start;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .view-toggle {
    transition: none;
  }
}
</style>
