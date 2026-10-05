<script lang="ts">
import DashboardGreeting from '$lib/components/dashboard/DashboardGreeting.svelte';
import DashboardStats from '$lib/components/dashboard/DashboardStats.svelte';
import DashboardInbox from '$lib/components/dashboard/DashboardInbox.svelte';
import DashboardNotices from '$lib/components/dashboard/DashboardNotices.svelte';
import Container from '$lib/components/container/Container.svelte';
import { dashboardFrameFixture as sample } from '$lib/dashboard/dashboardFrameFixture';
import { toStatsBand } from '$lib/dashboard/toStatsBand';
import { dayIn } from '$lib/calendars/calendarDays';

let theme = $state('light');
const loading = { episodes: undefined, shows: undefined, movies: undefined };
const bands = [
  { id: 'heavy', band: toStatsBand(sample.stats, sample.collected) },
  { id: 'loading', band: toStatsBand(sample.stats, loading) },
  { id: 'new', band: toStatsBand(sample.newStats, { episodes: 0, shows: 0, movies: 0 }) },
];
$effect(() => {
  document.documentElement.dataset.theme = theme;
  return () => delete document.documentElement.dataset.theme;
});
</script>

<svelte:head>
  <title>Dashboard frame: og</title>
</svelte:head>

<main>
  {#each bands as { id, band } (id)}
    <div id="band-{id}">
      <DashboardGreeting user={sample.user} memberSince="Aug 20, 2020 12:23 PM" watching={null}>
        {#snippet stats()}<DashboardStats {band} slug="og_tester" />{/snippet}
      </DashboardGreeting>
    </div>
  {/each}
  <DashboardNotices notices={{ welcome: true, anniversary: '6th', additionalLists: 6 }}
    day={dayIn(new Date().toISOString(), 'UTC')} />
  <DashboardInbox requests={sample.requests.slice(0, 2)} />
  <DashboardInbox requests={sample.requests} />
  <Container>
    <h2>Dashboard frame components</h2>
    <p>Fake data for the greeting and its all-time band (a heavy user, the library still loading, a new member), Traktiversary banner, dismissible account welcome and follow requests: two as boxes, then six folded into the summary line.</p>
    <label>Theme <select bind:value={theme}><option value="light">Light</option><option value="dark">Dark</option></select></label>
  </Container>
</main>
