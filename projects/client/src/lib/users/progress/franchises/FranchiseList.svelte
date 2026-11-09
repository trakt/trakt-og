<!--
  The Franchises tab's view: the subnav with the status dropdown, the franchise count, sort, the Grid View toggle (the
  progress settings' own, which reloads the page as the show tabs do), title search and Hide Completed, then one row per
  official franchise collection you've watched a movie from, or one poster card each in grid view. It filters, sorts and pages
  `franchises` itself, so the same view renders live data (`FranchisePage.svelte`) and the design page's samples.
  `franchises` is null while the catalog loads, and your watched movies (the overlay's) shimmer the rows meanwhile
  too. A row's movies are read once, as it nears the screen. The percent and movies left the sorts and Hide Completed
  read count every movie on the catalog, an unreleased one too; each row's own numbers leave those out.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { SvelteMap, SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import Container from '#lib/components/container/Container.svelte';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import SortDirection from '#lib/components/dropdown/SortDirection.svelte';
import CardShimmerRow from '#lib/components/loading/CardShimmerRow.svelte';
import LoadingOverlay from '#lib/components/loading/LoadingOverlay.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
import TermsFilter from '#lib/components/filters/TermsFilter.svelte';
import { expireHideCookie } from '#lib/components/filters/expireHideCookie.ts';
import ProgressRowShimmer from '#lib/components/loading/ProgressRowShimmer.svelte';
import Pagination from '#lib/components/pagination/Pagination.svelte';
import SortLabel from '#lib/components/sort/SortLabel.svelte';
import SortMenu from '#lib/components/sort/SortMenu.svelte';
import Stat from '#lib/components/stats/Stat.svelte';
import SectionToolbar from '#lib/components/toolbar/SectionToolbar.svelte';
import file from '#lib/icons/regular/file.svg?raw';
import grid2 from '#lib/icons/regular/grid-2.svg?raw';
import { settingsRequest } from '#lib/settings/settingsRequest.ts';
import { viewerFetch } from '#lib/auth/viewerFetch.ts';
import { overlay } from '#lib/overlay/overlay.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { findAction } from '#lib/users/findAction.ts';
import { changeProgressView } from '../changeProgressView.ts';
import ProgressViewToggle from '../ProgressViewToggle.svelte';
import { hideOptionsFor, type ProgressHide } from '../progressHide.ts';
import ProgressTypeMenu from '../ProgressTypeMenu.svelte';
import type { ProgressType } from '../progressTypes.ts';
import type { Franchise } from './Franchise.ts';
import { filterFranchises } from './filterFranchises.ts';
import FranchiseGridCard from './FranchiseGridCard.svelte';
import FranchiseRow from './FranchiseRow.svelte';
import { franchiseSorts, type FranchiseSort, type FranchiseSortBy } from './franchiseSort.ts';
import { loadFranchiseMovies } from './loadFranchiseMovies.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';
import { sortFranchises } from './sortFranchises.ts';
import { toFranchiseProgress } from './toFranchiseProgress.ts';
import { toFranchiseRow } from './toFranchiseRow.ts';

type Props = {
  data: {
    profile: ProfileUser;
    sort: FranchiseSort;
    grid: boolean;
    hide: readonly ProgressHide[];
    terms: string;
    page: number;
    datePreferences: DatePreferences;
  };
  /** Every franchise. Null while the catalog loads. */
  franchises: readonly Franchise[] | null;
  /** The catalog didn't load: Try again reads it again. */
  onretry?: () => unknown;
  error?: unknown;
  /** Reads a franchise's movies. The page reads them from the API; the design page answers from samples. */
  readMovies?: (id: number) => Promise<readonly FranchiseMovie[]>;
  /** The movies you've watched, with their dates. The page reads the overlay's; the design page passes samples. */
  watched?: ReadonlyMap<number, readonly string[]>;
  /** A fixed clock for samples. */
  now?: Date;
};

const { data, franchises, onretry, error, readMovies = (id) => loadFranchiseMovies({ id }), watched, now }: Props = $props();

// Shows the new state as it saves; the page then reloads for its layout and page size, as the show tabs do.
let gridOn = $derived(data.grid);
let saving = $state(false);

const PER_PAGE = 25;
// Eight rows of six, like the show grid.
const GRID_PER_PAGE = 48;
// Enough shimmering rows to fill the screen while the catalog and your movies load.
const SHIMMER_ROWS = 5;
const base = $derived(`/users/${data.profile.slug}/progress`);
const title = $derived(`${data.profile.displayName}'s franchise progress`);
const menuSorts = Object.entries(franchiseSorts).map(([by, { label }]) => ({ by, label }));
const naturalHow = $derived(franchiseSorts[data.sort.by].how);

const plays = $derived(watched ?? overlay.slices().watchedMovies);
const started = $derived(franchises && plays ? toFranchiseProgress({ franchises, plays }) : null);
const sorted = $derived(
  started && sortFranchises(filterFranchises(started, { hide: data.hide, terms: data.terms }), data.sort),
);
const limit = $derived(gridOn ? GRID_PER_PAGE : PER_PAGE);
const pageCount = $derived(Math.max(Math.ceil((sorted?.length ?? 0) / limit), 1));
const current = $derived(Math.min(data.page, pageCount));
const onPage = $derived(sorted?.slice((current - 1) * limit, current * limit) ?? []);
const meta = $derived({ current, total: pageCount });
const count = $derived((sorted?.length ?? 0).toLocaleString('en-US'));
const noun = $derived(sorted?.length === 1 ? 'franchise' : 'franchises');

async function toggleGrid() {
  if (saving) return;
  saving = true;
  try {
    const saved = await changeProgressView({
      view: 'grid_view',
      settings: 'watched',
      on: !gridOn,
      apply: (value) => (gridOn = value),
      request: settingsRequest(viewerFetch()),
      notify: toast,
    });
    if (saved) await invalidateAll();
  } finally {
    saving = false;
  }
}

const movies = new SvelteMap<number, readonly FranchiseMovie[]>();
const failed = new SvelteSet<number>();
const loading = new SvelteSet<number>();

async function need(id: number) {
  if (movies.has(id) || loading.has(id)) return;
  loading.add(id);
  failed.delete(id);
  try {
    movies.set(id, await readMovies(id));
  } catch {
    failed.add(id);
  } finally {
    loading.delete(id);
  }
}

const row = (franchise: Franchise) => {
  const list = movies.get(franchise.id);
  if (!list || !plays) return undefined;
  return toFranchiseRow({ franchise, movies: list, plays, datePreferences: data.datePreferences, now: now ?? new Date() });
};

function href(type: ProgressType) {
  const query = new SvelteURLSearchParams(page.url.search);
  query.delete('page');
  return `${base}${type === 'watched' ? '' : `/${type}`}${query.size ? `?${query}` : ''}`;
}

function sortHref(by: FranchiseSortBy, how: 'asc' | 'desc') {
  const query = new SvelteURLSearchParams(page.url.search);
  query.delete('page');
  return `${base}/franchises/${by}/${how}${query.size ? `?${query}` : ''}`;
}

function withTerms(terms: string) {
  const url = new URL(page.url.href);
  url.searchParams.delete('page');
  if (terms) url.searchParams.set('terms', terms);
  else url.searchParams.delete('terms');
  return url.pathname + url.search;
}

function changeHide(hide: ProgressHide[]) {
  const url = new URL(page.url.href);
  url.searchParams.delete('page');
  if (!hide.includes('completed')) url.searchParams.delete('hide_completed');
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page with other filters
  void goto(url.pathname + url.search, { invalidateAll: true, reset: false });
}

function clearFilters() {
  expireHideCookie('franchises');
  const url = new URL(page.url.href);
  for (const key of ['page', 'terms', 'hide_completed']) url.searchParams.delete(key);
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page without its filters
  void goto(url.pathname + url.search, { invalidateAll: true, reset: false });
}
</script>

<!-- Filter URLs keep the canonical profile slug and the query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {title} description="Check out {data.profile.firstName}'s franchise progress." />

<SectionToolbar statsChip={{ svg: file, value: count, label: 'Franchises' }}>
  {#snippet filters()}
    <ProgressTypeMenu type="franchises" {href} />
  {/snippet}
  {#snippet stats()}
    <Stat label={noun} svg={file} value={count} {noun} bare />
  {/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}<SortLabel sort={menuSorts.find(({ by }) => by === data.sort.by)} />{/snippet}
        <SortMenu sorts={menuSorts} current={data.sort.by}
          href={({ by }) => sortHref(by as FranchiseSortBy, franchiseSorts[by as FranchiseSortBy].how)} />
      </Dropdown>
      <SortDirection joined descending={naturalHow === 'desc'} bind:flipped={
        () => data.sort.how !== naturalHow,
        (flipped) => goto(sortHref(data.sort.by, flipped ? (naturalHow === 'desc' ? 'asc' : 'desc') : naturalHow))
      } />
    </span>
    <span class="icons">
      <ProgressViewToggle label="Grid View" svg={grid2} on={gridOn} busy={saving} onclick={toggleGrid} />
      <TermsFilter bind:terms={() => data.terms, (terms) => goto(withTerms(terms))} />
      <FadeHideMenu value={{ fade: [], hide: data.hide }} options={[]} hideOptions={hideOptionsFor('franchises')}
        cookie="franchises" onchange={(next) => changeHide(next.hide)} />
    </span>
  {/snippet}
</SectionToolbar>

<LoadingOverlay visible={saving} />

<section class="progress franchises" aria-label={title} aria-busy={sorted === null}
  {@attach trackDrilldowns({ source: 'progress' })}>
  <Container>
    {#if sorted !== null && onPage.length > 0}
      {#if pageCount > 1}<Pagination {meta} label="Franchise pages" />{/if}
      {#if gridOn}
        <div class="grid">
          <PosterGrid columns={6}>
            {#each onPage as { franchise } (franchise.id)}
              <FranchiseGridCard {franchise} row={row(franchise)} datePreferences={data.datePreferences}
                onneed={() => need(franchise.id)} />
            {/each}
          </PosterGrid>
        </div>
      {:else}
        {#each onPage as { franchise } (franchise.id)}
          <FranchiseRow {franchise} row={row(franchise)} failed={failed.has(franchise.id)}
            datePreferences={data.datePreferences} onneed={() => need(franchise.id)} />
        {/each}
      {/if}
      {#if pageCount > 1}<Pagination {meta} label="Franchise pages" />{/if}
    {:else if onretry && franchises === null}
      <div class="empty"><LoadFailed what="Franchises" {onretry} {error} /></div>
    {:else if sorted === null}
      {#if gridOn}
        <div class="grid"><CardShimmerRow columns={6} ratio="poster" /></div>
      {:else}
        {#each Array.from({ length: SHIMMER_ROWS }, (_, i) => i) as slot (slot)}<ProgressRowShimmer />{/each}
      {/if}
    {:else if started?.length}
      <div class="empty"><EmptyState action={{ onclick: clearFilters, text: 'Clear filters' }} /></div>
    {:else}
      <div class="empty"><EmptyState action={findAction('movies')} /></div>
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

.progress {
  display: flow-root;
  padding-block-end: var(--space-panel);

  & :global(nav) {
    margin-block: var(--line-height-computed);
  }
}

.grid {
  margin-block: var(--progress-row-margin);
}

.empty {
  padding-block-start: var(--empty-state-above);
}
</style>
