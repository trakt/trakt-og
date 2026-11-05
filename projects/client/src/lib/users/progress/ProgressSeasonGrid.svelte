<!--
  An open progress row's seasons: each season's name (linking to its page) with what's watched and left (the row's own
  `Stat`s, a size down), then its tick bar and percent, like the show's (exact episodes, or one fill with Simple
  Progress Bars). A season's toggle (`expanded`)
  shows its episodes under it, a numbered pill each. A pill is purple once watched, the library's teal while it's in
  your library but not watched, outlined and pulsing for up next, and dashed until it airs. Each links to its episode,
  with a chart tooltip: the episode on top (its screenshot, with an Up next tag on it, its code and title, then tags for
  its air date, runtime and rating), then yours under it: when you last watched it (`PlaysTip`), or when it was added
  to your library with its format and audio (`LibraryTip`). The episode's section is shaded only when there's
  something of yours under it. Spoiler settings hide an unwatched episode's screenshot and title there, as on the
  episode cards.
  Each season's name is followed by a ••• menu (the summary's), to hide it from your progress, it and every later
  season, or every season after it (`onhide`). Hidden seasons stay out of the list until `showHidden`; then they sit
  in their place, dimmed and tagged Hidden, still able to open, and their menu unhides them (`onunhide`). The focus
  moves to the next season's menu when one goes.
    <ProgressSeasonGrid seasons={row.seasons} hidden={row.hiddenSeasons ?? []} {showHidden} id={row.id} {expanded}
      ontoggle={toggleSeason} {simple} {datePreferences} onhide={hide} onunhide={unhide} />
-->
<script lang="ts">
import { page } from '$app/state';
import { tick } from 'svelte';
import LibraryTip from '$lib/components/collection/LibraryTip.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import type { TagPill } from '$lib/components/labels/TagPill';
import CardTag from '$lib/components/media/CardTag.svelte';
import PlaysTip from '$lib/components/media/PlaysTip.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import TickBar from '$lib/components/media/TickBar.svelte';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import TooltipHeader from '$lib/components/tooltip/TooltipHeader.svelte';
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
import eye from '$lib/icons/regular/eye.svg?raw';
import hourglass from '$lib/icons/regular/hourglass-half.svg?raw';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import lightBan from '$lib/icons/light/ban.svg?raw';
import angleRight from '$lib/icons/solid/angle-right.svg?raw';
import plus from '$lib/icons/solid/plus.svg?raw';
import ban from '$lib/icons/thin/ban.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import { ratingPercent } from '$lib/utils/ratingPercent';
import type { EpisodeSquare, ProgressSeason } from './toProgressSeasons.ts';

interface Props {
  seasons: readonly ProgressSeason[];
  /** The seasons hidden from your progress, listed in their place with `showHidden`. */
  hidden: readonly ProgressSeason[];
  showHidden: boolean;
  onhide: (seasons: readonly number[]) => void;
  onunhide: (seasons: readonly number[]) => void;
  /** The show's id, for the episode lists' ids. */
  id: number;
  /** Whether a season shows its episodes. */
  expanded: (season: number) => boolean;
  ontoggle: (season: number) => void;
  /** The Simple Progress Bars setting, as on the show's bar. */
  simple: boolean;
  /** The library tooltip's added date. */
  datePreferences: DatePreferences;
}

const { seasons, hidden, showHidden, onhide, onunhide, id, expanded, ontoggle, simple, datePreferences }: Props = $props();

let band = $state<HTMLElement>();
const listed = $derived(
  [
    ...seasons.map((season) => ({ season, isHidden: false })),
    ...(showHidden ? hidden.map((season) => ({ season, isHidden: true })) : []),
  ].sort((a, b) => a.season.number - b.season.number),
);
const after = (number: number) => seasons.filter((season) => season.number > number).map((season) => season.number);

