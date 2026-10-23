<!--
  OG's `#summary-ratings-wrapper`: the dark bar along the bottom of a summary's fanart, as one row of icons and numbers.
  The Trakt rating and the Rate button come first, then favorites, the other sites' ratings and All Stats. A summary passes only
  its favorites; the rest of the community counts live on the stats page. A person's passes its list count. Each
  number has a two-line tooltip: what it is, then its exact value. On a narrow screen the row starts beside the poster
  and runs to the page edge, scrolling sideways only past that edge, never wrapping. Render it in FanartHeader's
  `stats` slot.
  The Rate and All Stats buttons are glass actions like the dashboard's; Rate opens the shared rating popover, ten bars
  from gray to red, and takes the rating's color once rated.
-->
<script lang="ts">
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import MediaRating from '$lib/components/rating/MediaRating.svelte';
import type { SpoilerTarget } from '$lib/settings/SpoilerTarget';
import type { RatingTarget } from '$lib/components/rating/RatingTarget';
import { RATING_LABELS } from '$lib/components/rating/ratingPrompt';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import heartOutline from '$lib/icons/regular/heart.svg?raw';
import arrowRightLong from '$lib/icons/regular/arrow-right-long.svg?raw';
import chartColumn from '$lib/icons/solid/chart-column.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import { readableStat } from '$lib/utils/readableStat';
import type { ExternalRating } from './ExternalRating.ts';
import { externalRatingLogos as logos } from './externalRatingLogos.ts';
import type { StripCount } from './StripCount.ts';
import { stripStatIcons as icons } from './stripStatIcons.ts';
import { type StripStat, stripStats } from './stripStats.ts';
import { ratingPercent } from '../../utils/ratingPercent.ts';

interface Props {
  /** The Trakt rating, 0 to 10. Left out, the rating is hidden (OG hid it before release). */
  rating?: { readonly value: number; readonly votes: number; readonly href: string };
  /** "movie", "show", "season", "episode": finishes "Rate this ...". Left out, there's no Rate button. */
  rateLabel?: string;
  ratingTarget?: RatingTarget & SpoilerTarget;
  external?: readonly ExternalRating[];
  /** Zero counts are dropped. */
  counts?: readonly StripCount[];
  /** The stats page, for the Stats button after the Trakt group. Left out on the stats page itself. */
  statsHref?: string;
}

const { rating, rateLabel, ratingTarget, external = [], counts = [], statsHref }: Props = $props();

// OG truncated instead of rounding, so 79.9% reads 79%.
const percent = $derived(rating ? ratingPercent(rating.value) : 0);
const level = $derived(rating ? Math.min(Math.trunc(rating.value), 10) : 0);
const votes = $derived(
  rating ? `${rating.votes.toLocaleString('en-US')} ${rating.votes === 1 ? 'vote' : 'votes'}` : '',
);
const stats = $derived(stripStats(counts));

const rateHint = (value: number | null) =>
  value ? `Your rating\n${value} · ${RATING_LABELS[value]}` : `Rate this ${rateLabel}\nWhat did you think?`;
</script>

