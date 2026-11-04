<!--
  The line under a poster's title for a site sort (IMDb, TMDB, Rotten Tomatoes, Metacritic), drawn like the Trakt rating
  line with the site's logo for the heart: the score in bold, then its votes where the site gives any. It reads the item's ratings once the poster nears the screen, shimmering until
  then, and stays blank when the site has no score for it.
-->
<script lang="ts">
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { externalRatingLogos } from '$lib/components/summary/externalRatingLogos';
import { nearViewport } from '$lib/utils/nearViewport';
import { toExternalSortLine } from './externalSortLine.ts';
import { type ExternalRatingsTarget, fetchExternalRatings } from './fetchExternalRatings.ts';

const { target, sortBy }: { target: ExternalRatingsTarget; sortBy: string } = $props();
let ratings = $state<Awaited<ReturnType<typeof fetchExternalRatings>> | undefined>();
const line = $derived(ratings === undefined ? undefined : toExternalSortLine(sortBy, ratings));
const load = () => {
  void fetchExternalRatings(target).then((read) => {
    ratings = read;
  });
};
</script>

<span class="site-line" aria-busy={line === undefined} {@attach nearViewport(load)}>
  {#if line === undefined}<Shimmer inline="var(--card-shimmer-subtitle-width)" block="var(--font-size-card-subtitle)" />
  {:else if line}<img class={['logo', line.logo, line.metascore]} src={externalRatingLogos[line.logo]}
      alt={line.title} /> <b>{line.rating}</b>{#if line.votes}{` — ${line.votes}`}{/if}
  {:else}&nbsp;{/if}
</span>

<style>
/* PosterCard's `.subtitle`, where the Trakt rating line sits. */
.site-line {
  display: block;
  margin-block-start: var(--space-card-subtitle);
  color: var(--color-card-subtitle);
  font-family: var(--font-headings);
  font-size: var(--font-size-card-subtitle);
  line-height: var(--line-height-card-subtitle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sized and set like the Trakt line's heart icon. */
.logo {
  block-size: 1em;
  inline-size: auto;
  vertical-align: -0.125em;

  &.metacritic {
    inline-size: 1em;
    border: var(--card-metascore-ring) solid var(--metascore, var(--color-metascore-none));
    border-radius: 50%;
  }
}

/* OG's metascore_class: 70 and up green, 40 and up yellow, red below. */
.high {
  --metascore: var(--color-metascore-high);
}

.medium {
  --metascore: var(--color-metascore-medium);
}

.low {
  --metascore: var(--color-metascore-low);
}
</style>
