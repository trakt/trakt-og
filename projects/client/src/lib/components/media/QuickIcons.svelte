<!--
  OG's quick-icon bar under a poster or fanart card: watch, library, list, optional favorite, watch now and hide on
  the left, the Trakt rating on the right. Watch, rating and favorites use shared browser controls.
-->
<script lang="ts">
import { openWatchNow } from '$lib/components/watchnow/watchNowLauncher.svelte';
import { watchNowPath } from '$lib/components/watchnow/watchNowPath';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import Spinner from '$lib/components/loading/Spinner.svelte';
import MediaFavorite from '$lib/components/favorites/MediaFavorite.svelte';
import type { FavoriteTarget } from '$lib/favorites/FavoriteTarget';
import MediaRating from '$lib/components/rating/MediaRating.svelte';
import MediaCollection from '$lib/components/collection/MediaCollection.svelte';
import { LIBRARY_ADDING } from '$lib/components/collection/libraryAdding';
import LibrarySyncLink from '$lib/components/collection/LibrarySyncLink.svelte';
import { librarySourceIcon } from '$lib/components/collection/librarySourceIcon';
import MediaWatch from '$lib/components/history/MediaWatch.svelte';
import type { HistoryPlay } from '$lib/components/history/HistoryPlay';
import type { WatchTarget } from '$lib/components/history/WatchTarget';
import type { RatingTarget } from '$lib/components/rating/RatingTarget';
import MediaList from '$lib/components/lists/MediaList.svelte';
import type { ListTarget } from '$lib/components/lists/ListTarget';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import minus from '$lib/icons/regular/circle-minus.svg?raw';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import type { VisibilityTarget } from '$lib/components/visibility/VisibilityTarget';
import backward from '$lib/icons/solid/backward.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import ticket from '$lib/icons/solid/ticket.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import list from '$lib/icons/trakt/list-thick.svg?raw';
import type { QuickIconFill } from './quickIconFill.ts';
import type { QuickIconMore } from './QuickIconMore.ts';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import lightBackward from '$lib/icons/light/backward.svg?raw';
import { ratingPercent } from '../../utils/ratingPercent.ts';

interface Props {
  fill: QuickIconFill;
  /** The Trakt rating, 0 to 10. Left out, no percentage shows. */
  rating?: number;
  /** False for future or undated items, which show no rating. */
  released?: boolean;
  ratingTarget?: RatingTarget;
  watchTarget?: WatchTarget;
  collectionTarget?: WatchTarget;
  historyPlay?: HistoryPlay;
  onWatchRemove?: (play?: HistoryPlay) => void;
  onWatchSave?: (watchedAt: string | null) => void;
  onCollectionRemove?: () => void;
  onCollectionSave?: (collectedAt: string | null | undefined) => void;
  listTarget?: ListTarget;
  /** Poster cards use the 35px bar; fanart cards the 40px one. */
  small?: boolean;
  /** Tight text-card actions, like OG calendar schedules. */
  compact?: boolean;
  /**
   * In a list row instead of under a poster: no bar, each action a rounded tool in its own color. Hovered, done and
   * part-done actions keep the bar's fills.
   */
  row?: boolean;
  /** Only where OG turned it on (charts). */
  favorite?: boolean;
  /** For season/episode stars, pass the parent show. */
  favoriteTarget?: FavoriteTarget;
  /**
   * On by default: every bar gets a watch-now icon that opens the page's Watch Now dialog, for the first target it can
   * find the item's API path from (a season or episode needs its show and number); with none, there's no icon.
   * `cinema` swaps the play icon for a ticket, for movies only in cinemas. `false` leaves it out, beside a Watch now
   * button of its own (the chart hero).
   */
  watchNow?: 'play' | 'cinema' | false;
  /** The card's fanart, for the Watch Now dialog's header. Left out, the dialog fetches the item's own. */
  watchNowArt?: string;
  /** What Watch Now opens, for a bar with no other target to find it from (a profile's history, a comment's poster). */
  watchNowTarget?: WatchTarget;
  /** Names the thing being hidden ("show", "movie"). Left out, no hide icon. */
  hide?: string;
  hideTarget?: VisibilityTarget;
  hideSection?: 'calendar' | 'recommendations' | 'progress_watched' | 'progress_collected' | 'dropped';
  /** The ••• menu's rows, after the other icons. Left out or empty, no •••. */
  more?: readonly QuickIconMore[];
  /** "Add to watchlist" on movies and shows; "Add to list" on seasons and episodes. */
  listLabel?: string;
}

