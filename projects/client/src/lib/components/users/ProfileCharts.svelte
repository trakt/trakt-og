<!--
  The profile's charts: Most Watched Genres, then Ratings with its
  help line and bar chart. With no ratings, OG kept the heading and a zero help line and hid the chart.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import heart from '$lib/icons/regular/heart.svg?raw';
import masksTheater from '$lib/icons/regular/masks-theater.svg?raw';
import type { GenreBar } from '$lib/users/profile/toGenreBar';
import type { RatingsChart as Ratings } from '$lib/users/profile/toRatingsChart';
import GenreBand from './GenreBand.svelte';
import RatingsChart from './RatingsChart.svelte';

const { genres, ratings, slug }: { genres: readonly GenreBar[]; ratings: Ratings; slug: string } = $props();
const id = $props.id();
</script>

<section class="charts" aria-labelledby="{id}-genres">
  <Container>
    <h2 id="{id}-genres" class="first"><HeadingMark svg={masksTheater} />Most Watched Genres</h2>
    <div class="block"><GenreBand {genres} /></div>
    <h2><HeadingMark svg={heart} />Ratings</h2>
    <p class="help"><b>{ratings.count}</b> ratings with an average of <b>{ratings.average}</b> hearts.</p>
    {#if ratings.bars.length > 0}
      <div class="block"><RatingsChart bars={ratings.bars} {slug} /></div>
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
