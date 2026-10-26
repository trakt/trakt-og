<!--
  Page 1's #1, edge to edge across the chart's content: its fanart behind discover's hero copy. The rank sits top left;
  the logo (or the title), the tag pills led by the chart's count, the overview, then More info, Watch now (once it's
  out) and Trailer. The list row's slim quick-icon strip, with the rating, sits on glass in the bottom right corner,
  level with the buttons (under the copy in a narrow hero). The art ends on a hard edge, shaded from the bottom and the
  left inside it so the copy reads. Everything over it is dark in both themes.
-->
<script lang="ts">
import { isStandardApi } from '$lib/api/isStandardApi';
import TagPills from '$lib/components/labels/TagPills.svelte';
import VideoPopup from '$lib/components/dialog/VideoPopup.svelte';
import { youtubeEmbedUrl } from '$lib/components/dialog/youtubeEmbedUrl';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import TrimmedLogo from '$lib/components/media/TrimmedLogo.svelte';
import { openWatchNow } from '$lib/components/watchnow/watchNowLauncher.svelte';
import { watchNowPath } from '$lib/components/watchnow/watchNowPath';
import { isPlainClick } from '$lib/utils/isPlainClick';
import { proxiedLogoUrl } from '$lib/utils/proxiedLogoUrl';
import Icon from '$lib/icons/Icon.svelte';
import youtube from '$lib/icons/brands/youtube.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import type { ComponentProps } from 'svelte';
import ChartRank from './ChartRank.svelte';
import { chartHeroTags } from './chartHeroTags.ts';
import type { ChartCard } from './toChartCard.ts';

interface Props {
  card: ChartCard;
  rank: number;
  /** Trending: the rank's dot pulses. */
  live: boolean;
  /** The card's quick icons. The hero has its own Watch now, so the strip leaves it out. */
  icons: Omit<ComponentProps<typeof QuickIcons>, 'row' | 'small' | 'watchNow'>;
}

const { card, rank, live, icons }: Props = $props();
let video = $state<string>();
// Through og, so its transparent margins can be trimmed.
const logo = $derived(proxiedLogoUrl(card.logo));
const trailer = $derived(card.trailer && youtubeEmbedUrl(card.trailer) ? card.trailer : undefined);
</script>