<!-- Links go out to other sites or to subpages og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet count(stat: StripStat)}
  <li>
  <Tooltip text={`${stat.title}\n${stat.detail}`} variant="titled">
      {#snippet trigger(tooltip)}
        <!-- Counts without a page of their own open the stats page, where they're broken down. -->
        {@const href = stat.href ?? rating?.href}
        {#if href}
          <a class="stat" {href} aria-label="{stat.detail} {stat.label}" {...tooltip}>
            <span class="glyph" style:color="var(--color-strip-{stat.kind})"><Icon svg={icons[stat.kind]} /></span>
            <span class="number">{readableStat(stat.count)}</span>
          </a>
        {:else}
          <span class="stat" {...tooltip}>
            <span class="glyph" style:color="var(--color-strip-{stat.kind})"><Icon svg={icons[stat.kind]} /></span>
            <span class="number" aria-hidden="true">{readableStat(stat.count)}</span>
            <span class="visually-hidden">{stat.detail} {stat.label}</span>
          </span>
        {/if}
      {/snippet}
    </Tooltip>
</li>
{/snippet}

<div class="ratings-strip">
  <ul>
    {#if rating}
      <li>
        <MediaSpoiler target={ratingTarget} kind="rating">
          <Tooltip text={`Trakt Rating\n${votes}`} variant="titled">
            {#snippet trigger(tooltip)}
              <a class="stat" href={rating.href} aria-label="Trakt Rating {percent}%, {votes}" {...tooltip}>
                <span class="glyph heart" style:color={level > 0 ? `var(--rating-${level})` : undefined}>
                  <Icon svg={heart} />
                </span>
                <span class="number">{percent}%</span>
              </a>
            {/snippet}
          </Tooltip>
        </MediaSpoiler>
      </li>
    {/if}
    {#if rateLabel && ratingTarget}
      <li>
        <MediaRating target={ratingTarget} variant="summary" hint={rateHint}>
          {#snippet trigger({ value })}
            <GlassAction presentational glass icon={value ? heart : heartOutline}
              color={value ? `var(--rating-${value})` : undefined}>{value ?? 'Rate'}</GlassAction>
          {/snippet}
        </MediaRating>
      </li>
    {/if}
    {#if stats.favorited}{@render count(stats.favorited)}{/if}
    {#if external.length > 0}
      <li class="divider" aria-hidden="true"></li>
      {#each external as site (site.logo)}
        <li class={site.metascore}>
          <MediaSpoiler target={ratingTarget} kind="rating">
            <Tooltip>
              {#snippet trigger(tooltip)}
                <a class="stat" href={site.href} target="_blank" rel="noopener"
                  aria-label="{site.title} {site.rating}, {site.change ? `${site.change.text} ` : ''}{site.detail}"
                  {...tooltip}>
                  <img class={['logo', site.logo]} src={logos[site.logo]} alt="" />
                  <span class="number">{site.rating}</span>
                </a>
              {/snippet}
              <b class="tip-title">{site.title}</b>
              <span class="tip-detail">
                {#if site.change}<b class={['rank-change', site.change.trend]}>{site.change.text}</b>{/if}
                {site.detail}
              </span>
            </Tooltip>
          </MediaSpoiler>
        </li>
      {/each}
    {/if}
    {#if statsHref}
      <li class="all-stats">
        <GlassAction href={statsHref} glass icon={chartColumn}>All Stats<span class="arrow"><Icon svg={arrowRightLong} /></span
          ></GlassAction>
      </li>
    {/if}
    {#if stats.community.length > 0}
      {#if rating || external.length > 0}<li class="divider" aria-hidden="true"></li>{/if}
      {#each stats.community as stat (stat.kind)}{@render count(stat)}{/each}
    {/if}
  </ul>
</div>

<style>
/* One row from beside the poster to the page edge: the content column is centered in the stats bar, so reaching past
   its end by half the difference lands on the bar's edge. It scrolls sideways past that, never wrapping. Padding the
   end by that same reach keeps the row's own end, where All Stats sits, at the content column's edge. */
.ratings-strip {
  display: flex;
  min-block-size: var(--stats-height);
  /* Out to the bar's top and bottom edges, so the dividers between the groups run its full height. */
  margin-block: calc(-1 * var(--stats-padding-block));
  margin-inline-end: calc((100% - 100cqi) / 2);
  padding-inline: var(--summary-offset) calc((100cqi - 100%) / 2 - var(--strip-item-pad-inline));
  overflow-x: auto;
  scrollbar-width: none;
  white-space: nowrap;

  @media (width < 992px) {
    padding-inline-start: var(--summary-offset-sm);
  }

  @media (width < 768px) {
    padding-inline-start: 0;
  }
}

ul {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--strip-gap);
  margin: 0;
  /* Room for the hover wash, which reaches past the first and last items' edges. */
  padding: 0 var(--strip-item-pad-inline);
  list-style: none;
}

li {
  display: flex;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--strip-item-gap);
  margin: var(--strip-item-pull);
  padding: var(--strip-item-pad);
  border-radius: var(--radius-strip-item);
  color: var(--color-card-text);
  text-decoration: none;

  &:is(a):is(:hover, :focus-visible) {
    background-color: var(--color-strip-hover);
    color: var(--color-card-text);
    text-decoration: none;
  }
}

.glyph {
  display: inline-flex;
  font-size: var(--font-size-strip-icon);
}

.number {
  font-family: var(--font-headings);
  font-size: var(--font-size-strip-number);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: var(--text-shadow-headings);
}

.logo {
  inline-size: var(--strip-logo-size);
  block-size: var(--strip-logo-size);
  object-fit: contain;

  /* v3's solid yellow badge, twice as wide as it is tall. */
  &.imdb {
    inline-size: auto;
    block-size: var(--strip-imdb-height);
  }

  &.metacritic {
    border: var(--strip-metascore-ring) solid var(--color-metascore-none);
    border-radius: 50%;
  }
}

/* OG's metascore_class: 70 and up green, 40 and up yellow, red below. */
.high {
  --metascore: var(--color-metascore-high);
}

.medium {
  --metascore: var(--color-metascore-medium);
}

.low {
  --metascore: var(--color-metascore-low);
}

:is(.high, .medium, .low) .logo {
  border-color: var(--metascore);
}

/* The other sites' tooltips: the site in bold, then what the number is, with JustWatch's rank change leading it in
   green when positive and red when negative. */
.tip-title,
.tip-detail {
  display: block;
}

.tip-title {
  font-weight: var(--font-weight-headings-heavy);
}

.tip-detail {
  color: var(--color-tooltip-muted);
}

.rank-change {
  font-weight: var(--font-weight-headings-heavy);

  &.up {
    color: var(--color-strip-rank-up);
  }

  &.down {
    color: var(--color-strip-rank-down);
  }

  &.flat {
    color: var(--color-tooltip-text);
  }
}

/* The way to the stats page, at the row's end, its arrow nudging right on hover like a see-more link. */
.all-stats {
  margin-inline-start: auto;

  & .arrow {
    display: inline-flex;
    transition: transform var(--transition-see-more);
  }

  &:is(:hover, :focus-within) .arrow {
    transform: translateX(var(--space-see-more-nudge));
  }
}

/* Between the Trakt, other sites and community groups, top to bottom of the bar. */
.divider {
  align-self: stretch;
  inline-size: 1px;
  background-color: var(--color-strip-divider);
}

@media (prefers-reduced-motion: reduce) {
  .all-stats .arrow {
    transition: none;
  }
}
</style>
