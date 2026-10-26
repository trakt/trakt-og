<!--
  One search result in the grid, built like the calendar's cards: the art in the viewer's artwork (a poster, the
  fanart, or the logo over the dimmed fanart; none for None), a caption with the title and year, then the list's tag
  pills, a description when there's no art (blurred while the viewer hides spoilers for it), then og's full quick-icon
  bar across the bottom. Cards in a row stretch to the tallest, so their bars line up.
    <SearchResultCard {card} artwork="poster" {icons} userRating={state.rating} />
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { SearchArtwork } from './searchDisplay.ts';
import type { SearchCard } from './SearchCard.ts';
import SearchResultTitles from './SearchResultTitles.svelte';
import { searchResultTags } from './searchResultTags.ts';

interface Props {
  card: SearchCard;
  artwork: SearchArtwork;
  icons?: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  userRating?: number | null;
  dropped?: boolean;
  faded?: boolean;
}

const { card, artwork, icons, userRating, dropped, faded = false }: Props = $props();

const spoiler = $derived(icons?.collectionTarget ?? icons?.watchTarget ?? icons?.ratingTarget);
const poster = $derived(artwork === 'poster');
</script>

<article class={['search-result-card', artwork, { faded }]}>
  {#if artwork !== 'none'}
    <FanartCard variant={poster ? 'poster' : 'fanart'} href={card.href} title={card.title}
      image={poster ? card.art.poster : card.art.fanart} spoilerImage={poster ? undefined : card.art.spoilerFanart}
      logo={artwork === 'logo' ? card.art.logo : undefined} logoMode={artwork === 'logo'} titles={false}
      iconBar={false} episodeBadge={card.episodeBadge} {userRating} {dropped} {icons} />
  {/if}
  <div class="caption">
    <SearchResultTitles {card} {spoiler} />
    <TagPills tags={searchResultTags(card)} />
    {#if artwork === 'none' && card.overview}
      <MediaSpoiler target={spoiler} kind="overview"><p class="overview">{card.overview}</p></MediaSpoiler>
    {/if}
  </div>
  {#if icons}<QuickIcons {...icons} small={poster} watchNowArt={card.art.fanart} />{/if}
</article>

<style>
.search-result-card {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  min-inline-size: 0;
  overflow: hidden;
  border: 1px solid var(--color-calendar-card-line);
  border-radius: var(--radius-calendar-card);
  background-color: var(--color-calendar-card);
  transition: opacity 0.5s;

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
    --faded-art-filter: var(--filter-faded);
  }

  & > :global(.quick-icons) {
    margin-block-start: auto;
    border-block-start: 1px solid var(--color-calendar-card-line);
  }

  & :global(.fanart .logo) {
    inset-block: 0;
    max-inline-size: var(--calendar-logo-max-width);
    margin-block: auto;
  }

  /* The shade under titles on the art; the titles sit in the caption instead. */
  & :global(.fanart .shadow-base) {
    display: none;
  }
}

/* A poster card is narrow, so its pills are a step tighter than the header search's. */
.poster .caption {
  --search-pill-padding: var(--search-poster-pill-padding);
  --font-size-search-pill: var(--font-size-search-poster-pill);
}

.caption {
  display: grid;
  gap: var(--calendar-caption-gap);
  align-content: start;
  padding: var(--calendar-caption-padding);
}

.overview {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-search-overview);
  font-size: var(--font-size-small);
  line-height: var(--search-overview-line);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--search-overview-card-lines);
  line-clamp: var(--search-overview-card-lines);
}
</style>
