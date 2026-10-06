<!--
  The profile's charts: Most Watched Genres, then Ratings with its bar chart and the keys under it (the total by
  type, the average, the most given rating and the share of 9s and 10s), which take the place of OG's help line.
  With no ratings, OG kept the heading and a zero help line and hid the chart; og does the same.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import heart from '$lib/icons/regular/heart.svg?raw';
import masksTheater from '$lib/icons/regular/masks-theater.svg?raw';
import type { GenreBar } from '$lib/users/profile/toGenreBar';
import type { ProfileRatings } from '$lib/users/profile/toProfileRatings';
import WatchedKeys from '$lib/components/dashboard/WatchedKeys.svelte';
import GenreBand from './GenreBand.svelte';
import ProfileRatingsChart from './ProfileRatingsChart.svelte';

const { genres, ratings, slug }: { genres: readonly GenreBar[]; ratings: ProfileRatings; slug: string } = $props();
const id = $props.id();
</script>

<section class="charts" aria-labelledby="{id}-genres">
  <Container>
    <h2 id="{id}-genres" class="first"><HeadingMark svg={masksTheater} />Most Watched Genres</h2>
    <div class="block"><GenreBand {genres} /></div>
    <h2><HeadingMark svg={heart} />Ratings</h2>
    {#if ratings.chart}
      <div class="ratings"><ProfileRatingsChart chart={ratings.chart} {slug} /></div>
      <div class="block"><WatchedKeys keys={ratings.keys} /></div>
    {:else}
      <p class="help"><b>{ratings.count}</b> ratings with an average of <b>{ratings.average}</b> hearts.</p>
    {/if}
  </Container>
</section>

<style>
.charts {
  /* Holds the first heading's margin inside the background, like the clearfix on OG's container. */
  display: flow-root;
  padding-block-end: var(--space-lg-block);
  background-color: var(--color-charts-bg);
}

h2 {
  position: relative;
  isolation: isolate;
}

/* OG's `h2.section`. */
.first {
  margin-block: var(--space-heading-section);
}

/* OG's `#charts-wrapper .row > div`. */
.block {
  padding-block-end: var(--gutter);
}

/* The ratings chart, apart from its keys. */
.ratings {
  padding-block-end: var(--space-ratings-keys);
}

.help {
  margin: 1px 0 var(--gutter);
  color: var(--color-help-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);
  font-size: var(--font-size-help-text);
  line-height: var(--line-height-headings);

  & b {
    font-weight: var(--font-weight-headings);
  }
}
</style>
