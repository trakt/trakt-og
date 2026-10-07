<!--
  `/users/:id/progress(/:type)(/:sort_by/:sort_how)`, your own progress. Every show you've started comes from the
  endpoint v3's progress page reads, `/sync/progress/up_next_nitro` (`loadNitroProgress`, 100 a page, about five
  requests for 440 shows), with its poster, aired count and next and last episodes; the watched counts, plays and
  times come from the overlay's watches, which the whole app already loads. The whole list loads so the
  sorts, hide toggles, title search, list filter and totals all work in the browser. It's kept for 30 minutes, like
  v3, across tabs and pages, and read again once a watch, rewatch or drop changes the overlay. The overlay narrows it
  to a tab (dropped, rewatching and hidden shows); the Dropped tab reads `/users/hidden/dropped` only for dropped
  shows the endpoint leaves out. Opening a row's seasons reads that show's catalog once (cached for 12 hours).
-->
<script lang="ts" module>
import type { ProgressItem } from './ProgressItem.ts';

/** v3's `staleTime` for progress. */
const FRESH_FOR = 30 * 60_000;
let cached: { slug: string; items: readonly ProgressItem[]; at: number } | null = null;
</script>

<script lang="ts">
import { untrack } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { api } from '$lib/api/api';
import { apiQueue } from '$lib/api/apiQueue';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import { toast } from '$lib/components/toast/toast.svelte';
import { fetchListItemRefs } from '$lib/lists/fetchListItemRefs';
import { overlay } from '$lib/overlay/overlay';
import type { CachedShow } from '$lib/shows/cache/CachedShow';
import { loadShowCatalog } from '$lib/shows/cache/loadShowCatalog';
import { showCache } from '$lib/shows/cache/showCache';
import type { ShowCatalog } from '$lib/shows/cache/ShowCatalog';
import type { ProfileUser } from '$lib/users/ProfileUser';
import { loadDroppedShows } from './loadDroppedShows.ts';
import { loadNitroProgress } from './loadNitroProgress.ts';
import type { loadProgress } from './loadProgress.ts';
import ProgressList from './ProgressList.svelte';
import { toProgressItems } from './toProgressItems.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadProgress>> & { profile: ProfileUser; user: HeaderUser | null };
};

const { data }: Props = $props();

const now = Date.now();
const fetch = () => authenticatedFetch({ manager: userManager() });
/** The typed client, its requests through the shared queue. */
const client = () => {
  const signedIn = fetch();
  return api({ fetch: (input, init) => apiQueue.run(() => signedIn(input, init)) });
};

const slices = $derived(overlay.slices());
const fresh = untrack(() => cached?.slug === data.profile.slug && Date.now() - cached.at < FRESH_FOR);
let nitro = $state.raw<readonly ProgressItem[] | null>(fresh ? cached?.items ?? null : null);
let droppedShows = $state.raw<ReadonlyMap<number, CachedShow> | undefined>();
const catalogs = new SvelteMap<number, ShowCatalog>();
const loading = new SvelteSet<number>();

/** Every page. A failure keeps what's on screen. */
async function readProgress() {
  const slug = data.profile.slug;
  try {
    const items = await loadNitroProgress({
      request: (page, limit) =>
        client().sync.progress.upNext.nitro({ query: { page, limit, intent: 'all' } }).then((response) =>
          response.status === 200
            ? { ok: true as const, body: response.body, headers: response.headers }
            : { ok: false as const, status: response.status }
        ),
    });
    cached = { slug, items, at: Date.now() };
    nitro = items;
  } catch {
    toast.error('Doh! There was an error loading your progress.');
    nitro ??= [];
  }
}

if (!fresh) void readProgress();

// A watch, rewatch or drop saved anywhere patches these slices: read the progress again, once it's first in.
let seen: readonly unknown[] | null = null;
$effect(() => {
  const marks = [slices.watchedShows, slices.rewatching, slices.dropped];
  untrack(() => {
    if (nitro === null || marks.some((mark) => mark === undefined)) return;
    const changed = seen !== null && marks.some((mark, index) => mark !== seen?.[index]);
    seen = marks;
    if (changed) void readProgress();
  });
});

// The Dropped tab: summaries for any dropped show the endpoint left out, read once.
$effect(() => {
  const dropped = slices.dropped;
  if (data.type !== 'dropped' || !nitro || !dropped || droppedShows) return;
  const listed = new Set(nitro.map(({ show }) => show.id));
  if (![...dropped.keys()].some((id) => !listed.has(id))) return;
  untrack(() => {
    droppedShows = new Map();
    void loadDroppedShows({
      request: (page, limit) =>
        client().users.hidden.dropped({ query: { page, limit, extended: 'full,images' } }).then((response) =>
          response.status === 200
            ? { ok: true as const, body: response.body, headers: response.headers }
            : { ok: false as const, status: response.status }
        ),
    })
      .then((shows) => (droppedShows = shows))
      .catch(() => toast.error("Doh! We couldn't load your dropped shows."));
  });
});

const items = $derived(
  nitro
    ? toProgressItems({ type: data.type, nitro, droppedShows, slices, catalogs, options: data.options, now })
    : null,
);

// `?list=`: the list's shows, read once.
let listed = $state.raw<ReadonlySet<number> | null>(null);
$effect(() => {
  const list = data.list;
  if (list === undefined) return;
  listed = null;
  void fetchListItemRefs({
    fetch: fetch(),
    base: `/lists/${list}/items`,
    query: { types: ['show'], genres: [] },
    sort: { by: 'rank', how: 'asc' },
  })
    .then((refs) => (listed = new Set(refs.map(({ trakt }) => trakt))))
    .catch(() => {
      listed = new Set();
      toast.error("Doh! We couldn't load that list.");
    });
});

/** Reads a row's catalog once, as its seasons open. */
async function need(id: number) {
  if (catalogs.has(id) || loading.has(id)) return;
  loading.add(id);
  try {
    catalogs.set(id, await loadShowCatalog({ id, store: showCache.catalogs, get: showCache.get }));
  } catch {
    toast.error("Doh! We couldn't load this show's seasons.");
  } finally {
    loading.delete(id);
  }
}
</script>

<ProgressList {data} {items} {listed} {loading} onneed={need} />
