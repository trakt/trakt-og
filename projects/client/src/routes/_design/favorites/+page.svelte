<script lang="ts">
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
import type { FavoriteTarget } from '$lib/favorites/FavoriteTarget';

const movie: FavoriteTarget = { type: 'movie', id: 432, title: 'Fight Club', year: 1999 };
const show: FavoriteTarget = { type: 'show', id: 1388, title: 'Breaking Bad', year: 2008 };
</script>

<DemoSection title="Summary actions" note="Add to favorites in the summary's action stack.">
  <div class="actions">
    <ActionButtons checkin={{ type: 'movie', id: movie.id }} favorites favoriteTarget={movie} />
  </div>
</DemoSection>

<DemoSection title="Poster stars"
  note="They share the summary's state. A season's or an episode's star favorites its show.">
  <PosterGrid columns={6}>
    <PosterCard href="/movies/fight-club-1999" title="Fight Club"
      icons={{ fill: quickIconFill({ state: {} }), favorite: true, favoriteTarget: movie }} />
    <PosterCard href="/shows/breaking-bad/seasons/1" title="Season 1"
      icons={{ fill: quickIconFill({ state: {} }), favorite: true, favoriteTarget: show, listLabel: 'Add to list' }} />
    <PosterCard href="/shows/breaking-bad/seasons/1/episodes/1" title="Pilot" variant="screenshot"
      icons={{ fill: quickIconFill({ state: {} }), favorite: true, favoriteTarget: show, listLabel: 'Add to list' }} />
  </PosterGrid>
</DemoSection>

<style>
.actions {
  max-inline-size: var(--watch-date-width);
}
</style>
