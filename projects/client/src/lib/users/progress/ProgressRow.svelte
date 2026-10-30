<!--
  One show on the progress page, as a ledger row: the poster, stamped on the Dropped tab; the title, its status menu (`ProgressStatus`), the tick
  bar, the counts as stats, then Seasons beside a chip in the watched tag's colors linking the episode you last watched; then the up-next card,
  og's fanart card for the next episode with its quick icons, or the show's once every episode is done. The poster and
  the card are the same height, and the text about matches them. Seasons reads the show's catalog (`onneed`) and
  opens the season list across the whole row, under the poster and the card (`ProgressSeasonGrid`), shimmering
  seasons holding its place until the catalog lands; once read, the
  show's bar splits into its seasons on hover, each with a chart tip. A drop or restore
  fades the row out and moves the focus on.
-->
<script lang="ts">
import { nearViewport } from '$lib/utils/nearViewport';
import { SvelteSet } from 'svelte/reactivity';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import DroppedBadge from '$lib/components/media/DroppedBadge.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import { removeCard } from '$lib/components/media/removeCard';
import TickBar from '$lib/components/media/TickBar.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import hourglass from '$lib/icons/regular/hourglass-half.svg?raw';
import history from '$lib/icons/regular/clock-rotate-left.svg?raw';
import play from '$lib/icons/regular/play.svg?raw';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import ProgressSeasonGrid from './ProgressSeasonGrid.svelte';
import ProgressStatus from './ProgressStatus.svelte';
import type { ProgressType } from './progressTypes.ts';
import type { ProgressRow } from './toProgressRow.ts';
import type { ProgressSeason } from './toProgressSeasons.ts';

interface Props {
  row: ProgressRow;
  type: ProgressType;
  simple: boolean;
  datePreferences: DatePreferences;
  /** The row's seasons opened, or its next episode was watched: read the show's catalog. */
  onneed?: () => void;
  /** The catalog read is in flight. */
  loading?: boolean;
}

const { row, type, simple, datePreferences, onneed, loading = false }: Props = $props();

let open = $state(false);
// Which seasons show their episodes: each season's own toggle.
const flipped = new SvelteSet<number>();
const expanded = (season: number) => flipped.has(season);
let article = $state<HTMLElement>();
// Read only when the row leaves: paging and filtering aren't removals.
let removedByAction = false;

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
const tipColor = (tone: string) => `var(--color-progress-tip-${tone})`;
const seasonStats = (season: ProgressSeason) => [
  {
    label: season.name,
    value: `${season.percent}%`,
    lines: [
      { text: `${season.count} watched`, color: tipColor('watched') },
      ...(season.timeLeft ? [{ text: `${season.timeLeft} left`, color: tipColor('time') }] : []),
      ...(season.collected > 0 ? [{ text: `${season.collected} in your library`, color: tipColor('collected') }] : []),
      ...(season.upNext ? [{ text: `Up next ${season.upNext}`, color: tipColor('next') }] : []),
      ...(season.lastWatched ? [{ text: `Last watched ${season.lastWatched}`, color: tipColor('muted') }] : []),
    ],
  },
];
const count = (n: number) => n.toLocaleString('en-US');
const showTarget = $derived({ type: 'show' as const, id: row.id, title: row.title, airedEpisodes: row.aired });
const caughtUp = $derived(type === 'dropped' ? 'Dropped' : 'Caught up');
// Episodes left but no next one: the endpoint sends none for a show you haven't started (or a list's show it left out),
// so the row reads its catalog as it nears the screen, and the card isn't "Caught up" meanwhile.
const findsNext = $derived(type !== 'dropped' && !row.upNext && row.left > 0);

/** Drop, hide and restore: the focus moves to the next row's title before this one fades out. */
function remove(saved: Promise<boolean>) {
  const rows = [...(article?.parentElement?.querySelectorAll<HTMLElement>(':scope > .progress-row') ?? [])];
  const index = rows.findIndex((candidate) => candidate === article);
  const nextRow = [...rows.slice(index + 1), ...rows.slice(0, index).toReversed()].at(0);
  const section = article?.closest<HTMLElement>('section');
  removedByAction = true;
  if (nextRow) {
    nextRow.querySelector<HTMLElement>('a.titles-link')?.focus({ preventScroll: true });
  } else if (section) {
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }
  void saved.then((kept) => {
    if (!kept) removedByAction = false;
  });
}

function toggle() {
  open = !open;
  if (open) onneed?.();
}

function toggleSeason(season: number) {
  if (flipped.has(season)) flipped.delete(season);
  else flipped.add(season);
}
</script>

