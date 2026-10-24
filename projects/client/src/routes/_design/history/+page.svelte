<script lang="ts">
import { page } from '$app/state';
import DayGroup from '$lib/components/history/DayGroup.svelte';
import MediaWatch from '$lib/components/history/MediaWatch.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import { overlay } from '$lib/overlay/overlay';
import { breakingBad, noWayHome, pilot, seasonOne } from '../summary/fixtures.ts';

const dates = $derived(page.data.datePreferences);
const movie = { type: 'movie', id: noWayHome.id, title: noWayHome.fullTitle, runtime: noWayHome.runtime } as const;
const show = {
  type: 'show',
  id: breakingBad.id,
  title: breakingBad.title,
  airedEpisodes: breakingBad.airedEpisodes,
  runtime: breakingBad.runtime,
} as const;
const season = {
  type: 'season',
  id: seasonOne.id,
  title: seasonOne.fullTitle,
  season: seasonOne.season,
  airedEpisodes: seasonOne.airedEpisodes,
} as const;
const episode = { type: 'episode', id: pilot.id, title: pilot.fullTitle, season: pilot.season } as const;
</script>

{#snippet historyCard(subtitle: string)}
  <PosterCard href={noWayHome.href} title={noWayHome.title} image={noWayHome.posterThumb} subtitles={[subtitle]}
  userRating={overlay.state('movie', movie.id).rating}
  icons={{
      fill: quickIconFill({ state: overlay.state('movie', movie.id), datePreferences: dates }),
      rating: noWayHome.rating,
      ratingTarget: movie,
      watchTarget: movie,
      watchNow: 'play',
    }} />
{/snippet}

{#snippet episodeCard()}
  <PosterCard href={pilot.href} title={pilot.title} number={pilot.number} image={breakingBad.posterThumb}
  subtitles={[breakingBad.title, 'Unknown date']}
  userRating={overlay.state('episode', episode.id, episode.season).rating}
  icons={{
      fill: quickIconFill({ state: overlay.state('episode', episode.id, episode.season), datePreferences: dates }),
      rating: pilot.rating,
      ratingTarget: episode,
      watchTarget: episode,
      watchNow: 'play',
      listLabel: 'Add to list',
    }} />
{/snippet}

<Specimen title="Summary buttons" row
  note="The history button in a summary's action stack, with the viewer's own plays. Add a play to see its date, a show's episode bar and the ••• menu.">
  <Variant label="Movie">
    <div class="stack">
      <MediaWatch target={{ ...movie, released: true }} variant="summary" />
    </div>
  </Variant>
  <Variant label="Show">
    <div class="stack">
      <MediaWatch target={{ ...show, released: true }} variant="summary" />
    </div>
  </Variant>
</Specimen>

<Specimen title="Poster icons"
  note="The check under a poster opens the same popovers. A season's check asks before it marks all its episodes watched.">
  <PosterGrid>
    {@render historyCard('2021')}
    <PosterCard href={breakingBad.href} title={breakingBad.title} image={breakingBad.posterThumb}
      subtitles={[String(breakingBad.year)]} userRating={overlay.state('show', show.id).rating}
      dropped={overlay.state('show', show.id).dropped}
      icons={mediaQuickIcons({
        item: { ...show, released: true, rating: breakingBad.rating },
        state: overlay.state('show', show.id),
        datePreferences: dates,
      })} />
    <PosterCard href={seasonOne.href} title={seasonOne.title} fullTitle={seasonOne.fullTitle} image={seasonOne.poster}
      subtitles={[`${seasonOne.airedEpisodes} episodes`]}
      userRating={overlay.state('season', season.id, season.season).rating}
      icons={{
        fill: quickIconFill({
          state: overlay.state('season', season.id, season.season),
          airedEpisodes: season.airedEpisodes,
          season: true,
          datePreferences: dates,
        }),
        ratingTarget: { type: 'season', id: season.id, title: seasonOne.title, season: season.season },
        watchTarget: season,
        rating: seasonOne.rating,
        released: true,
        listLabel: 'Add to list',
      }} />
  </PosterGrid>
</Specimen>

<Specimen title="Day dividers"
  note="History, library and ratings group cards under these. Click one to collapse its day. Plays with no date go under Unknown Date, with no weekday.">
  <DayGroup weekday="Monday" date="October 5, 2026" runtime="2h 28m">
    <PosterGrid>{@render historyCard('8:15 pm')}</PosterGrid>
  </DayGroup>
  <DayGroup date="Unknown Date" runtime="59m">
    <PosterGrid>{@render episodeCard()}</PosterGrid>
  </DayGroup>
</Specimen>

<style>
/* About the width of a summary's action column. */
.stack {
  inline-size: var(--watch-date-width);
}
</style>
