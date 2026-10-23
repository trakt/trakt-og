<script lang="ts">
import WatchedKeys from '$lib/components/dashboard/WatchedKeys.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
import { toExternalRatings } from '$lib/components/summary/toExternalRatings';
import ProfileRatingsChart from '$lib/components/users/ProfileRatingsChart.svelte';
import globe from '$lib/icons/regular/globe.svg?raw';
import heart from '$lib/icons/regular/heart.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import CommunityStats from '$lib/stats/CommunityStats.svelte';
import RollingNumber from '$lib/components/stats/RollingNumber.svelte';
import SiteScores from '$lib/stats/SiteScores.svelte';
import StatsSection from '$lib/stats/StatsSection.svelte';
import { toCommunityStats } from '$lib/stats/toCommunityStats';
import { toSiteScores } from '$lib/stats/toSiteScores';
import { toProfileRatings } from '$lib/users/profile/toProfileRatings';

const ratings = toProfileRatings({
  distribution: { 1: 180, 2: 150, 3: 230, 4: 590, 5: 1280, 6: 3650, 7: 4371, 8: 3830, 9: 1230, 10: 2465 },
  unit: 'vote',
});
const community = toCommunityStats({
  stats: { watchers: 89_734, plays: 109_418, collectors: 228_960, comments: 88, lists: 24_193, favorited: 781 },
  href: '/movies/tron-legacy-2010',
  favorites: true,
  released: true,
});
const sites = toSiteScores({
  external: toExternalRatings({
    ratings: {
      imdb: { rating: 6.8, votes: 391_204, link: 'https://www.imdb.com/title/tt1104001' },
      tmdb: { rating: 6.5, votes: 8_912, link: 'https://www.themoviedb.org/movie/20526' },
      rotten_tomatoes: {
        rating: 51,
        state: 'rotten',
        user_rating: 64,
        user_state: 'upright',
        link: 'https://www.rottentomatoes.com/m/tron_legacy',
      },
      metascore: { rating: 49, link: 'https://www.metacritic.com/movie/tron-legacy' },
      letterboxd: { rating: 3.1, votes: 214_557, link: 'https://letterboxd.com/film/tron-legacy' },
    },
  }),
  trakt: 71,
});
</script>

<DemoSection title="Trakt ratings" note="The distribution of votes, with the keys under it.">
  <StatsSection id="trakt" title="Trakt" icon={heart}>
    {#if ratings.chart}
      <div class="chart"><ProfileRatingsChart chart={ratings.chart} /></div>
      <WatchedKeys keys={ratings.keys} />
    {/if}
  </StatsSection>
</DemoSection>

<DemoSection title="Community">
  <StatsSection id="community" title="Community" icon={userGroup}>
    <CommunityStats tiles={community} />
  </StatsSection>
</DemoSection>

<DemoSection title="Second opinions" note="Every other site's score beside Trakt's.">
  <StatsSection id="second-opinions" title="Second Opinions" icon={globe}>
    <SiteScores trakt={{ percent: 71, votes: 17_976 }} {sites} />
  </StatsSection>
</DemoSection>

<DemoSection title="Rolling number" note="Rolls up to its value as it comes into view.">
  <p class="rolling">
    <RollingNumber value={12} /> people · <RollingNumber value={150_660} /> episodes ·
    <RollingNumber value={13_626} /> movies
  </p>
</DemoSection>

<style>
.rolling {
  font-size: var(--font-size-about-stat);
  font-weight: var(--font-weight-headings-heavy);
}

.chart {
  --color-ratings-chart-bg: var(--color-surface);
  padding-block-end: var(--space-ratings-keys);
}
</style>
