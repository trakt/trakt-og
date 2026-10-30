<!--
  The progress page as its owner sees it, on sample shows: the view toggles, each row's status menu (rewatch and drop,
  restore on Dropped) and its Seasons toggle. `?view=grid` shows the grid of next episodes, `?view=simple` the simple
  bars, `?hide=completed` hides completed shows (Finish Breaking Bad completes it, and it stays with its show card
  until the page reloads), `?watchlisted=1` turns Include Watchlisted on (Murderbot, not started, joins the list), `?type=rewatching` the
  Rewatching tab (Game of Thrones) and `?type=dropped` the Dropped tab (two of the sample shows). `?list=1` filters to a
  list's shows, `?list=2` to an empty list and `?list=3` to someone else's watchlist, each after a short wait, with the
  list's band shimmering above the rows until the list streams in, and `?state=loading` holds the progress loading for
  good. Rows start with the up-next episode and estimated counts, as the page does; opening one's seasons reads its
  catalog after a short wait (Breaking Bad has unwatched episodes in the library, Severance a season announced). In the
  grid, marking a card's episode watched covers its poster with the loader while the progress is read again, after a
  short wait.
-->
<script lang="ts">
import { page } from '$app/state';
import { untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import Specimen from '$lib/design/Specimen.svelte';
import { overlay } from '$lib/overlay/overlay';
import { progressFixture } from '$lib/users/progress/progressFixture';
import ProgressList from '$lib/users/progress/ProgressList.svelte';
import type { ProgressListRow } from '$lib/users/progress/loadProgressListRow';
import { isProgressType, type ProgressType } from '$lib/users/progress/progressTypes';
import { PLACEHOLDER_AVATAR } from '$lib/users/placeholderAvatar';
import { toProfileUser } from '$lib/users/toProfileUser';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const now = new Date(progressFixture.now);
const profile = toProfileUser({ username: 'demo', name: 'Demo User', private: false, ids: { slug: 'demo' } });

const WAIT = 900;
const view = $derived(page.url.searchParams.get('view'));
const listId = $derived(Number.parseInt(page.url.searchParams.get('list') ?? '', 10) || undefined);
const list = $derived(
  listId === undefined ? undefined : listId === 3 ? '/users/morbus/watchlist' : `/lists/${listId}/items`,
);
const type = $derived.by<ProgressType>(() => {
  const value = page.url.searchParams.get('type') ?? '';
  return isProgressType(value) ? value : 'watched';
});
const variants = [
  { label: 'List', query: '' },
  { label: 'Grid', query: '?view=grid' },
  { label: 'Simple', query: '?view=simple' },
  { label: 'Hide Completed', query: '?hide=completed' },
  { label: 'Hide Completed grid', query: '?hide=completed&view=grid' },
  { label: 'Include Watchlisted', query: '?watchlisted=1' },
  { label: 'Rewatching', query: '?type=rewatching' },
  { label: 'Dropped', query: '?type=dropped' },
  { label: 'On a list', query: '?list=1' },
  { label: 'Empty list', query: '?list=2' },
  { label: "Someone's watchlist", query: '?list=3' },
  { label: 'Loading', query: '?state=loading' },
];
const hideCompleted = $derived(page.url.searchParams.get('hide') === 'completed');
const pending = $derived(page.url.searchParams.get('state') === 'loading');

// Like the page: up-next comes with the progress, and a row's catalog is read as its seasons open.
const catalogs = new SvelteSet<number>();
const loading = new SvelteSet<number>();
function need(id: number) {
  if (catalogs.has(id) || loading.has(id)) return;
  loading.add(id);
  setTimeout(() => {
    loading.delete(id);
    catalogs.add(id);
  }, WAIT);
}
// Like the page: a watch reads the progress again, here a short wait that leaves the samples as they are.
const watchedShows = $derived(overlay.slices().watchedShows);
let reloading = $state(false);
let seen: unknown;
$effect(() => {
  const marks = watchedShows;
  untrack(() => {
    const changed = seen !== undefined && marks !== seen;
    seen = marks;
    if (!changed) return;
    reloading = true;
    setTimeout(() => (reloading = false), WAIT);
  });
});
// Hide Completed's Finish button: watches a sample's last episodes, as marking them would.
const finished = new SvelteSet<number>();
function finish(id: number) {
  finished.add(id);
  reloading = true;
  setTimeout(() => (reloading = false), WAIT);
}
const exact = $derived(progressFixture[type](true));
const items = $derived(
  progressFixture[type](false).map((item) => {
    const full = exact.find(({ show }) => show.id === item.show.id);
    if (!full) return item;
    if (finished.has(item.show.id)) {
      return { ...item, completed: item.aired, minutesLeft: 0, next: undefined, detail: undefined };
    }
    if (catalogs.has(item.show.id)) return full;
    return { ...item, next: full.next ?? full.detail?.next, last: full.last ?? full.detail?.last };
  }),
);

// `?list=1` holds Breaking Bad and Severance, `?list=2` nothing, `?list=3` (the watchlist) every sample show.
let listed = $state<ReadonlySet<number> | null>(null);
$effect(() => {
  const id = listId;
  listed = null;
  if (id === undefined) return;
  const ids = id === 3 ? progressFixture.watched(false).map(({ show }) => show.id) : id === 1 ? [1388, 60300] : [];
  const timer = setTimeout(() => (listed = new Set(ids)), WAIT);
  return () => clearTimeout(timer);
});
// The list band's list, streamed in after a short wait like the page's; the watchlist is someone else's.
const owner = (slug: string, name: string) => ({ slug, name, href: `/users/${slug}`, avatar: PLACEHOLDER_AVATAR, vip: null });
function sampleRow(id: number): ProgressListRow {
  const posters = progressFixture.watched(false)
    .filter(({ show }) => id !== 2 && (id === 3 || [1388, 60300].includes(show.id)))
    .map(({ show }) => ({ title: show.title, image: show.poster }));
  if (id === 3) return { href: '/users/morbus/watchlist', name: 'Watchlist', owner: owner('morbus', 'Morbus Iff'), posters };
  const slug = id === 1 ? 'prestige-tv' : 'someday';
  return { href: `/users/demo/lists/${slug}`, name: id === 1 ? 'Prestige TV' : 'Someday', owner: owner('demo', 'Demo User'), posters };
}
const listRow = $derived(
  listId === undefined
    ? undefined
    : new Promise<ProgressListRow | null>((resolve) => setTimeout(() => resolve(sampleRow(listId)), WAIT)),
);
const data = $derived({
  type,
  sort: { by: 'added', how: 'asc' as const, supported: true },
  hide: hideCompleted ? ['completed' as const] : [],
  grid: view === 'grid',
  simple: view === 'simple',
  includeWatchlisted: page.url.searchParams.has('watchlisted'),
  terms: '',
  list,
  listRow,
  page: 1,
  options: { includeSpecials: false, useLastActivity: false },
  datePreferences,
  profile,
  user: page.data.user,
});
</script>

<!-- The variants only change this page's query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Progress list" bleed
  note="Open a row's seasons to see them shimmer while they load. Loading holds the shimmering rows; the list variants show them under the band naming the list, then the filtered rows or the empty list.">
  <nav class="variants" aria-label="Progress variants">
    {#each variants as variant (variant.label)}
      <a href="{page.url.pathname}{variant.query}" aria-current={page.url.search === variant.query ? 'page' : undefined}>
        {variant.label}
      </a>
    {/each}
  </nav>
  {#if hideCompleted}
    <p class="finish">
      <button type="button" disabled={finished.has(1388)} onclick={() => finish(1388)}>Finish Breaking Bad</button>
    </p>
  {/if}
  <ProgressList {data} items={pending ? null : items} {listed} {loading} {reloading} onneed={need} {now} />
</Specimen>

<style>
.variants,
.finish {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
  padding: 0 var(--design-canvas-padding) var(--gutter);

  & :is(a, button) {
    padding: var(--space-xs-block) var(--space-base-inline);
    border: 0;
    border-radius: var(--radius-round);
    background: none;
    box-shadow: inset 0 0 0 1px var(--color-link-button-line);
    color: inherit;
    font-family: var(--font-headings);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background-color: var(--color-link-button-hover);
    }

    &[aria-current='page'] {
      background-color: var(--brand-primary);
      box-shadow: none;
      color: var(--color-text-inverse);
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
}

.finish {
  margin: 0;
}
</style>
