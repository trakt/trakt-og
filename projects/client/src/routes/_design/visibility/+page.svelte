<script lang="ts">
import { page } from '$app/state';
import RecommendationSpotlight from '$lib/components/dashboard/RecommendationSpotlight.svelte';
import FrameGrid from '$lib/components/frame/FrameGrid.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import DroppedBadge from '$lib/components/media/DroppedBadge.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import OnDeckCard from '$lib/components/media/OnDeckCard.svelte';
import type { OnDeckItem } from '$lib/components/media/OnDeckItem';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import type { Recommendation } from '$lib/dashboard/Recommendation';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import Icon from '$lib/icons/Icon.svelte';
import backward from '$lib/icons/light/backward.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import historyIcon from '$lib/icons/light/clock-rotate-left.svg?raw';
import check from '$lib/icons/trakt/check.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { formatRuntime } from '$lib/utils/formatRuntime';
import { breakingBad, noWayHome } from '../summary/fixtures.ts';

const dates = $derived(page.data.datePreferences);
const show = {
  type: 'show',
  id: breakingBad.id,
  title: breakingBad.title,
  airedEpisodes: breakingBad.airedEpisodes,
  runtime: breakingBad.runtime,
  released: true,
  rating: breakingBad.rating,
} as const;
const dropTarget = { type: 'show', id: breakingBad.id, title: breakingBad.title } as const;
const icons = $derived(mediaQuickIcons({ item: show, state: overlay.state('show', show.id), datePreferences: dates }));
const upNext: OnDeckItem = {
  showId: breakingBad.id,
  showTitle: breakingBad.title,
  showHref: breakingBad.href,
  episodeId: 73483,
  seasonNumber: 1,
  episode: 2,
  episodeHref: `${breakingBad.href}/seasons/1/episodes/2`,
  episodeNumber: '1x02',
  episodeTitle: "Cat's in the Bag...",
  poster: breakingBad.posterThumb,
  rating: 8.12,
  runtime: breakingBad.runtime,
  progressHref: '/users/me/progress',
  progress: { aired: breakingBad.airedEpisodes, completed: 1, plays: 1 },
  rewatching: false,
};
const recommendation: Recommendation = {
  type: 'movie',
  id: noWayHome.id,
  path: `/movies/${noWayHome.id}`,
  href: noWayHome.href,
  title: noWayHome.title,
  year: noWayHome.year,
  overview: noWayHome.overview,
  released: true,
  rating: noWayHome.rating,
  runtime: noWayHome.runtime,
  certification: noWayHome.certification,
  genres: ['Action', 'Adventure'],
  poster: noWayHome.posterThumb,
  fanart: noWayHome.fanart,
  why: { titles: [], likes: [] },
};
</script>

{#snippet watchedDetail()}31/62 eps &mdash; 31 plays <em>({formatRuntime(31 * breakingBad.runtime)})</em>{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet historyMenu()}
  <SummaryActionMenu>
    {#snippet children(close)}
      <a href="/users/me/history/episodes?show={show.id}"><Icon svg={historyIcon} fixedWidth />View history</a>
      <hr />
      <VisibilityControl target={show} action="rewatch" variant="menu" onsaving={close}>
        <Icon svg={backward} fixedWidth />Rewatch
      </VisibilityControl>
      <VisibilityControl target={show} action="drop" variant="menu" onsaving={close}>
        <Icon svg={circleMinus} fixedWidth />Drop
      </VisibilityControl>
    {/snippet}
  </SummaryActionMenu>
{/snippet}

<Specimen title="Dropped stamp" row
  note="A dropped show fades toward gray under a tilted Dropped stamp with the drop date, on posters and fanart alike. The stamp is the restore button; the art around it still opens the show. The summary poster adds the last episode you watched, and a progress row's poster takes the bare word, since its status already says when.">
  <Variant label="Card, with the drop date">
    <div class="poster stamp-box">
      <img src={breakingBad.posterThumb} alt="" />
      <DroppedBadge target={dropTarget} date="Jul 2, 2024" />
    </div>
  </Variant>
  <Variant label="Summary poster">
    <div class="poster stamp-box">
      <img src={breakingBad.poster} alt="" />
      <DroppedBadge target={dropTarget} date="Jul 2, 2024" episode="3x02" />
    </div>
  </Variant>
  <Variant label="Progress row">
    <div class="progress-poster stamp-box">
      <img src={breakingBad.posterThumb} alt="" />
      <DroppedBadge />
    </div>
  </Variant>
  <Variant label="Poster card">
    <div class="poster">
      <PosterCard href={breakingBad.href} title={breakingBad.title} image={breakingBad.posterThumb}
        subtitles={[String(breakingBad.year)]} dropped {icons} />
    </div>
  </Variant>
  <Variant label="Chart card">
    <div class="fanart">
      <FrameGrid variant="framed">
        <FanartCard framed href={breakingBad.href} title={breakingBad.title} year={breakingBad.year}
          image={breakingBad.fanartThumb} tags={[{ text: '868 watchers' }]} dropped
          icons={{ ...icons, favorite: true }} />
      </FrameGrid>
    </div>
  </Variant>
</Specimen>

<Specimen title="Not interested"
  note="The recommendation spotlight's hide button, top right: it asks, then drops the pick from recommendations.">
  <div class="spotlight">
    <RecommendationSpotlight item={recommendation} index={0} total={20} mixed={false} onstep={() => {}} />
  </div>
</Specimen>

<Specimen title="••• menus" row
  note="Rewatch and drop sit under •••: on an Up Next card's quick icons, and beside a show's history button once it has plays.">
  <Variant label="Up Next card">
    <div class="poster">
      <OnDeckCard item={upNext} />
    </div>
  </Variant>
  <Variant label="Show history button">
    <div class="stack">
      <WatchPopover label="50% watched" variant="summary" fill={0.5} selected plural datePreferences={dates}
        onopen={(force) => Promise.resolve(force ? 'date' : 'partial')} onwatch={() => {}}
        onremaining={() => Promise.resolve(false)} oninvalid={() => {}}
        summary={{ icon: check, text: 'watched', percent: '50%', detail: watchedDetail }} more={historyMenu} />
    </div>
  </Variant>
</Specimen>

<style>
/* One card at its grid width: a sixth of the page for a poster, a third for a fanart card. */
.poster {
  inline-size: calc(var(--container-lg) / 6 - var(--gutter));
}

.stack {
  inline-size: var(--watch-date-width);
}

.fanart {
  inline-size: calc(var(--container-lg) / 3);
}

/* The dropped stamp alone over its art, at a card's width (the summary sidebar's too) and a progress row's. */
.stamp-box {
  position: relative;

  & img {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    border-radius: var(--radius-object);
    object-fit: cover;
    filter: var(--filter-dropped);
  }
}

.progress-poster {
  inline-size: var(--progress-poster-width);
}

/* The dashboard's spotlight column, beside the poster rail. */
.spotlight {
  display: grid;
  grid-template-columns: var(--recommendations-layout);
  gap: var(--recommendations-layout-gap);
}
</style>
