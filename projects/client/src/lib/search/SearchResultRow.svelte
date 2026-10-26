<!--
  One search result in the list, built like the calendar's agenda rows: the art as a thumbnail (none for None), the
  title and year with the tag pills under it like the header search and the summary header, then a two-line
  description (blurred while the viewer hides spoilers for it), and og's quick-icon bar at the end. On a narrow frame
  the bar drops under the text.
    <SearchResultRow {card} artwork="fanart" {icons} userRating={state.rating} />
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

<article class={['search-result-row', artwork, { faded }]}>
  {#if artwork !== 'none'}
    <div class="thumb">
      <FanartCard variant={poster ? 'poster' : 'fanart'} href={card.href} title={card.title}
        image={poster ? card.art.poster : card.art.fanart} spoilerImage={poster ? undefined : card.art.spoilerFanart}
        logo={artwork === 'logo' ? card.art.logo : undefined} logoMode={artwork === 'logo'} titles={false}
        iconBar={false} episodeBadge={undefined} {userRating} {dropped} {icons} />
    </div>
  {/if}
  <div class="text">
    <SearchResultTitles {card} {spoiler} large />
    <TagPills tags={searchResultTags(card)} />
    {#if card.overview}
      <MediaSpoiler target={spoiler} kind="overview"><p class="overview">{card.overview}</p></MediaSpoiler>
    {/if}
  </div>
  {#if icons}<QuickIcons row small {...icons} watchNowArt={card.art.fanart} />{/if}
</article>

<style>
.search-result-row {
  --thumb: var(--search-row-fanart-width);
  --columns: minmax(0, 1fr) auto;

  display: grid;
  grid-template-columns: var(--thumb) var(--columns);
  align-items: center;
  column-gap: var(--search-row-gap);
  padding: var(--search-row-padding);
  border-block-end: 1px solid var(--color-calendar-card-line);
  transition: opacity 0.5s, background-color 0.2s;

  &:hover {
    background-color: var(--color-search-result-hover);
  }

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
    --faded-art-filter: var(--filter-faded);
  }

  &.poster {
    --thumb: var(--search-row-poster-width);
  }

  &.none {
    grid-template-columns: var(--columns);
  }

  /* The rating takes the frame's ink. */
  & > :global(.quick-icons) {
    color: var(--color-frame-ink);
  }
}

/* The art at the row's height, rounded, with nothing over it but og's state marks. */
.thumb {
  overflow: hidden;
  border-radius: var(--radius-search-thumb);

  & :global(.fanart .logo) {
    inset-block: 0;
    max-inline-size: var(--calendar-logo-max-width);
    margin-block: auto;
  }

  & :global(.fanart .shadow-base) {
    display: none;
  }
}

.text {
  display: grid;
  gap: var(--search-row-text-gap);
  justify-items: start;
  min-inline-size: 0;
}

.overview {
  display: -webkit-box;
  max-inline-size: var(--search-overview-max-width);
  margin: 0;
  overflow: hidden;
  color: var(--color-search-overview);
  font-size: var(--font-size-search-row-overview);
  line-height: var(--search-row-overview-line);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--search-overview-row-lines);
  line-clamp: var(--search-overview-row-lines);
}

@container (width < 900px) {
  .search-result-row {
    grid-template-columns: var(--thumb) minmax(0, 1fr);
    row-gap: var(--space-sm-block);

    &.none {
      grid-template-columns: minmax(0, 1fr);
    }

    & > :global(.quick-icons) {
      grid-column: -2;
      justify-self: start;
    }
  }
}
</style>
