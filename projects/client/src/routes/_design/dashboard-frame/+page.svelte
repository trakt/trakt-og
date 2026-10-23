<script lang="ts">
import DashboardGreeting from '$lib/components/dashboard/DashboardGreeting.svelte';
import RecapRibbon from '$lib/components/dashboard/RecapRibbon.svelte';
import StatsPanel from '$lib/components/dashboard/StatsPanel.svelte';
import { toRecapRibbon } from '$lib/dashboard/toRecapRibbon';
import DashboardInbox from '$lib/components/dashboard/DashboardInbox.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
import { dashboardFrameFixture as sample } from '$lib/dashboard/dashboardFrameFixture';
import { toStatsPanel } from '$lib/dashboard/toStatsPanel';
import { dayIn } from '$lib/utils/dayIn';
import type { WatchingNow } from '$lib/users/WatchingNow';

const today = dayIn(new Date().toISOString(), 'UTC');
const month = Number(today.slice(5, 7));
const busy = [1900, 1400, 2200, 1700, 1500, 2000, 2600, 2300, 1834, 1200, 1500, 2100].slice(0, month - 1);
const recapsOf = (plays: number[]) => Promise.resolve(toRecapRibbon({ today, plays, slug: 'og_tester' }));
const greetings = [
  { id: 'heavy', panel: toStatsPanel(sample.stats), recaps: recapsOf([...busy, 312]) },
  { id: 'loading', panel: toStatsPanel({ ...sample.stats, progress: null }), recaps: new Promise<never>(() => {}) },
  {
    id: 'new',
    panel: toStatsPanel(sample.newStats),
    recaps: recapsOf([...busy.map(() => 0), 4]),
  },
];
// In January the strip shows last year under its Year in Review.
const january = Promise.resolve(toRecapRibbon({
  today: '2027-01-05',
  plays: [1900, 1400, 2200, 1700, 1500, 2000, 2600, 2300, 1834, 1200, 1500, 2100],
  slug: 'og_tester',
}));
const watching: WatchingNow = {
  action: 'checkin',
  title: 'The Boys',
  episode: { number: '1x05', title: 'Good for the Soul' },
  href: '/shows/the-boys-2019/seasons/1/episodes/5',
  fanartUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg',
  stillUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/medium/a049f455c1.jpg',
  endsAt: new Date(Date.now() + 31 * 60_000).toISOString(),
  runtime: 60,
};
</script>

<DemoSection title="Greeting and recap ribbon" bleed
  note="A heavy user; stats without progress with the recaps still loading; a new member. Each greeting carries its stats panel.">
  {#each greetings as { id, panel, recaps } (id)}
    <div id="band-{id}">
      <DashboardGreeting user={sample.user} memberSince="Aug 20, 2020 12:23 PM" watching={null}>
        <StatsPanel {panel} slug="og_tester" />
      </DashboardGreeting>
      <RecapRibbon {recaps} />
    </div>
  {/each}
</DemoSection>

<DemoSection title="Recaps in January" bleed note="In January the strip shows last year under its Year in Review.">
  <div id="january">
    <RecapRibbon recaps={january} />
  </div>
</DemoSection>

<DemoSection title="Checked in" bleed note="The greeting while you're checked in to an episode.">
  <div id="watching">
    <DashboardGreeting user={sample.user} memberSince="Aug 20, 2020 12:23 PM" {watching}>
      <StatsPanel panel={toStatsPanel(sample.stats)} slug="og_tester" />
    </DashboardGreeting>
  </div>
</DemoSection>

<DemoSection title="Follow requests" bleed note="Two as boxes, then six folded into the summary line.">
  <DashboardInbox requests={sample.requests.slice(0, 2)} />
  <DashboardInbox requests={sample.requests} />
</DemoSection>