const focusMenu = async (number: number | undefined) => {
  await tick();
  const menus = [...(band?.querySelectorAll<HTMLElement>('[data-menu]') ?? [])];
  (menus.find((menu) => menu.dataset.menu === String(number)) ?? menus[0])?.focus();
};

function hide([first, ...rest]: readonly [number, ...number[]], close: () => void) {
  close();
  const numbers = [first, ...rest];
  const at = seasons.findIndex((season) => season.number === first);
  const kept = seasons.filter((season) => !numbers.includes(season.number));
  const neighbor = showHidden ? first : (kept.find((season) => season.number > first) ?? kept[at - 1])?.number;
  onhide(numbers);
  void focusMenu(neighbor);
}

function unhide(number: number, close: () => void) {
  close();
  onunhide([number]);
  void focusMenu(number);
}

const spoilers = (square: EpisodeSquare) =>
  page.data.user
    ? mediaSpoilers({
      spoilers: page.data.settings?.browsing?.spoilers,
      type: 'episode',
      watched: square.state === 'watched',
    })
    : { screenshot: false, title: false };

// The summary's rating heart: its color steps up from gray to red with the rating.
const ratingTag = (rating: number): TagPill => {
  const level = Math.min(Math.trunc(rating), 10);
  return { text: `${ratingPercent(rating)}%`, icon: heart, ...(level > 0 ? { tint: `var(--rating-${level})` } : {}) };
};

/** The air date, runtime and rating, after an Up next tag when there's no screenshot to carry it. */
const tags = (square: EpisodeSquare, art: boolean): readonly TagPill[] => [
  ...(square.state === 'up-next' && !art ? [{ text: 'Up next', kind: 'primary' as const }] : []),
  { text: square.airs },
  ...(square.runtime ? [{ text: square.runtime }] : []),
  ...(square.rating ? [ratingTag(square.rating)] : []),
];

/** An unwatched episode in your library: the overlay's copy, as the quick icon's library tooltip reads it. */
const library = (square: EpisodeSquare, season: number) =>
  square.collected && square.id !== undefined
    ? quickIconFill({
      state: overlay.state('episode', square.id, { show: id, number: season, episode: square.number }),
      datePreferences,
    }).tips.collected
    : undefined;
</script>