<!-- Media hrefs point at routes resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section class="chart-hero" aria-labelledby="chart-hero-{card.id}">
  <div class="art">
    {#if card.fanart ?? card.image}
      <img class="backdrop" src={card.fanart ?? card.image} alt="" decoding="async" fetchpriority="high" />
    {/if}

    <div class="inner">
      <div class="rank"><ChartRank {rank} {live} size="hero" /></div>

      <div class="info">
        <h2 class="name" id="chart-hero-{card.id}">
          <a href={card.href}>
            {#if logo}<TrimmedLogo src={logo} alt={card.title} />{:else}{card.title}{/if}
          </a>
        </h2>
        <TagPills tags={chartHeroTags(card)} />
        {#if card.overview}<p class="overview">{card.overview}</p>{/if}
        <div class="actions">
          <a class="button primary" href={card.href}>More info</a>
          {#if card.released && !isStandardApi()}
            <button
              type="button"
              class="button accent"
              aria-haspopup="dialog"
              onclick={() =>
                openWatchNow({
                  path: watchNowPath({ type: card.type, id: card.id }) ?? card.href,
                  title: card.title,
                  year: card.year,
                  fanart: card.fanart,
                })}
            ><Icon svg={play} /> Watch now</button>
          {/if}
          {#if trailer}
            <a
              class="button secondary"
              href={trailer}
              target="_blank"
              rel="noopener noreferrer"
              onclick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                video = trailer;
              }}
            ><Icon svg={youtube} /> Trailer</a>
          {/if}
        </div>
      </div>
      <div class="tools"><QuickIcons {...icons} row watchNow={false} /></div>
    </div>
  </div>
</section>
<VideoPopup bind:url={video} title="{card.title} trailer" />

<style>
/* A grid, so the copy stretches to the art's clamped height rather than the ratio's own. */
.art {
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  display: grid;
  /* The full width, so the height gives way to the ratio's bounds and not the width. */
  inline-size: 100%;
  aspect-ratio: var(--chart-hero-ratio);
  min-block-size: var(--chart-hero-min-height);
  max-block-size: var(--chart-hero-max-height);
  overflow: hidden;
  background-color: var(--color-slider-bg);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--chart-hero-shade);
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--chart-hero-image-position);
}

/* Over fanart, so dark in both themes. */
.inner {
  color-scheme: dark;
  display: grid;
  grid-template: auto 1fr / minmax(0, 1fr) auto;
  justify-items: start;
  column-gap: var(--gutter);
  padding: var(--chart-hero-padding);
  color: var(--color-discover-text);
}

.rank {
  grid-area: 1 / 1 / 2 / -1;
}

.info {
  grid-area: 2 / 1;
  display: grid;
  align-self: end;
  justify-items: start;
  gap: var(--chart-hero-copy-gap);
  max-inline-size: min(var(--chart-hero-copy-width), 100%);
  text-shadow: var(--shadow-season-hero-text);

  & :global(.tag-pills) {
    text-shadow: none;
  }
}

/* The strip on the hero's glass, not a control's fill. */
.tools {
  /* The card bar's roomier squares, not a list row's. */
  --quick-icons-row-cell: var(--chart-hero-tools-cell);
  grid-area: 2 / 2;
  align-self: end;
  /* Centered on the buttons' row: they're taller than the strip and its 1px border. */
  margin-block-end: calc((var(--season-hero-action) - var(--quick-icons-row-cell) - 2px) / 2);

  & :global(.quick-icons.row) {
    border-color: var(--color-season-hero-chrome-line);
    background-color: var(--color-season-hero-chrome);
    backdrop-filter: blur(var(--chart-rank-blur));
  }
}

.name {
  --trimmed-logo-width: var(--chart-hero-logo-width);
  --trimmed-logo-height: var(--chart-hero-logo-height);
  --trimmed-logo-margin-start: var(--trimmed-logo-margin);
  --trimmed-logo-margin-end: var(--trimmed-logo-margin);
  --trimmed-logo-filter: drop-shadow(var(--shadow-season-hero-logo));
  margin: 0;
  font-size: var(--font-size-season-title);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-title);
  line-height: var(--line-height-season-title);
  text-wrap: balance;

  & a {
    display: block;
    color: inherit;
    text-decoration: none;
  }
}

.overview {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-season-hero-blurb);
  font-size: var(--font-size-season-hero-blurb);
  line-height: var(--line-height-base);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

/* Discover's buttons, spaced as there; they wrap only in a narrow hero. */
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-dropdown-row);
  margin-block-start: var(--chart-hero-actions-gap);
  text-shadow: none;
}

.button {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--season-hero-badge-gap);
  block-size: var(--season-hero-action);
  min-block-size: 0;
  padding-inline: var(--season-hero-button-inline);
  border: 0;
  border-radius: var(--radius-season-button);
  font: inherit;
  font-size: var(--font-size-season-button);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-eyebrow);
  white-space: nowrap;
  text-transform: uppercase;
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-chart-hero-accent);
    color: var(--color-discover-on-image);
    text-decoration: none;
  }
}

.primary {
  background-color: var(--color-season-button-bg);
  color: var(--color-season-button-text);
}

.secondary {
  background-color: var(--color-season-hero-chrome);
  box-shadow: inset 0 0 0 1px var(--color-season-hero-chrome-line);
  color: var(--color-discover-text);
}

/* Watch now in the brand red, apart from the trailer's glass; it lights up white instead. */
.accent {
  background-color: var(--color-chart-hero-accent);
  color: var(--color-discover-on-image);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-season-button-bg);
    color: var(--color-season-button-text);
  }
}

@container (width < 900px) {
  .inner {
    padding: var(--chart-hero-padding-narrow);
  }

  .name {
    font-size: var(--font-size-chart-hero-title-narrow);

    --trimmed-logo-width: var(--chart-hero-logo-width-narrow);
    --trimmed-logo-height: var(--chart-hero-logo-height-narrow);
  }

  .overview {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .actions {
    flex-wrap: wrap;
  }

  .tools {
    grid-area: 3 / 1;
    margin-block-start: var(--chart-hero-copy-gap);
  }
}
</style>
