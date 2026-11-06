<!--
  A show's seasons (OG's `h2#seasons` and `.season-posters`): "N Seasons" (specials don't count) with the sort
  dropdown and direction toggle, then five season posters a row (three in a small tablet's narrow column) with their episode counts and quick
  icons. A season the viewer has started gets the summary's purple progress bar under its icons, linking to their
  progress page.
-->
<script lang="ts">
import { page } from '$app/state';
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, fadeHideOptions, matchesFadeHide } from '#lib/components/filters/fadeHide.ts';
import { lazyItemStats } from '#lib/shows/lazyItemStats.svelte.ts';
import PosterCard from '#lib/components/media/PosterCard.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import UnderProgress from '#lib/components/media/UnderProgress.svelte';
import { quickIconFill } from '#lib/components/media/quickIconFill.ts';
import SortHeading from '#lib/components/summary/SortHeading.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { expireHideCookie } from '#lib/components/filters/expireHideCookie.ts';
import { SEASON_SORTS, type SeasonCard, type SeasonSort, sortSeasons } from './toShowSummary.ts';

interface Props {
  showId: number;
  seasons: readonly SeasonCard[];
  signedIn?: boolean;
  initialFilters?: FadeHide;
  datePreferences: DatePreferences;
}

const { showId, seasons, signedIn = false, initialFilters = { fade: [], hide: [] }, datePreferences }: Props = $props();

let filters = $derived(initialFilters);
const cards = $derived(
  seasons.map((card) => {
    const state = overlay.state('season', card.id, { show: showId, number: card.number });
    const fill = quickIconFill({ state, airedEpisodes: card.airedEpisodes, season: true, datePreferences });
    const matches = (id: (typeof fadeHideOptions)[number]['id']) => matchesFadeHide(id, state, fill);
    return {
      card,
      state,
      fill,
      hidden: signedIn && filters.hide.some(matches),
      faded: signedIn && filters.fade.some(matches),
    };
  }).filter(({ hidden }) => !hidden),
);
const progressHref = $derived(page.data.user?.slug && `/users/${page.data.user.slug}/progress?show=${showId}`);
const anyProgress = $derived(Boolean(progressHref) && cards.some(({ fill }) => fill.tips.watched?.[0]));
const count = $derived(cards.filter(({ card }) => card.number !== 0).length);
let by = $state<SeasonSort>('number');
let flipped = $state(false);
const stats = lazyItemStats({
  items: () => cards.map(({ card }) => ({ id: card.id, show: showId, season: card.number })),
  sort: () => by,
  fallback: () => 'number',
});
const sorted = $derived(
  sortSeasons({ cards: cards.map(({ card }) => card), by: stats.by, flipped, stats: stats.counts }),
);
function clearHide() {
  expireHideCookie('show');
  filters = { ...filters, hide: [] };
}
</script>

{#if seasons.length > 0}
  <section class="seasons" aria-labelledby="seasons" {@attach trackDrilldowns({ source: 'seasons' })}>
  <SortHeading id="seasons" {count} noun="Season" sorts={SEASON_SORTS} bind:by bind:flipped loading={stats.loading}>
    {#snippet controls()}{#if signedIn}<FadeHideMenu value={filters} options={fadeHideOptions} cookie="show" onchange={(next) => (filters = next)} />{/if}{/snippet}
  </SortHeading>
  {#if cards.length === 0}
    <EmptyState action={{ text: 'Show hidden seasons', onclick: clearHide }} />
  {:else}
  <PosterGrid columns={5} narrowColumns={3}>
      {#each sorted as { id, number, rating, released, votes: _, airedEpisodes, episodes, ...card } (id)}
        {@const view = cards.find(({ card }) => card.id === id)}
        {@const state = view?.state ?? {}}
        {@const runs = view?.fill.tips.watched}
        {#snippet seasonProgress()}{#if progressHref && runs?.[0]}<UnderProgress href={progressHref}
            percent={runs[0].percent} tip={runs} watched />{/if}{/snippet}
        <PosterCard
          {...card}
          fullTitle={{ show: card.showTitle, title: card.title }}
          faded={view?.faded}
          subtitles={[episodes]}
          userRating={state.rating}
          progress={progressHref && runs?.[0] ? seasonProgress : undefined}
          detachedProgress={anyProgress}
          icons={{
            fill: quickIconFill({ state, airedEpisodes, season: true, datePreferences }),
            ratingTarget: { type: 'season', id, title: card.title, season: { show: showId, number } },
            watchTarget: { type: 'season', id, title: card.fullTitle, season: { show: showId, number }, airedEpisodes },
            rating,
            released,
            listLabel: 'Add to list',
            progressTipBar: false,
          }}
        />
      {/each}
    </PosterGrid>
  {/if}
</section>
{/if}
