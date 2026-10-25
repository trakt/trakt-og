<script lang="ts">
import { page } from '$app/state';
import FrameGrid from '$lib/components/frame/FrameGrid.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import type { FavoriteTarget } from '$lib/favorites/FavoriteTarget';
import { overlay } from '$lib/overlay/overlay';
import { formatDate } from '$lib/utils/formatDate';
import { breakingBad, noWayHome, pilot } from '../summary/fixtures.ts';

const dates = $derived(page.data.datePreferences);
const ratingTarget = { type: 'movie', id: noWayHome.id, title: noWayHome.fullTitle } as const;
const movieFavorite: FavoriteTarget = {
  ...ratingTarget,
  title: noWayHome.title,
  year: noWayHome.year,
  fanart: noWayHome.fanart,
};
const showFavorite: FavoriteTarget = {
  type: 'show',
  id: breakingBad.id,
  title: breakingBad.title,
  year: breakingBad.year,
};
const charts = [
  { ...noWayHome, released: true, image: noWayHome.fanartThumb, tag: '1,204 watchers' },
  { ...breakingBad, released: true, image: breakingBad.fanartThumb, tag: '868 watchers' },
] as const;
const watchedAt = $derived(formatDate('2026-10-05T20:15:00Z', { ...dates, time: true }));
const episode = { type: 'episode', id: pilot.id, title: pilot.title, season: pilot.season } as const;
</script>

<Specimen title="Summary actions"
  note="Add to favorites in a movie's action stack, which turns gold with the date once added.">
  <div class="actions">
    <ActionButtons listTarget={ratingTarget} checkin={{ type: 'movie', id: noWayHome.id }} favorites
      favoriteTarget={movieFavorite} historyTarget={{ ...ratingTarget, runtime: noWayHome.runtime, released: true }} />
  </div>
</Specimen>

<Specimen title="Card stars"
  note="Charts and Recently Watched add a star to the quick icons. It shares the summary's state, and an episode's star favorites its show.">
  <Variant label="Chart cards">
    <FrameGrid variant="framed">
      {#each charts as item (item.id)}
        {@const state = overlay.state(item.type, item.id)}
        <FanartCard framed href={item.href} title={item.title} year={item.year} image={item.image}
          tags={[{ text: item.tag }]} userRating={state.rating} dropped={state.dropped}
          icons={{ ...mediaQuickIcons({ item, state, datePreferences: dates }), favorite: true }} />
      {/each}
    </FrameGrid>
  </Variant>
  <Variant label="Recently Watched episode">
    <PosterGrid columns={3} phoneColumns={1}>
      {@const state = overlay.state('episode', episode.id, episode.season)}
      <FanartCard framed href={pilot.href} title={pilot.title} number={pilot.number}
        smallTitle={{ text: breakingBad.title, href: breakingBad.href }} image={pilot.screenshotThumb}
        tags={[...(pilot.episodeType ? [pilot.episodeType] : []), { text: watchedAt }]} userRating={state.rating}
        icons={{
          fill: quickIconFill({ state, datePreferences: dates }),
          rating: pilot.rating,
          ratingTarget: episode,
          watchTarget: { ...episode, runtime: pilot.runtime },
          favorite: true,
          favoriteTarget: showFavorite,
          watchNow: 'play',
          listLabel: 'Add to list',
        }} />
    </PosterGrid>
  </Variant>
</Specimen>

<style>
/* About the width of a summary's action column. */
.actions {
  inline-size: var(--watch-date-width);
}
</style>
