<!--
  `/users/:id/progress/franchises`, your own franchise progress. The catalog of official franchise collections comes
  from the browser (`loadFranchises`: the official lists with their item ids, kept here for a day), and the movies you've
  watched are the overlay's, so a watch anywhere moves a row on its own. Each row reads its own movies as it nears the
  screen (`FranchiseList.svelte`).
-->
<script lang="ts">
import { browser } from '$app/env';
import { viewerFetch } from '#lib/auth/viewerFetch.ts';
import { isApiRateLimited } from '#lib/api/isApiRateLimited.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import type { loadProgress } from '../loadProgress.ts';
import type { Franchise } from './Franchise.ts';
import { franchiseCatalogStore } from './franchiseCatalogStore.ts';
import FranchiseList from './FranchiseList.svelte';
import { fetchFranchisePage } from './fetchFranchisePage.ts';
import { loadFranchises } from './loadFranchises.ts';
import { loadListMovieIds } from '../loadListShows.ts';
import { listHasType } from '../readListRows.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadProgress>> & { profile: ProfileUser; user: HeaderUser | null };
};

const { data }: Props = $props();

let franchises = $state.raw<readonly Franchise[] | null>(null);
let failure = $state<{ readonly error: unknown } | null>(null);

async function read() {
  failure = null;
  try {
    franchises = await loadFranchises({ store: franchiseCatalogStore(), request: fetchFranchisePage });
  } catch (error) {
    toast.error(
      isApiRateLimited(error)
        ? "Doh! Trakt's API is rate limiting your requests. Please try again later."
        : 'Doh! There was an error loading your franchises.',
    );
    failure = { error };
  }
}

// Only in the browser: the catalog is read there, and a failure on the server would toast into every request.
if (browser) void read();

// `?list=`: the list's movie ids, read once, so only the franchises with a movie on it show. Null while they load.
let listed = $state.raw<ReadonlySet<number> | null>(null);
// Whether the list holds shows too, read alongside its movies: the band's View shows, and an empty tab's way across.
let listHasShows = $state(false);
// A list that read fine with no movies at all: whether it has shows to send you to.
let listWithoutMovies = $state<'shows' | 'none'>();
$effect(() => {
  const base = data.list;
  listed = null;
  listHasShows = false;
  listWithoutMovies = undefined;
  if (base === undefined) return;
  let current = true;
  void Promise.all([
    loadListMovieIds({ fetch: viewerFetch(), base }),
    listHasType({ fetch: viewerFetch(), base, type: 'show' }).catch(() => false),
  ])
    .then(([ids, shows]) => {
      if (!current) return;
      listHasShows = shows;
      if (ids.size === 0) listWithoutMovies = shows ? 'shows' : 'none';
      listed = ids;
    })
    .catch(() => {
      if (!current) return;
      listed = new Set();
      toast.error("Doh! We couldn't load that list.");
    });
  return () => {
    current = false;
  };
});
</script>

<FranchiseList
  data={{ ...data, sort: data.franchiseSort }}
  {franchises}
  listed={data.list === undefined ? undefined : listed}
  {listWithoutMovies}
  {listHasShows}
  onretry={failure ? read : undefined}
  error={failure?.error}
/>
