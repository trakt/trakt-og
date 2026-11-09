<!--
  `/users/:id/progress/franchises`, your own franchise progress. The catalog of official franchise collections comes
  from the browser (`loadFranchises`: the official lists with their item ids, kept here for a day), and the movies you've
  watched are the overlay's, so a watch anywhere moves a row on its own. Each row reads its own movies as it nears the
  screen (`FranchiseList.svelte`).
-->
<script lang="ts">
import { browser } from '$app/env';
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
</script>

<FranchiseList
  data={{ ...data, sort: data.franchiseSort }}
  {franchises}
  onretry={failure ? read : undefined}
  error={failure?.error}
/>