const {
  fill,
  rating,
  released,
  ratingTarget,
  watchTarget,
  collectionTarget,
  historyPlay,
  onWatchRemove,
  onWatchSave,
  onCollectionRemove,
  onCollectionSave,
  listTarget,
  small = false,
  compact = false,
  row = false,
  favorite = false,
  favoriteTarget,
  watchNow = 'play',
  watchNowArt,
  watchNowTarget,
  hide,
  hideTarget,
  hideSection = 'recommendations',
  more = [],
  listLabel = 'Add to watchlist',
}: Props = $props();

let moreButton = $state<HTMLButtonElement>();
// The drop prompt sits by the ••• itself: a visible anchor, so no browser hides the prompt for want of one. It's
// on the button's fill layer, as the tooltip names the button.
const uid = $props.id();
const moreAnchor = `--quick-more-${uid}`;
// The ••• rows that open a prompt, by kind: each one's control sits outside the menu.
const prompts = $state<Record<string, { openPrompt: () => Promise<void> } | undefined>>({});
const menuWatchNow = $derived(more.some((row) => row.kind === 'watch-now'));
const promptRows = $derived(more.filter((row) => row.kind !== 'watch-now'));
const menuRows = $derived(more.filter((row) => row.kind !== 'watch-now' || watchNowItem));
const watchNowItem = $derived.by(() => {
  for (const candidate of [watchNowTarget, watchTarget, collectionTarget, ratingTarget, listTarget, hideTarget]) {
    const path = candidate && watchNowPath(candidate);
    if (candidate && path) return { path, title: candidate.title, fanart: watchNowArt };
  }
  return undefined;
});
const target = $derived(
  favoriteTarget ??
    (ratingTarget?.type === 'movie' || ratingTarget?.type === 'show'
      ? { ...ratingTarget, type: ratingTarget.type }
      : undefined),
);
const hiddenTarget = $derived(
  hideTarget ??
    (ratingTarget?.type === 'movie' || ratingTarget?.type === 'show' || ratingTarget?.type === 'season'
      ? { ...ratingTarget, type: ratingTarget.type }
      : undefined),
);
const targetList = $derived(listTarget ?? ratingTarget);

// API: integer rating, so 7.9 is still rating-7. OG had no rating-0 color and fell back to rating-1's gray.
// An unreleased item's watch icon is locked, and its card loses "Watching now".
const historyTarget = $derived.by(() => {
  const target = watchTarget ?? ratingTarget;
  return target && released === false ? { ...target, released } : target;
});
const libraryTarget = $derived(collectionTarget ?? historyTarget);
const ratingLevel = $derived(rating === undefined ? 1 : Math.min(Math.max(Math.trunc(rating), 1), 10));
</script>

