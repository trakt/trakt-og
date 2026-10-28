<!--
  A streamed Discover section's place while it loads, under its own heading: Upcoming Premieres' toggles and eight
  fanart cards (two wide, then three a row), the month's lists' sort toggles and six list tiles, or Trending Comments'
  black band with its two dropdowns, a poster beside the quote, and the commenters' pager. Each keeps the loaded
  section's boxes and spacing, so it lands without a jump. Hidden from screen readers, so the page says it's busy.
    {#await data.lists}<DiscoverSectionShimmer section="lists" title="{data.theme.title} Lists" />{:then ...}
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import listIcon from '$lib/icons/regular/list.svg?raw';
import commentsIcon from '$lib/icons/regular/comments.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import CardShimmer from './CardShimmer.svelte';
import Shimmer from './Shimmer.svelte';

type Props = { section: 'premieres' | 'comments' } | { section: 'lists'; title: string };

const props: Props = $props();

const id = $props.id();
const slots = (count: number) => Array.from({ length: count }, (_, i) => i);
// The loaded sections' counts: the premiere toggles and cards, the list sorts and tiles, the commenters.
const PREMIERE_CHIPS = slots(3);
const PREMIERES = slots(8);
const SORTS = slots(4);
const TILES = slots(6);
const COUNTS = slots(3);
const COMMENTERS = slots(10);
const QUOTE_LINES = ['100%', '100%', 'var(--trending-comments-shimmer-short-width)'];
</script>

<div class={['discover-shimmer', props.section]} aria-hidden="true">
  {#if props.section === 'premieres'}
    <PanelHeading id="{id}-premieres" title="Upcoming Premieres" icon={tvRetro} />
    <div class="controls">
      {#each PREMIERE_CHIPS as slot (slot)}
        <Shimmer inline="var(--discover-shimmer-chip-width)" block="var(--control-height)" />
      {/each}
    </div>
    <div class="premiere-grid">
      {#each PREMIERES as slot (slot)}
        <span class="premiere"><CardShimmer ratio="fanart" /></span>
      {/each}
    </div>
  {:else if props.section === 'lists'}
    <PanelHeading id="{id}-lists" title={props.title} icon={listIcon} />
    <div class="controls">
      {#each SORTS as slot (slot)}
        <Shimmer inline="var(--discover-shimmer-chip-width)" block="var(--control-height)" />
      {/each}
    </div>
    <div class="tiles">
      {#each TILES as slot (slot)}
        <span class="tile">
          <span class="media">
            <Shimmer inline="var(--list-tile-shimmer-pill-width)" block="var(--list-tile-shimmer-pill-height)" />
            <Shimmer inline="100%" block="var(--list-tile-fan-height)" />
          </span>
          <span class="body">
            <span class="head">
              <span class="avatar"><Shimmer inline="var(--list-tile-avatar)" block="var(--list-tile-avatar)" round /></span>
              <span class="name">
                <Shimmer inline="var(--list-tile-shimmer-name-width)" block="var(--font-size-list-tile-name)" />
              </span>
              <span class="by">
                <Shimmer inline="var(--list-tile-shimmer-by-width)" block="var(--font-size-list-tile-meta)" />
              </span>
            </span>
            <span class="counts">
              {#each COUNTS as count (count)}
                <Shimmer inline="var(--list-card-shimmer-count-width)" block="var(--control-height)" />
              {/each}
            </span>
          </span>
        </span>
      {/each}
    </div>
  {:else}
    <div class="inner">
      <PanelHeading id="{id}-comments" title="Trending Comments" icon={commentsIcon} />
      <div class="filters">
        <Shimmer inline="var(--comment-shimmer-dropdown-width)" block="var(--control-height)" />
        <Shimmer inline="var(--comment-shimmer-dropdown-width)" block="var(--control-height)" />
      </div>
      <div class="slide">
        <CardShimmer ratio="poster" />
        <span class="quote">
          <span class="byline">
            <Shimmer inline="var(--comment-avatar)" block="var(--comment-avatar)" round />
            <Shimmer inline="var(--comment-shimmer-name-width)" block="var(--font-size-comment-meta)" />
          </span>
          {#each QUOTE_LINES as width, line (line)}
            <Shimmer inline={width} block="var(--font-size-trending-comments-quote)" />
          {/each}
        </span>
      </div>
      <div class="pager">
        {#each COMMENTERS as slot (slot)}
          <Shimmer inline="var(--trending-comments-person)" block="var(--trending-comments-person)" round />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
/* UpcomingPremieres' and DiscoverLists' sections: the heading, the toggles, then the cards. */
.premieres,
.lists {
  display: grid;
  gap: var(--discover-heading-margin);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-dropdown-row);
  margin-block: calc(var(--space-heading-dropdowns) - var(--discover-heading-margin)) var(--discover-controls-gap);
}

.premiere-grid {
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--premiere-grid-gap);
}

/* A premiere's FanartCard has its quick-icon bar flush under the art. */
.premiere {
  --space-card-shimmer-bar: 0px;
  grid-column: span 2;
  overflow: hidden;
  border-radius: var(--radius-premiere-card);

  &:nth-child(-n + 2) {
    grid-column: span 3;
  }
}

@container (width < 720px) {
  .premiere,
  .premiere:nth-child(-n + 2) {
    grid-column: span 6;
  }
}

.lists {
  container-type: inline-size;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
  gap: var(--list-tile-gap);
}

@container (width >= 600px) {
  .tiles {
    --columns: 2;
  }
}

@container (width >= 900px) {
  .tiles {
    --columns: 3;
  }
}

/* A list tile is dark in both themes, so the bars are the light ones. */
.tile {
  --shimmer: var(--shimmer-on-art);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-list-tile);
  background-color: var(--color-list-tile-bg);
}

.media {
  display: grid;
  gap: var(--list-tile-media-gap);
  padding: var(--list-tile-media-padding);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--list-tile-body-gap);
  padding: var(--list-tile-body-padding);
}

.head {
  display: grid;
  grid-template-columns: var(--list-tile-avatar) minmax(0, 1fr);
  align-items: center;
  gap: var(--list-tile-head-gap);
  line-height: var(--line-height-headings);
}

.avatar {
  display: flex;
  grid-row: span 2;
}

/* Each bar centred in the line its text holds. */
.name,
.by {
  display: flex;
  align-items: center;
  block-size: 1lh;
}

.name {
  font-size: var(--font-size-list-tile-name);
}

.by {
  font-size: var(--font-size-list-tile-meta);
}

.counts {
  display: flex;
  gap: var(--list-counts-gap);
  padding-block-start: var(--list-tile-body-gap);
}

/* TrendingComments' band: black in both themes, so the bars are the light ones. */
.comments {
  --shimmer: var(--shimmer-on-art);
  background-color: var(--color-trending-comments-bg);
  color-scheme: dark;
  color: var(--color-discover-text);
}

.inner {
  margin-inline: auto;
  padding-block: var(--trending-comments-top) var(--trending-comments-bottom);
  padding-inline: calc(var(--gutter) / 2);

  @media (min-width: 768px) {
    inline-size: var(--container-sm);
  }

  @media (min-width: 992px) {
    inline-size: var(--container-md);
  }

  @media (min-width: 1200px) {
    inline-size: var(--container-lg);
  }
}

.filters {
  display: flex;
  gap: var(--space-dropdown-row);
  margin-block: var(--space-heading-dropdowns) var(--trending-comments-title-gap);
}

.slide {
  display: grid;
  grid-template-columns: var(--trending-comments-poster) minmax(0, 1fr);
  gap: var(--trending-comments-gap);
  align-items: center;
  min-block-size: var(--trending-comments-height);
}

.quote {
  display: grid;
  gap: var(--trending-comments-shimmer-line-gap);
}

.byline {
  display: flex;
  align-items: center;
  gap: var(--trending-comments-byline-gap);
}

.pager {
  display: flex;
  gap: var(--trending-comments-people-gap);
  inline-size: fit-content;
  margin: var(--trending-comments-pager-gap) auto 0;
  padding: var(--trending-comments-pager-padding);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-season-pill);
  background-color: var(--color-season-hero-chrome);
}
</style>