{#snippet episode(square: EpisodeSquare)}
  {@const hidden = spoilers(square)}
  {@const art = Boolean(square.image && !hidden.screenshot)}
  {@const title = hidden.title ? undefined : square.title}
  <span class="episode">
    {#if art}
      <span class="art">
        <img src={square.image} alt="" loading="lazy" />
        {#if square.state === 'up-next'}<span class="next-tag"><CardTag text="Up next" /></span>{/if}
      </span>
    {/if}
    <span><span class="code">{title ? `${square.code} ` : square.code}</span>{#if title}<b>{title}</b>{/if}</span>
    <TagPills tags={tags(square, art)} />
  </span>
{/snippet}

{#snippet tip(square: EpisodeSquare, season: number)}
  {@const copy = library(square, season)}
  <span class="tip">
    {#if square.plays || copy}
      <TooltipHeader>{@render episode(square)}</TooltipHeader>
    {:else}
      {@render episode(square)}
    {/if}
    {#if square.plays}<span class="watched"><PlaysTip plays={square.plays} /></span>{/if}
    {#if copy}<LibraryTip tip={copy} />{/if}
  </span>
{/snippet}

<!-- The menu's ban, Drop's weight, with a small badge for the rows that reach past the season. -->
{#snippet banIcon(badge?: string)}
  <span class="ban"><Icon svg={lightBan} fixedWidth />{#if badge}<span class="badge"><Icon svg={badge} /></span>{/if}</span>
{/snippet}

{#snippet stats(season: ProgressSeason)}
  <span class="stats">
    {#if season.announced === undefined}
      <Stat svg={check} tone="watched" value={season.count} noun="watched" />
      {#if season.timeLeft}
        {@const left = season.aired - season.done}
        <Stat svg={hourglass} value={season.timeLeft} noun="left" aside="({left} {left === 1 ? 'ep' : 'eps'})" />
      {/if}
    {:else}
      <Stat svg={calendar} value={String(season.announced)} noun="announced" />
    {/if}
  </span>
{/snippet}

{#snippet bar(season: ProgressSeason)}
  {#if season.announced === undefined}
    <div class={['bar', { complete: season.complete }]}>
      <TickBar runs={season.ticks} percent={season.percent} {simple} size="season"
        label="{season.name}: {season.percent}% watched" />
    </div>
  {/if}
{/snippet}

<!-- Season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="band" bind:this={band}>
<ul class="seasons" id="progress-{id}-seasons">
  {#each listed as { season, isHidden } (season.number)}
    {@const open = expanded(season.number)}
    {@const list = `progress-${id}-season-${season.number}`}
    <li class={['season', { 'is-hidden': isHidden }]}>
      <p class="head">
        <button type="button" class="fold" aria-expanded={open} aria-controls={list}
          aria-label="{open ? 'Hide' : 'Show'} {season.name} episodes" onclick={() => ontoggle(season.number)}>
          <Icon svg={caretDown} />
        </button>
        <a class="name" href={season.href}>{season.name}</a>
        {#if season.title}<span class="season-title">{season.title}</span>{/if}
        <span class="season-menu">
        <SummaryActionMenu label="{season.name} actions" placement="bottom">
          {#snippet trigger(attrs)}
            <button type="button" class="more" data-menu={season.number} {...attrs}><Icon svg={ellipsis} /></button>
          {/snippet}
          {#snippet children(close)}
            {#if isHidden}
              <button type="button" class="row" onclick={() => unhide(season.number, close)}><Icon svg={eye}
                  fixedWidth />Unhide {season.name}</button>
            {:else}
              {@const [next, ...rest] = after(season.number)}
              <button type="button" class="row" onclick={() => hide([season.number], close)}>{@render
                banIcon()}Hide {season.name}</button>
              {#if next !== undefined}
                <button type="button" class="row" onclick={() => hide([season.number, next, ...rest], close)}>{@render
                  banIcon(plus)}Hide {season.name} and later</button>
                <button type="button" class="row" onclick={() => hide([next, ...rest], close)}>{@render
                  banIcon(angleRight)}Hide every season after {season.name}</button>
              {/if}
            {/if}
          {/snippet}
        </SummaryActionMenu>
        </span>
        {#if isHidden}
          <TagPills tags={[{ text: 'Hidden', icon: ban, tint: 'var(--color-progress-season-hidden-tag)' }]} />
        {/if}
        {@render stats(season)}
      </p>
      {@render bar(season)}
      <div class="episodes" id={list} hidden={!open}>
        {#if open}
      <ul class="squares" aria-label="{season.name} episodes">
        {#each season.squares as square (square.code)}
          <li>
            <Tooltip toggles>
              {#snippet trigger(tooltip)}
                <a class={['square', square.state, { collected: square.collected }]} href={square.href}
                  aria-label={square.label} {...tooltip}>{square.number}</a>
              {/snippet}
              {@render tip(square, season.number)}
            </Tooltip>
          </li>
        {/each}
      </ul>
        {/if}
      </div>
    </li>
  {/each}
</ul>

</div>

<style>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.band {
  display: grid;
  padding: var(--progress-band-padding);
  border-radius: var(--radius-progress-band);
  background: var(--color-progress-band);
  font-size: var(--font-size-progress-row);
}

.seasons {
  display: grid;
}

/* The season's ••• after its name, quiet until the pointer, focus or its open menu is on it. */
.more {
  display: grid;
  place-items: center;
  inline-size: var(--progress-season-fold);
  block-size: var(--progress-season-fold);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-round);
  background: none;
  color: var(--color-progress-season-menu);
  font-size: var(--font-size-progress-season-menu-icon);
  cursor: pointer;

  &:is(:hover, :focus-visible, [aria-expanded='true']) {
    background: var(--color-control-hover-bg);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }
}

/* The menu opens rightward from its ••• near the band's left edge. */
.season-menu {
  display: flex;

  & :global(.menu) {
    position-area: bottom span-right;
  }
}

/* The menu's rows as the status menu draws them: icons in the text's color and size, close to their label. */
.season-menu .row {
  gap: var(--space-menu-icon);

  & :global(.icon) {
    color: inherit;
    font-size: inherit;
  }
}

/* Classic's ban turns sideways, in the menu and on the Hidden tag. */
.ban > :global(.icon),
.is-hidden :global(.tag-pills .icon) {
  rotate: 90deg;
}

.ban {
  position: relative;
  display: inline-flex;
}

/* A plus (this and later) or a chevron (every one after) on the ban's lower corner, cut out of the row. */
.badge {
  position: absolute;
  inset-block-end: var(--progress-season-badge-inset);
  inset-inline-end: var(--progress-season-badge-inset);
  display: grid;
  place-items: center;
  inline-size: var(--progress-season-badge);
  block-size: var(--progress-season-badge);
  border-radius: var(--radius-round);
  background: var(--color-menu-bg);
  font-size: var(--font-size-progress-season-badge-icon);

  .row:is(:hover, :focus-visible) & {
    background: var(--color-menu-row-hover);
  }
}

/* A hidden season, shown in its place: dimmed except for its controls. */
.is-hidden :is(.name, .season-title, .stats, .bar, .episodes) {
  opacity: var(--opacity-progress-season-hidden);
}

/* A header line (name, stats, bar, percent), then the pills across the full width. The percent's column is fixed,
   so every season's bar ends at the same point and the percents line up. */
/* The name and stats, then the bar and its percent, then the episodes once shown. */
.season {
  display: grid;
  grid-template-areas: 'head' 'bar' 'episodes';
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  column-gap: var(--progress-season-columns);
  padding-block: var(--progress-season-padding);

  & + & {
    border-block-start: 1px solid var(--color-progress-season-rule);
  }
}

.head {
  grid-area: head;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-season-stats-gap) var(--progress-season-title-gap);
  min-inline-size: 0;
  margin: 0 0 var(--progress-season-head-gap);
  line-height: var(--line-height-progress-season-name);

  & .season-title {
    color: var(--color-text-muted);
    font-size: var(--font-size-small);
  }
}

/* A season's episodes toggle: a caret that turns down once they show. */
.fold {
  display: grid;
  place-items: center;
  inline-size: var(--progress-season-fold);
  block-size: var(--progress-season-fold);
  min-block-size: 0;
  padding: 0;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
  color: var(--color-control-text);
  cursor: pointer;

  & :global(.icon) {
    font-size: var(--font-size-progress-toggle-icon);
    rotate: -90deg;
    transition: rotate 0.2s;
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 0deg;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background: var(--color-control-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }
}

.name {
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-progress-season-name);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-progress-watched-text);
    text-decoration: underline;
  }
}

/* What's watched and left, as the row's own stats a size down, after the name. */
.stats {
  --font-size-stat-icon: var(--font-size-progress-season-stat-icon);
  --font-size-stat-number: var(--font-size-progress-season-stat-number);
  --font-size-stat-noun: var(--font-size-progress-season-stat-noun);

  display: flex;
  flex-wrap: wrap;
  gap: var(--progress-season-stats-gap) var(--progress-season-stat-gap);
  margin-inline-start: var(--progress-season-stats-offset);
  font-variant-numeric: tabular-nums;
}

.episodes {
  grid-area: episodes;
  margin-block-start: var(--progress-season-episodes-gap);
}

/* The season's tick bar: its percent in a fixed column, so every bar ends at the same point and the percents line up,
   and purple once the season is done. */
.bar {
  --tick-bar-height-season: var(--progress-season-bar-height);
  --font-size-tick-bar-percent-season: var(--font-size-progress-season-percent);
  --tick-bar-percent-season-nudge: 0;

  grid-area: bar;
  min-inline-size: 0;

  & :global(.tick-bar) {
    grid-template-columns: minmax(0, 1fr) var(--progress-season-percent);
    align-items: center;
    column-gap: var(--progress-season-columns);
  }

  & :global(.track) {
    border-radius: var(--radius-progress-season-bar);
  }

  & :global(.percent) {
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }

  &.complete :global(.percent) {
    color: var(--color-progress-percent-done);
  }
}

.squares {
  display: flex;
  flex-wrap: wrap;
  gap: var(--progress-square-gap);
}

.square {
  display: grid;
  place-items: center;
  inline-size: var(--progress-square);
  block-size: var(--progress-square-height);
  border-radius: var(--radius-progress-square);
  background: var(--color-progress-square);
  color: var(--color-text-muted);
  font: var(--font-weight-headings-heavy) var(--font-size-progress-square) / 1 var(--font-headings);
  font-variant-numeric: tabular-nums;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    outline: var(--progress-square-ring) solid var(--color-text);
    outline-offset: 1px;
  }

  &.watched {
    background: var(--color-progress-watched);
    color: var(--color-text-inverse);
  }

  &.collected {
    background: var(--color-progress-collected);
    color: var(--color-text-inverse);
  }

  &.up-next {
    box-shadow: inset 0 0 0 var(--progress-square-ring) var(--brand-primary);
    color: var(--brand-primary);
    animation: pulse var(--progress-cell-pulse-duration) ease-out infinite;

    &:not(.collected) {
      background: none;
    }

    &.collected {
      color: var(--color-text-inverse);
    }
  }

  &.not-aired {
    background: none;
    box-shadow: inset 0 0 0 1px var(--color-progress-square-announced);
  }
}

@keyframes pulse {
  0% {
    box-shadow: inset 0 0 0 var(--progress-square-ring) var(--brand-primary), 0 0 0 0 var(--color-progress-cell-pulse);
  }

  70%,
  100% {
    box-shadow:
      inset 0 0 0 var(--progress-square-ring) var(--brand-primary),
      0 0 0 var(--progress-cell-pulse) transparent;
  }
}

/* The episode, centered: its screenshot, its code and title on one line, then its tags. */
.tip {
  display: grid;
  inline-size: var(--progress-tip-width);
}

/* The tooltip is dark in both themes, so its tags take their dark colors. */
.episode {
  color-scheme: dark;
  display: grid;
  justify-items: center;
  gap: var(--progress-tip-gap);
  padding: var(--space-tooltip-rich);
  padding-block-end: var(--progress-tip-episode-end);

  /* The screenshot sits as far from the top as from the sides. */
  &:has(> .art) {
    padding-block-start: var(--progress-tip-image-top);
  }

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }

  & :global(.tag-pills) {
    justify-content: center;
  }
}

/* The screenshot, with an Up next tag over its bottom-left corner like a fanart card's. */
.art {
  position: relative;
  inline-size: 100%;

  & img {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-fanart);
    border-radius: var(--radius-progress-tip-image);
    object-fit: cover;
  }
}

.next-tag {
  position: absolute;
  inset-block-end: var(--progress-tip-tag-inset);
  inset-inline-start: var(--progress-tip-tag-inset);
  display: flex;
}

.code {
  color: var(--color-tooltip-muted);
}

.watched {
  padding: var(--space-tooltip-library);
}

@media (prefers-reduced-motion: reduce) {
  .square.up-next {
    animation: none;
  }

  .fold :global(.icon) {
    transition: none;
  }
}
</style>