<!-- `label` names the action; `title` is the tooltip, which says what's done once it is. -->
{#snippet action(kind: string, svg: string, label: string, amount: number, title = label, onclick?: () => void)}
  <Tooltip text={title} placement="bottom">
    {#snippet trigger(tooltip)}
      <button
        type="button"
        class={['action', kind, { selected: amount > 0 }]}
        style:--fill={amount}
        aria-label={label}
        {onclick}
        {...tooltip}
      >
        <span class="base"></span>
        <Icon {svg} />
      </button>
    {/snippet}
  </Tooltip>
{/snippet}

<div class={['quick-icons', { small, compact, row }]}>
  <div class="actions">
    <!-- A row draws the tools and the ••• as separate outlined groups; on a card they're one run of icons. -->
    <div class="tools">
    {#if historyTarget}
      <MediaWatch target={historyTarget} play={historyPlay} onremove={onWatchRemove} onsave={onWatchSave} {small} />
    {:else}
    {@render action(
      fill.rewatching ? 'watch rewatching' : 'watch',
      fill.rewatching ? backward : check,
      'Add to watched history',
      fill.watched,
      fill.titles.watched,
    )}
    {/if}
    {#if libraryTarget}<MediaCollection target={libraryTarget} onremove={onCollectionRemove} onsave={onCollectionSave} {small} />{:else if !LIBRARY_ADDING && fill.collected === 0}<LibrarySyncLink {small} />{:else}{@render action('collect', librarySourceIcon(fill.sources)?.svg ?? collection, 'Add to library', fill.collected, fill.titles.collected)}{/if}
    {#if targetList}
      <MediaList target={targetList} {small} />
    {:else}
      {@render action('list', list, listLabel, fill.listed ? 1 : 0, fill.titles.listed)}
    {/if}
    {#if favorite}
      {#if target}
        <MediaFavorite {target}>
          {#snippet trigger({ selected, date, busy, locked, toggle })}
            <Tooltip text={locked ?? (selected ? date ? `Favorited on\n${date}` : 'Favorited' : 'Add to favorites')} placement="bottom">
              {#snippet trigger(tooltip)}
                <button type="button" class={['action', 'favorite', { selected, locked }]} style:--fill={selected ? 1 : 0} aria-label={selected ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={selected} aria-busy={busy} aria-disabled={busy || Boolean(locked)} onclick={toggle} {...tooltip}>
                  <span class="base"></span>{#if busy}<Spinner label="Saving favorite" />{:else}<Icon svg={star} />{/if}
                </button>
              {/snippet}
            </Tooltip>
          {/snippet}
        </MediaFavorite>
      {:else}
        {@render action('favorite', star, 'Add to favorites', fill.favorited ? 1 : 0, fill.titles.favorited)}
      {/if}
    {/if}
    {#if watchNow && watchNowItem && !menuWatchNow}
      {@const item = watchNowItem}
      {@render action('watch-now', watchNow === 'cinema' ? ticket : play, 'Watch now', 0, 'Watch now', () => openWatchNow(item))}
    {/if}
    {#if hide}
      {#if hiddenTarget}
        <VisibilityControl target={hiddenTarget} action={hideSection === 'dropped' ? 'drop' : 'hide'} section={hideSection === 'dropped' ? undefined : hideSection} variant="card" {small}><span class:ban={hideSection !== 'dropped'}><Icon svg={hideSection === 'dropped' ? minus : ban} /></span></VisibilityControl>
      {:else}{@render action('ignore', ban, `Hide this ${hide}`, 0)}{/if}
    {/if}
    </div>
    {#if menuRows.length > 0}
      <div class="more-group">
      <!-- A row closes the menu, then opens its prompt beside the •••, so the prompt never nests in the menu. -->
      <SummaryActionMenu label="More" placement="bottom">
        {#snippet trigger(attrs)}
          <button bind:this={moreButton} type="button" class={['action', 'more']} {...attrs}><span class="base" style:anchor-name={moreAnchor}></span><Icon svg={ellipsis} /></button>
        {/snippet}
        {#snippet children(close)}
          {#each menuRows as row (row.kind)}
            {#if row.kind === 'watch-now'}
              {#if watchNowItem}
                {@const item = watchNowItem}
                <button type="button" aria-haspopup="dialog" onclick={() => { close(); openWatchNow(item); }}>
                  <Icon svg={watchNow === 'cinema' ? ticket : play} fixedWidth />Watch now
                </button>
              {/if}
            {:else}
              <button type="button" onclick={() => { close(); void prompts[row.kind]?.openPrompt(); }}>
                <Icon svg={row.kind === 'rewatch' ? lightBackward : circleMinus} fixedWidth />{row.kind === 'rewatch'
                  ? 'Rewatch'
                  : 'Drop'} {row.target.type}
              </button>
            {/if}
          {/each}
        {/snippet}
      </SummaryActionMenu>
      {#each promptRows as row (row.kind)}
        <VisibilityControl bind:this={prompts[row.kind]} target={row.target} action={row.kind} onsave={row.onsave}
          headless returnFocus={moreButton} anchor={moreAnchor} />
      {/each}
      </div>
    {/if}
  </div>
  {#if rating !== undefined && released !== false}
    <MediaSpoiler target={watchTarget ?? collectionTarget ?? ratingTarget} kind="rating">
    {#if ratingTarget}
      <MediaRating target={ratingTarget}>
        {#snippet trigger()}
          <span class="percentage"><span class="heart" style:color="var(--rating-{ratingLevel})"><Icon svg={heart} /></span><span class="value">{ratingPercent(rating)}%</span></span>
        {/snippet}
      </MediaRating>
    {:else}
      <p class="percentage"><span class="heart" style:color="var(--rating-{ratingLevel})"><Icon svg={heart} /></span><span class="value">{ratingPercent(rating)}%</span></p>
    {/if}
    </MediaSpoiler>
  {/if}
</div>

<style>
.quick-icons {
  --bar: 40px;
  --action-width: 35px;
  display: flex;
  justify-content: space-between;
  block-size: var(--bar);
  overflow: hidden;
  white-space: nowrap;
  /* Picked here, not in the tokens, so a panel's own --color-card-bg still colors the dark bar. */
  background-color: light-dark(var(--color-quick-icons-light-bg), var(--color-card-bg));
  color: light-dark(var(--color-quick-icons-light-text), var(--color-card-text));

  &.small {
    --bar: 35px;
    --action-width: 28px;
  }
}

.quick-icons.compact {
  --bar: var(--quick-icons-compact-height);
  --action-width: var(--quick-icons-compact-width);
  --watch-card-small-height: var(--quick-icons-compact-height);
  --watch-card-small-width: var(--quick-icons-compact-width);
  --list-card-small-height: var(--quick-icons-compact-height);
  --list-card-small-width: var(--quick-icons-compact-width);
  --font-size-quick-icon-small: var(--quick-icons-compact-size);
  & .action {
    font-size: var(--quick-icons-compact-size);
  }
}
.actions {
  display: flex;
}

.tools,
.more-group {
  display: contents;
}

.action {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: var(--action-width);
  block-size: var(--bar);
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color);
  font-size: var(--font-size-quick-icon);
  line-height: 1;
  cursor: pointer;

  .small & {
    block-size: calc(var(--bar) - 1px);
    font-size: var(--font-size-quick-icon-small);
  }

  /* The coloured layer behind the glyph. Shows and seasons fill it partway, as opacity. */
  .base {
    position: absolute;
    inset: 0;
    background-color: var(--color);
    opacity: 0;
    transition: opacity var(--transition-card);
  }

  & :global(.icon) {
    position: relative;
  }

  /* The saving spinner, a size under the glyph it stands in for. */
  & :global(.spinner) {
    position: relative;
    font-size: var(--font-size-quick-icon-busy);

    .small & {
      font-size: var(--font-size-quick-icon-busy-small);
    }
  }

  &:is(.watch:not(.rewatching), .collect, .list) :global(.icon) {
    --icon-shift: var(--quick-icon-trakt-shift);
  }

  &:is(:hover, :focus-visible, .selected) {
    color: var(--color-card-text);
  }

  &.selected .base {
    opacity: var(--fill);
  }

  &:is(:hover, :focus-visible) .base {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-card-text);
    outline-offset: -2px;
  }
}

.watch {
  --color: var(--brand-tertiary);
}

.rewatching :global(.icon) {
  font-size: 0.9em;
}

.collect {
  --color: var(--brand-quaternary);
}

.list {
  --color: var(--brand-fifth);
}

.favorite {
  --color: var(--brand-seventh);

  & :global(.icon) {
    font-size: var(--font-size-quick-icon-favorite);
  }

  /* Locked until watched: faded, and the tooltip says why. */
  &.locked {
    cursor: not-allowed;
    opacity: var(--opacity-action-disabled);
  }
}

/* The ••• in the watch-now gray, its fill gray like the hide icon's. */
.more {
  --color: var(--gray);
  color: var(--color-watch-now);
}

.ban {
  rotate: 90deg;
  font-size: var(--quick-icon-hide-scale);
}

.ignore {
  --color: var(--gray);
}

.watch-now {
  --color: var(--gray);
  color: var(--color-watch-now);
}

.percentage {
  display: flex;
  align-items: center;
  block-size: var(--bar);
  margin: 0;
  padding-inline-end: 10px;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-rating);
  line-height: 1;

  .small & {
    block-size: calc(var(--bar) - 1px);
    padding-inline-end: 5px;
    font-size: var(--font-size-rating-small);
  }
}
/* Trimmed to the digits' cap height, so centering lines them up with the icons, not the font's line box. */
.value {
  text-box: trim-both cap alphabetic;
}

.heart {
  display: flex;
  margin-inline-end: 5px;
  font-size: var(--font-size-rating-heart);

  .small & {
    margin-inline-end: 4px;
    font-size: var(--font-size-rating-small);
  }
}

/*
  A row's tools: one outlined control on the page, like joined controls, at the row's end. The watch, library, list
  and watch-now icons come first, then the ••• and the rating, each set off by a divider. Every icon, the ones other
  controls draw too, is the same square inside the border.
*/
.quick-icons.row {
  --bar: var(--quick-icons-row-cell);
  --action-width: var(--quick-icons-row-cell);
  --watch-card-width: var(--quick-icons-row-cell);
  --watch-card-height: var(--quick-icons-row-cell);
  --watch-card-small-width: var(--quick-icons-row-cell);
  --watch-card-small-height: var(--quick-icons-row-cell);
  --list-card-width: var(--quick-icons-row-cell);
  --list-card-height: var(--quick-icons-row-cell);
  --list-card-small-width: var(--quick-icons-row-cell);
  --list-card-small-height: var(--quick-icons-row-cell);
  align-items: center;
  inline-size: max-content;
  block-size: auto;
  margin-inline-start: auto;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-text);

  & :is(.tools, .more-group) {
    display: flex;
    align-items: center;
  }

  & :is(.more-group, .percentage) {
    border-inline-start: 1px solid var(--color-control-border);
  }

  & .action {
    block-size: var(--bar);
  }

  & .percentage {
    block-size: var(--quick-icons-row-cell);
    padding-inline: var(--quick-icons-row-rating-padding);
  }

  & .heart {
    block-size: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .action .base {
    transition: none;
  }
}
</style>
