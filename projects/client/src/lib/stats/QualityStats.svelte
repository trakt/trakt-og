<!--
  The Quality chart with the viewer's own ratings and the other sites' joined in. You comes from the overlay's
  ratings, so it costs no request and shows only once the viewer has rated a season or episode of it. IMDb and TMDB
  are a season page's, one read per episode that waits for the first time either chip is switched on and is kept for
  as long as the page shows this chart, so a second switch costs nothing. Its highlight keys sit under it, as the
  Trakt Ratings keys: best and lowest, the biggest drop, and the viewer's average once they've rated some.
    <QualityStats quality={data.quality} sites={{ show: 'game-of-thrones', season: 8 }} />
-->
<script lang="ts">
import QualityChart from '#lib/components/stats/QualityChart.svelte';
import WatchedKeys from '#lib/components/dashboard/WatchedKeys.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import { fetchEpisodeSiteRatings } from './fetchEpisodeSiteRatings.ts';
import type { QualityData } from './QualityData.ts';
import { toQualityHighlights } from './toQualityHighlights.ts';

interface Props {
  quality: QualityData;
  /** Which season's episodes to read the other sites' ratings for; left out where the viewer hides them. */
  sites?: { show: string; season: number };
}

const { quality, sites }: Props = $props();

const you = $derived.by(() => {
  const rated = quality.points.map(({ traktId }) => overlay.state(quality.unit, traktId).rating);
  return rated.some(Boolean) ? rated.map((rating) => (rating ? rating * 10 : null)) : undefined;
});

const highlights = $derived(toQualityHighlights({ data: quality, you }));

let siteRatings = $state.raw<Awaited<ReturnType<typeof fetchEpisodeSiteRatings>>>();
let loading = $state(false);
let requested = false;

async function loadSites() {
  if (!sites || requested) return;
  requested = true;
  loading = true;
  siteRatings = await fetchEpisodeSiteRatings({
    show: sites.show,
    season: sites.season,
    episodes: quality.points.map(({ number }) => number),
  });
  loading = false;
}
</script>

<QualityChart
  data={quality}
  {you}
  imdb={siteRatings?.imdb}
  tmdb={siteRatings?.tmdb}
  sites={Boolean(sites)}
  {loading}
  onsites={loadSites}
/>
{#if highlights.length > 0}
  <div class="highlights"><WatchedKeys keys={highlights} /></div>
{/if}

<style>
.highlights {
  margin-block-start: var(--space-ratings-keys);
}
</style>
