<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import WatchedKeys from '$lib/components/dashboard/WatchedKeys.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import { toExternalRatings } from '$lib/components/summary/toExternalRatings';
import ProfileRatingsChart from '$lib/components/users/ProfileRatingsChart.svelte';
import globe from '$lib/icons/regular/globe.svg?raw';
import heart from '$lib/icons/regular/heart.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import CommunityStats from '$lib/stats/CommunityStats.svelte';
import SiteScores from '$lib/stats/SiteScores.svelte';
import StatsSection from '$lib/stats/StatsSection.svelte';
import { toCommunityStats } from '$lib/stats/toCommunityStats';
import { toSiteScores } from '$lib/stats/toSiteScores';
import { toProfileRatings } from '$lib/users/profile/toProfileRatings';
import type { Snippet } from 'svelte';

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
const animeSites = toSiteScores({
  external: toExternalRatings({
    ratings: {
      imdb: { rating: 8.6, votes: 953_366, link: 'https://www.imdb.com/title/tt0245429' },
      tmdb: { rating: 8.5, votes: 19_134, link: 'https://www.themoviedb.org/movie/129' },
      rotten_tomatoes: {
        rating: 96,
        state: 'certified',
        user_rating: 96,
        user_state: 'upright',
        link: 'https://www.rottentomatoes.com/m/spirited_away',
      },
      metascore: { rating: 96, link: 'https://www.imdb.com/title/tt0245429/criticreviews' },
      letterboxd: { rating: 4.45, votes: 3_177_150, link: 'https://letterboxd.com/film/spirited-away' },
      mal: { rating: 8.77, votes: 1_398_228, link: 'https://myanimelist.net/anime/199' },
    },
  }),
  trakt: 87,
});
</script>

{#snippet column(content: Snippet)}
  <Container>
  <div class="column">{@render content()}</div>
</Container>
{/snippet}

{#snippet trakt()}
  <StatsSection id="trakt" title="Trakt" icon={heart} hideHeading>
    {#if ratings.chart}
      <div class="chart"><ProfileRatingsChart chart={ratings.chart} /></div>
      <WatchedKeys keys={ratings.keys} />
    {/if}
  </StatsSection>
{/snippet}

{#snippet communityTiles()}
  <StatsSection id="community" title="Community" icon={userGroup}>
  <CommunityStats tiles={community} />
</StatsSection>
{/snippet}

{#snippet secondOpinions()}
  <StatsSection id="second-opinions" title="Second Opinions" icon={globe}>
  <SiteScores trakt={{ percent: 71, votes: 17_976 }} {sites} />
</StatsSection>
{/snippet}

{#snippet animeOpinions()}
  <StatsSection id="anime-second-opinions" title="Second Opinions" icon={globe}>
  <SiteScores trakt={{ percent: 87, votes: 33_661 }} sites={animeSites} />
</StatsSection>
{/snippet}

<Specimen title="Trakt ratings" bleed
  note="The page opens on the vote chart with its keys under it; its heading is only for screen readers.">
  {@render column(trakt)}
</Specimen>

<Specimen title="Community" bleed note="Favorites, then the counts, each with what it means per watcher.">
  {@render column(communityTiles)}
</Specimen>

<Specimen title="Second opinions" bleed note="Every other site's score beside Trakt's.">
  {@render column(secondOpinions)}
</Specimen>

<Specimen title="Second opinions, anime" bleed note="Anime add MyAnimeList after IMDb and Letterboxd.">
  {@render column(animeOpinions)}
</Specimen>

<style>
/* The stats page's content column, beside where the summary sidebar sits. */
.column {
  margin-inline-start: var(--summary-offset);
  padding-block: var(--gutter) var(--space-stats-section);
}

.chart {
  --color-ratings-chart-bg: var(--color-surface);
  padding-block-end: var(--space-ratings-keys);
}
</style>
