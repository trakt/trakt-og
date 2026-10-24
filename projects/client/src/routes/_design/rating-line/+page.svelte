<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import RatingLine from '$lib/components/rating/RatingLine.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import { imageUrl } from '$lib/utils/imageUrl';

const { data } = $props();

// Ten real shows, rated 10 down to 1, so every heart color shows.
const cards = $derived(
  data.trending.map(({ show }, index) => ({
    href: `/shows/${show.ids.slug}`,
    title: show.title,
    image: imageUrl(show.images?.poster?.at(0), 'thumb'),
    rating: show.rating ?? undefined,
    airedEpisodes: show.aired_episodes ?? undefined,
    ownerRating: 10 - index,
  })),
);
</script>

<Specimen title="Under a poster" bleed
  note="A profile's Ratings page and the dashboard's Social Feed put it last in the PosterCard, linking to the item. The heart takes the rating's color; hover underlines it.">
  <section class="ratings">
    <!-- Made-up og paths for sample titles, which resolve() can't type. -->
    <!-- eslint-disable svelte/no-navigation-without-resolve -->
    <Container>
      <PosterGrid columns={6}>
        {#each cards as card (card.href)}
          <PosterCard href={card.href} title={card.title} image={card.image} subtitles={['Sep 29, 2026 3:00 PM']}
            icons={{ fill: quickIconFill({ state: {}, airedEpisodes: card.airedEpisodes }), rating: card.rating }}>
            <a class="rating-link" href={card.href}><RatingLine rating={card.ownerRating} /></a>
          </PosterCard>
        {/each}
      </PosterGrid>
    </Container>
  </section>
</Specimen>

<style>
.ratings {
  display: flow-root;
  padding-block: var(--space-panel);
}

.rating-link {
  display: block;
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}
</style>
