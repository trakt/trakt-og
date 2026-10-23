<script lang="ts">
import WatchedKeys from '$lib/components/dashboard/WatchedKeys.svelte';
import Container from '$lib/components/container/Container.svelte';
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

<svelte:head>
  <title>Media stats - Trakt</title>
</svelte:head>
<div class="demo">
  <Container>
    <StatsSection id="trakt" title="Trakt" icon={heart}>
      {#if ratings.chart}
        <div class="chart"><ProfileRatingsChart chart={ratings.chart} /></div>
        <WatchedKeys keys={ratings.keys} />
      {/if}
    </StatsSection>
    <StatsSection id="community" title="Community" icon={userGroup}>
      <CommunityStats tiles={community} />
    </StatsSection>
    <h2>Rolling number</h2>
    <p class="rolling">
      <RollingNumber value={12} /> people · <RollingNumber value={150_660} /> episodes ·
      <RollingNumber value={13_626} /> movies
    </p>
    <StatsSection id="second-opinions" title="Second Opinions" icon={globe}>
      <SiteScores trakt={{ percent: 71, votes: 17_976 }} {sites} />
    </StatsSection>
  </Container>
</div>

<style>
.demo {
  padding-block: calc(var(--header-height) + var(--gutter)) var(--gutter);
  background-color: var(--color-surface);
}

.rolling {
  font-size: var(--font-size-about-stat);
  font-weight: var(--font-weight-headings-heavy);
}

.chart {
  --color-ratings-chart-bg: var(--color-surface);
  padding-block-end: var(--space-ratings-keys);
}
</style>