<!-- Show, season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<!-- Once the seasons are read, the show's bar splits into them on hover, each with its breakdown. The season list
     carries the same numbers for the keyboard and screen readers. -->
{#snippet sections()}
  {#each row.seasons?.filter(({ aired }) => aired > 0) ?? [] as season (season.number)}
    <Tooltip toggles stats={seasonStats(season)}>
      {#snippet trigger(tooltip)}
        <span class="section" style:flex-grow={season.aired} aria-hidden="true" {...tooltip}></span>
      {/snippet}
    </Tooltip>
  {/each}
{/snippet}

<!-- The season list's band while the catalog is read: each season's toggle, name, stats, bar and percent. -->
{#snippet seasonShimmers()}
  <div class="season-shimmers">
    {#each Array.from({ length: 3 }, (_, i) => i) as season (season)}
      <div class="season-shimmer">
        <span class="season-head">
          <Shimmer inline="var(--progress-season-fold)" block="var(--progress-season-fold)" />
          <Shimmer inline="var(--progress-shimmer-season-name-width)" block="var(--font-size-progress-season-name)" />
          <Shimmer inline="var(--progress-shimmer-season-stats-width)" block="var(--font-size-progress-season-stat-number)" />
        </span>
        <span class="season-bar">
          <Shimmer inline="100%" block="var(--progress-season-bar-height)" />
          <Shimmer inline="var(--progress-season-percent)" block="var(--font-size-progress-season-percent)" />
        </span>
      </div>
    {/each}
  </div>
{/snippet}

<article bind:this={article} class="progress-row" aria-labelledby="progress-{row.id}"
  {@attach nearViewport(() => { if (findsNext) onneed?.(); })}
  out:removeCard|global={() => removedByAction}>
  <a class={['poster', { dropped: type === 'dropped' }]} href={row.href} tabindex="-1" aria-hidden="true">
    {#if row.poster}
      <img src={row.poster} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="placeholder"></span>
    {/if}
    {#if type === 'dropped'}<DroppedBadge />{/if}
  </a>

  <div class="main-info">
    <div class="show-title">
      <h3 class="title" id="progress-{row.id}"><a class="titles-link" href={row.href}>{row.title}</a></h3>
      {#if row.year}<span class="year">{row.year}</span>{/if}
      <ProgressStatus {row} {type} onremove={remove} />
    </div>

    <TickBar runs={row.ticks} percent={row.percent} {simple}
      label={`${row.title}: ${row.percent}% watched`} overlay={row.seasons ? sections : undefined} />

    <p class="stats">
      <Stat svg={check} tone="watched" value="{count(row.completed)} / {count(row.aired)}" noun="watched"
        label="Episodes watched" />
      <Stat svg={play} value={count(row.plays)} noun={plural(row.plays, 'play')} label="Plays"
        under="Rewatches included" />
      <Stat svg={history} value={row.watchedTime} noun="watched" label="Time watched" />
      {#if row.left > 0}
        <Stat svg={hourglass} value={row.leftTime} noun="left" label="Left to watch"
          aside="({count(row.left)} {plural(row.left, 'ep')})" />
      {/if}
    </p>

    <div class="actions">
      <button type="button" class="toggle" aria-expanded={open} aria-controls="progress-seasons-{row.id}"
        onclick={toggle}>Seasons<Icon svg={caretDown} /></button>
      {#if row.last}
        <a class="last" href={row.last.href ?? row.href}><Icon svg={history} />Last watched
          {#if row.last.number}<b>{row.last.number}</b>{row.last.title ? ` ${row.last.title}` : ''}{/if}
          {row.last.relative ?? row.last.date}</a>
      {/if}
    </div>
  </div>

  <div class="card">
    {#if row.upNext}
      {@const next = row.upNext}
      <FanartCard framed href={next.href} title={next.title} number={next.number} image={next.image}
        spoilerImage={next.spoilerImage} tags={next.tags}
        icons={{
          fill: quickIconFill({
            state: overlay.state('episode', next.target.id, next.target.season),
            runtime: next.target.runtime,
            datePreferences,
          }),
          ratingTarget: { type: 'episode', id: next.target.id, title: next.target.title },
          watchTarget: next.target,
          collectionTarget: next.target,
          rating: next.rating,
          released: next.released,
          listLabel: 'Add to list',
          onWatchSave: () => onneed?.(),
        }} />
    {:else}
      <FanartCard framed href={row.href} title={row.status ?? row.title} image={row.fanart}
        tags={findsNext ? [] : [{ text: caughtUp, kind: 'generic' }]}
        icons={{
          fill: quickIconFill({ state: overlay.state('show', row.id), airedEpisodes: row.aired, datePreferences }),
          ratingTarget: { type: 'show', id: row.id, title: row.title },
          watchTarget: showTarget,
          rating: row.rating,
        }} />
    {/if}
  </div>

  <div class="seasons" id="progress-seasons-{row.id}" hidden={!open} aria-busy={open && loading && !row.seasons}>
    {#if open && row.seasons}
      <ProgressSeasonGrid seasons={row.seasons} id={row.id} {expanded} ontoggle={toggleSeason} {simple}
        {datePreferences} />
    {:else if open && loading}
      {@render seasonShimmers()}
    {/if}
  </div>
</article>

<style>
.progress-row {
  display: grid;
  grid-template-columns: var(--progress-poster-width) minmax(0, 1fr) var(--progress-card-width);
  align-items: start;
  column-gap: var(--progress-row-gap);
  padding: var(--progress-row-padding);
  border-block-start: 1px solid var(--color-separator);

  &:first-of-type {
    border-block-start: 0;
  }
}

.poster {
  position: relative;
  display: block;

  & :is(img, .placeholder) {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    border-radius: var(--radius-object);
    object-fit: cover;
  }

  &.dropped img {
    filter: var(--filter-dropped);
  }

  & .placeholder {
    background-color: var(--color-card-bg);
    background-image: var(--image-placeholder-poster);
    background-size: cover;
  }
}

.main-info {
  display: grid;
  align-content: start;
  gap: var(--progress-main-gap);
  min-inline-size: 0;
  font-size: var(--font-size-progress-row);
}

.show-title {
  display: flex;
  align-items: center;
  gap: var(--progress-title-gap);
  min-inline-size: 0;
}

.title {
  min-inline-size: 0;
  margin: 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-progress-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & a {
    color: var(--color-text);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}

/* The year sits on the title's baseline; the status menu stays centered. */
.title,
.year {
  align-self: baseline;
}

.year {
  flex: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-progress-year);
}

/* The percent takes its own width (a twelfth of this narrower column is too tight for "100%"), and the column's
   gap spaces the bar, so it drops its own margin and centers the percent on itself. */
.main-info {
  --tick-bar-height: var(--progress-bar-height);
  --tick-bar-margin: 0;
  --line-height-tick-bar-percent: 1;

  & :global(.tick-bar) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  & :global(.track) {
    border-radius: var(--radius-progress-bar);
  }
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stat) var(--space-stats);
  margin: 0;
}

/* The last watched chip and Seasons on one line, set apart from the stats. */
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-title-gap);
  min-inline-size: 0;
  margin-block-start: calc(var(--progress-last-gap) - var(--progress-main-gap));
}

/* Seasons and the last watched chip: one height, one type size. */
.toggle,
.last {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  block-size: var(--progress-action-height);
  padding: var(--progress-action-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
  font: var(--font-size-progress-row) / var(--line-height-progress-row) var(--font-body);

  & :global(.icon) {
    flex: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }
}

/* The last episode, clearly a link, in the watched tag's wash, outline and text. */
.last {
  --tone: var(--color-comment-chip-watched);
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow: hidden;
  border-color: color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  & :global(.icon) {
    font-size: var(--font-size-progress-last-icon);
  }

  & b {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--tone);

    & b {
      text-decoration: underline;
    }
  }
}

/* Seasons: first on the line, its caret flipping once open. */
.toggle {
  flex: none;
  color: var(--color-control-text);
  cursor: pointer;

  &:is(:hover, :focus-visible, [aria-expanded='true']) {
    border-color: var(--color-control-border-hover);
    background: var(--color-control-hover-bg);
  }

  & :global(.icon) {
    font-size: var(--font-size-progress-toggle-icon);
    transition: rotate 0.2s;
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 180deg;
  }
}

.card {
  /* The card's icon bar matched the dark row, so it's lifted off it here. */
  --color-card-bg: var(--color-progress-card-bg);

  min-inline-size: 0;
}

/* A season's stretch of the show's bar: on hover, notches split the seasons and the others dim. */
.section {
  position: relative;
  flex: 1 1 0;
  min-inline-size: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transition: background-color 0.15s;
  }
}

:global(.overlay:has(.section:hover)) .section {
  & + .section {
    box-shadow: inset var(--progress-section-notch) 0 0 var(--color-surface);
  }

  &:not(:hover)::after {
    background: var(--color-progress-section-dim);
  }
}

/* The season list, across the whole row under the poster and the card. */
.seasons {
  grid-column: 1 / -1;
  min-inline-size: 0;
  margin-block-start: var(--progress-strip-gap);
}

/* The season list's band and rows (`ProgressSeasonGrid`), shimmering at their heights. */
.season-shimmers {
  display: grid;
  padding: var(--progress-band-padding);
  border-radius: var(--radius-progress-band);
  background: var(--color-progress-band);
}

.season-shimmer {
  display: grid;
  gap: var(--progress-season-head-gap);
  padding-block: var(--progress-season-padding);

  & + & {
    border-block-start: 1px solid var(--color-progress-season-rule);
  }
}

.season-head,
.season-bar {
  display: flex;
  align-items: center;
}

.season-head {
  gap: var(--progress-season-title-gap);
  block-size: var(--progress-season-fold);
}

.season-bar {
  gap: var(--progress-season-columns);
  block-size: var(--font-size-progress-season-percent);

  & > :global(:first-child) {
    flex: 1;
  }
}

@media (width < 1200px) {
  .progress-row {
    grid-template-columns: var(--progress-poster-width-tablet) minmax(0, 1fr) var(--progress-card-width-tablet);
  }
}

/* OG hid the poster below desktop. */
@media (width < 992px) {
  .progress-row {
    grid-template-columns: minmax(0, 1fr) var(--progress-card-width-tablet);
  }

  .poster {
    display: none;
  }

  /* The stats keep their icons and leave their words to the tooltips and screen readers, so the four fit one line. */
  .stats :global(.noun) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

@media (width < 768px) {
  .progress-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle :global(.icon),
  .section::after {
    transition: none;
  }
}
</style>
