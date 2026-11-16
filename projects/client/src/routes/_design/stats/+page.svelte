<script lang="ts">
import Container from '#lib/components/container/Container.svelte';
import WatchedKeys from '#lib/components/dashboard/WatchedKeys.svelte';
import DemoChoice from '#lib/design/DemoChoice.svelte';
import DemoToggle from '#lib/design/DemoToggle.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import QualityChart from '#lib/components/stats/QualityChart.svelte';
import { toExternalRatings } from '#lib/components/summary/toExternalRatings.ts';
import ProfileRatingsChart from '#lib/components/users/ProfileRatingsChart.svelte';
import chartSimple from '#lib/icons/regular/chart-simple.svg?raw';
import globe from '#lib/icons/regular/globe.svg?raw';
import heart from '#lib/icons/regular/heart.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import CommunityStats from '#lib/stats/CommunityStats.svelte';
import SiteScores from '#lib/stats/SiteScores.svelte';
import StatsSection from '#lib/stats/StatsSection.svelte';
import { toCommunityStats } from '#lib/stats/toCommunityStats.ts';
import { toSiteScores } from '#lib/stats/toSiteScores.ts';
import { toProfileRatings } from '#lib/users/profile/toProfileRatings.ts';
import { gapChart, seasonChart, seasonImdb, seasonTmdb, seasonYou, showChart, showYou } from './qualityFixtures.ts';
import type { Snippet } from 'svelte';

type Viewer = 'guest' | 'member';

let viewer = $state<Viewer>('member');
let sitesLoading = $state(false);

const ratings = toProfileRatings({
  distribution: { 1: 180, 2: 150, 3: 230, 4: 590, 5: 1280, 6: 3650, 7: 4371, 8: 3830, 9: 1230, 10: 2465 },
  unit: 'vote',
});
const community = toCommunityStats({
  stats: { watchers: 89_734, plays: 109_418, comments: 88, lists: 24_193, favorited: 781 },
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
  {#if ratings.chart}
    <StatsSection id="trakt" title="Trakt Ratings" icon={heart}>
      <div class="chart"><ProfileRatingsChart chart={ratings.chart} /></div>
      <WatchedKeys keys={ratings.keys} />
    </StatsSection>
  {/if}
{/snippet}

{#snippet communityTiles()}
  <StatsSection id="community" title="Community" icon={userGroup}>
  <CommunityStats tiles={community} />
</StatsSection>
{/snippet}

{#snippet showQuality()}
  <StatsSection id="quality-seasons" title="Quality Over Time" icon={chartSimple}>
    {#if showChart}<QualityChart data={showChart} you={viewer === 'member' ? showYou : undefined} />{/if}
  </StatsSection>
{/snippet}

{#snippet seasonQuality()}
  <StatsSection id="quality-episodes" title="Quality Over Time" icon={chartSimple}>
    {#if seasonChart}
      <QualityChart data={seasonChart} you={viewer === 'member' ? seasonYou : undefined} sites
        loading={sitesLoading} imdb={sitesLoading ? undefined : seasonImdb} tmdb={sitesLoading ? undefined : seasonTmdb} />
    {/if}
  </StatsSection>
{/snippet}

{#snippet gapQuality()}
  <StatsSection id="quality-gaps" title="Quality" icon={chartSimple}>
    {#if gapChart}<QualityChart data={gapChart} />{/if}
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

<Specimen title="Community" bleed note="Favorites, then the counts, each with what it means per watcher.">
  {@render column(communityTiles)}
</Specimen>

<Specimen title="Trakt ratings" bleed
  note="The vote chart under its Trakt Ratings heading, after Community, with its keys under it. A title with no votes leaves the section out.">
  {@render column(trakt)}
</Specimen>

<Specimen title="Quality, by season" bleed
  note="A show's stats page: a point per aired season, red for Trakt. You joins once the viewer has rated a season, and the Scale dropdown starts Zoomed, the bottom at the nearest 10 under the lowest line, with 0 to 100% one pick away. Hover a column for the season's tooltip, with your own rating as a heart and its 1 to 10, or click it to open that season's stats.">
  <div class="knob">
    <DemoChoice label="Viewer" bind:value={viewer} options={[{ value: 'guest', label: 'Guest' }, { value: 'member', label: 'Member' }]} />
  </div>
  {@render column(showQuality)}
</Specimen>

<Specimen title="Quality, by episode" bleed
  note="A season's stats page: a point per aired episode, the season's own rating a dashed line. IMDb and TMDB start off; switching either on loads them, and its chip is busy until they land.">
  <div class="knob">
    <DemoChoice label="Viewer" bind:value={viewer} options={[{ value: 'guest', label: 'Guest' }, { value: 'member', label: 'Member' }]} />
    <DemoToggle bind:checked={sitesLoading}>Sites loading</DemoToggle>
  </div>
  {@render column(seasonQuality)}
</Specimen>

<Specimen title="Quality, too few votes" bleed
  note="A season or episode under 10 votes has no percent: the line breaks there, a lone point keeps its dot, and the tooltip says too few votes.">
  {@render column(gapQuality)}
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

.knob {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
  padding: var(--space-sm-block) var(--design-canvas-padding);
}

.chart {
  --color-ratings-chart-bg: var(--color-surface);
  padding-block-end: var(--space-ratings-keys);
}
</style>
