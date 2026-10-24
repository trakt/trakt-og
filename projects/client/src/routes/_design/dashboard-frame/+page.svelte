<script lang="ts">
import DashboardGreeting from '$lib/components/dashboard/DashboardGreeting.svelte';
import RecapRibbon from '$lib/components/dashboard/RecapRibbon.svelte';
import StatsPanel from '$lib/components/dashboard/StatsPanel.svelte';
import { toRecapRibbon } from '$lib/dashboard/toRecapRibbon';
import DashboardInbox from '$lib/components/dashboard/DashboardInbox.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import { dashboardFrameFixture as sample } from '$lib/dashboard/dashboardFrameFixture';
import type { UserStatsResponse } from '@trakt/api';
import { toStatsPanel } from '$lib/dashboard/toStatsPanel';
import { dayIn } from '$lib/utils/dayIn';
import { formatDate } from '$lib/utils/formatDate';
import type { WatchingNow } from '$lib/users/WatchingNow';
import { newMember, nothingWatched, pastTheWall } from './fixtures.ts';

const { data } = $props();

const today = dayIn(new Date().toISOString(), 'UTC');
const month = Number(today.slice(5, 7));
const busy = [1900, 1400, 2200, 1700, 1500, 2000, 2600, 2300, 1834, 1200, 1500, 2100].slice(0, month - 1);
const quietMonths = busy.map(() => 0);
const recapsOf = (plays: number[]) => Promise.resolve(toRecapRibbon({ today, plays, slug: 'og_tester' }));
const isFresh = (stats: Pick<UserStatsResponse, 'movies' | 'episodes'>) =>
  stats.movies.plays + stats.episodes.plays === 0;

// Twelve days ago, at a fixed time so the server and the browser print the same minute.
const joinedAt = `${dayIn(new Date(Date.now() - 12 * 86_400_000).toISOString(), 'UTC')}T20:41:00Z`;
const newSince = $derived(formatDate(joinedAt, { ...data.datePreferences, time: true }));
const memberSince = 'Aug 20, 2020 12:23 PM';

const greetings = $derived([
  {
    label: 'A heavy user',
    user: sample.user,
    since: memberSince,
    stats: sample.stats,
    recaps: recapsOf([...busy, 312]),
  },
  {
    label: 'Stats without progress, recaps still loading',
    user: sample.user,
    since: memberSince,
    stats: { ...sample.stats, progress: null },
    recaps: new Promise<never>(() => {}),
  },
  {
    label: 'Ten titles watched, just past the welcome wall',
    user: newMember,
    since: newSince,
    stats: pastTheWall,
    recaps: recapsOf([...quietMonths, pastTheWall.total_plays]),
  },
  {
    label: 'Nothing watched yet, after skipping the welcome wall',
    user: newMember,
    since: newSince,
    stats: nothingWatched,
    recaps: recapsOf([...quietMonths, 0]),
  },
]);

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
  fanartUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg.webp',
  stillUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/medium/a049f455c1.jpg.webp',
  endsAt: new Date(Date.now() + 31 * 60_000).toISOString(),
  runtime: 60,
};
const inboxes = [
  { label: 'One request', requests: sample.requests.slice(0, 1) },
  { label: 'Three, the most that show as boxes', requests: sample.requests.slice(0, 3) },
  { label: 'Six, folded into the summary line', requests: sample.requests },
];
</script>

<Specimen title="Greeting and recap ribbon" bleed
  note="Each greeting carries its stats panel. With nothing watched, each stat names its first milestone instead.">
  <div class="states">
    {#each greetings as { label, user, since, stats, recaps } (label)}
      <Variant {label}>
        <div>
          <DashboardGreeting {user} memberSince={since} watching={null}>
            <StatsPanel panel={toStatsPanel(stats)} slug={user.slug} fresh={isFresh(stats)} />
          </DashboardGreeting>
          <RecapRibbon {recaps} />
        </div>
      </Variant>
    {/each}
  </div>
</Specimen>

<Specimen title="Recaps in January" bleed note="In January the strip shows last year under its Year in Review.">
  <RecapRibbon recaps={january} />
</Specimen>

<Specimen title="Checked in" bleed note="The greeting while you're checked in to an episode.">
  <DashboardGreeting user={sample.user} {memberSince} {watching}>
    <StatsPanel panel={toStatsPanel(sample.stats)} slug={sample.user.slug} />
  </DashboardGreeting>
</Specimen>

<Specimen title="Follow requests" bleed note="Approve, Deny and Block answer on this page only. Review opens the six.">
  <div class="states">
    {#each inboxes as { label, requests } (label)}
      <Variant {label}>
        <DashboardInbox {requests} />
      </Variant>
    {/each}
  </div>
</Specimen>

<style>
.states {
  display: grid;
  gap: var(--gutter);
  padding-block: var(--gutter);

  & :global(figcaption) {
    padding-inline: var(--design-canvas-padding);
  }
}
</style>
