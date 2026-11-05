<script lang="ts">
import { page } from '$app/state';
import FilterBand from '#lib/components/filters/FilterBand.svelte';
import DayGroup from '#lib/components/history/DayGroup.svelte';
import MediaWatch from '#lib/components/history/MediaWatch.svelte';
import { mediaQuickIcons } from '#lib/components/media/mediaQuickIcons.ts';
import PosterCard from '#lib/components/media/PosterCard.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '#lib/components/media/quickIconFill.ts';
import Specimen from '#lib/design/Specimen.svelte';
import Variant from '#lib/design/Variant.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import HistoryItemBand from '#lib/users/history/HistoryItemBand.svelte';
import { breakingBad, noWayHome, pilot, seasonOne, seasonOneEpisodes } from '../summary/fixtures.ts';

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
const cancerMan = seasonOneEpisodes[3];
// The pilot watched, so "Up to here" adds 1x02 to 1x04 and skips one.
const upTo = {
  episodes: [2, 3, 4].map((number) => ({ season: 1, number })),
  skipped: 1,
};
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
  note="The history button in a summary's action stack, with the viewer's own plays. Add a play to see its date, a show's episode bar and the ••• menu. An episode with unwatched ones before it gets an “Include N unwatched episodes before it” checkbox above the dates; ticked, it adds them back to back in one go.">
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
  {#if cancerMan}
    <Variant label="Episode, up to here">
      <div class="stack">
        <MediaWatch target={{ type: 'episode', id: cancerMan.id, title: `${breakingBad.title} ${cancerMan.number}`,
          season: cancerMan.season, runtime: pilot.runtime, released: true }} variant="summary" sampleUpTo={upTo} />
      </div>
    </Variant>
  {/if}
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

<Specimen title="Title band"
  note="Under the history's subnav when it's narrowed to one title, on its fanart (an episode's still), its year beside it in gray: a season's range, an episode's air year. A season names its show over its name, an episode its show and season, each opening the history narrowed to it. The X goes back to all of the history. Progress narrowed to a list uses the same band, with the list's fan and owner, and a shimmer while it loads.">
  <Variant label="Movie">
    <HistoryItemBand allHref="#title-band" itemHref={() => '#title-band'} band={{ type: 'movie', title: 'Spider-Man: No Way Home', href: '#title-band',
      image: noWayHome.fanartThumb, year: '2021' }} />
  </Variant>
  <Variant label="Season">
    <HistoryItemBand allHref="#title-band" itemHref={() => '#title-band'} band={{ type: 'season', title: seasonOne.title, href: '#title-band',
      image: breakingBad.fanartThumb, year: '2008', parents: [{ title: breakingBad.title, item: show }] }} />
  </Variant>
  <Variant label="Episode">
    <HistoryItemBand allHref="#title-band" itemHref={() => '#title-band'} band={{ type: 'episode', title: '1x01 Pilot', href: '#title-band',
      image: breakingBad.fanartThumb, year: '2008', parents: [{ title: breakingBad.title, item: show },
        { title: seasonOne.title, item: season }] }} />
  </Variant>
  <Variant label="Loading">
    <FilterBand header="Displaying shows from this list">
      {#snippet art()}<span class="band-art"></span>{/snippet}
    </FilterBand>
  </Variant>
</Specimen>

<style>
.band-art {
  inline-size: var(--filter-band-poster-width);
  block-size: var(--filter-band-poster-height);
  border-radius: var(--radius-list-card-fan);
  background-color: var(--color-list-card-placeholder);
}

/* About the width of a summary's action column. */
.stack {
  inline-size: var(--watch-date-width);
}
</style>
