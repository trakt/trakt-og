<!--
  One show on the progress page, as a ledger row: the poster; the title, its status menu (`ProgressStatus`), the tick
  bar, the counts as stats and a chip linking the episode you last watched (or collected); then the up-next card,
  og's fanart card for the next episode with its quick icons. The poster and the card are the same height, and the
  text about matches them. The row reads the show's catalog (`onneed`) as it nears the screen, since the card, the
  exact counts and the seasons need it; until then the card waits on the show's fanart. Once every episode is done,
  the card is the show's. Under it all, across the whole row, the seasons strip: "Show seasons" and a chip a season
  (done, how far, or soon; up next's season outlined), which opens the season list under it (`ProgressSeasonGrid`).
  A drop, hide or restore fades the row out and moves the focus on.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import { removeCard } from '$lib/components/media/removeCard';
import TickBar from '$lib/components/media/TickBar.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/regular/clock.svg?raw';
import history from '$lib/icons/regular/clock-rotate-left.svg?raw';
import play from '$lib/icons/regular/play.svg?raw';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import ProgressSeasonGrid from './ProgressSeasonGrid.svelte';
import ProgressStatus from './ProgressStatus.svelte';
import type { ProgressType } from './progressTypes.ts';
import type { ProgressRow } from './toProgressRow.ts';

interface Props {
  row: ProgressRow;
  type: ProgressType;
  simple: boolean;
  datePreferences: DatePreferences;
  /** The row needs the show's catalog: `quiet` while it's only near the screen, so a failure says nothing. */
  onneed?: (quiet: boolean) => void;
  /** The catalog read is in flight. */
  loading?: boolean;
}

const { row, type, simple, datePreferences, onneed, loading = false }: Props = $props();
const kind = $derived(type === 'library' ? 'library' : 'watched');

let open = $state(false);
let article = $state<HTMLElement>();
// Read only when the row leaves: paging and filtering aren't removals.
let removedByAction = false;

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
const count = (n: number) => n.toLocaleString('en-US');
// Up next's season, outlined in the strip.
const nextSeason = $derived(row.upNext?.target.season.number);
const showTarget = $derived({ type: 'show' as const, id: row.id, title: row.title, airedEpisodes: row.aired });
const caughtUp = $derived(
  type === 'dropped'
    ? 'Dropped'
    : kind === 'library'
    ? row.left === 0 ? 'All collected' : `${count(row.left)} to collect`
    : 'Caught up',
);

/** Reads the catalog once the row is within a screen of the viewport. */
const near: Attachment<HTMLElement> = (node) => {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
    observer.disconnect();
    onneed?.(true);
  }, { rootMargin: '100% 0px' });
  observer.observe(node);
  return () => observer.disconnect();
};

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
  if (open) onneed?.(false);
}
</script>

<!-- Show, season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article bind:this={article} class="progress-row" aria-labelledby="progress-{row.id}"
  {@attach row.seasons ? undefined : near} out:removeCard|global={() => removedByAction}>
  <a class="poster" href={row.href} tabindex="-1" aria-hidden="true">
    {#if row.poster}
      <img src={row.poster} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="placeholder"></span>
    {/if}
  </a>

  <div class="main-info">
    <div class="show-title">
      <h3 class="title" id="progress-{row.id}"><a class="titles-link" href={row.href}>{row.title}</a></h3>
      {#if row.year}<span class="year">{row.year}</span>{/if}
      <ProgressStatus {row} {type} onremove={remove} />
    </div>

    <TickBar runs={row.ticks} percent={row.percent} {simple}
      label={`${row.title}: ${row.percent}% ${kind === 'watched' ? 'watched' : 'in your library'}`} />

    <p class="stats">
      {#if kind === 'watched'}
        <Stat svg={check} tone="watched" value="{count(row.completed)}/{count(row.aired)}" noun="watched"
          label="Episodes watched" />
        <Stat svg={play} value={count(row.plays)} noun={plural(row.plays, 'play')} label="Plays, rewatches included" />
        <Stat svg={history} value={row.watchedTime} noun="watched" label="Time watched" />
        {#if row.left > 0}
          <Stat svg={clock} value={row.leftTime} noun="left"
            label="{count(row.left)} {plural(row.left, 'episode')} left to watch" />
        {/if}
      {:else}
        <Stat svg={collection} tone="collected" value="{count(row.completed)}/{count(row.aired)}" noun="in library"
          label="Episodes in your library" />
        {#if row.left > 0}
          <Stat svg={clock} value={count(row.left)} noun="to collect" label="Episodes not in your library yet" />
        {/if}
      {/if}
    </p>

    {#if row.last}
      {@const verb = kind === 'watched' ? 'Last watched' : 'Last added'}
      <Tooltip text={`${verb} ${row.last.number ?? ''}${row.last.title ? ` ${row.last.title}` : ''}\n${row.last.date}`}>
        {#snippet trigger(tooltip)}
          <a class="last" href={row.last?.href ?? row.href} {...tooltip}><Icon svg={history} />{verb}
            {#if row.last?.number}<b>{row.last.number}</b>{row.last.title ? ` ${row.last.title}` : ''}{/if}
            · {row.last?.relative ?? row.last?.date}</a>
        {/snippet}
      </Tooltip>
    {/if}
  </div>

  <div class="card">
    {#if row.upNext}
      {@const next = row.upNext}
      <FanartCard href={next.href} title={next.title} number={next.number} image={next.image}
        spoilerImage={next.spoilerImage} tags={next.tags}
        icons={{
          fill: quickIconFill({ state: overlay.state('episode', next.target.id, next.target.season), datePreferences }),
          ratingTarget: { type: 'episode', id: next.target.id, title: next.target.title },
          watchTarget: next.target,
          collectionTarget: next.target,
          rating: next.rating,
          released: next.released,
          listLabel: 'Add to list',
        }} />
    {:else if row.seasons || row.left === 0 || kind === 'library'}
      <FanartCard href={row.href} title={row.status ?? row.title} image={row.fanart}
        tags={[{ text: caughtUp, kind: kind === 'library' ? 'collect' : 'generic' }]}
        icons={{
          fill: quickIconFill({ state: overlay.state('show', row.id), airedEpisodes: row.aired, datePreferences }),
          ratingTarget: { type: 'show', id: row.id, title: row.title },
          watchTarget: showTarget,
          rating: row.rating,
        }} />
    {:else}
      <div class="card-waiting" aria-busy="true" aria-label="Loading the next episode">
        {#if row.fanart}<img src={row.fanart} alt="" loading="lazy" decoding="async" />{/if}
        <span class="bar"></span>
      </div>
    {/if}
  </div>

  <div class="seasons-area">
    <div class={['strip', { open: open && row.seasons }]}>
      <button type="button" class="toggle" aria-expanded={open} aria-controls="progress-seasons-{row.id}"
        onclick={toggle}><Icon svg={caretDown} />{open ? 'Hide' : 'Show'}
        {row.seasons ? `${row.seasons.length} ${plural(row.seasons.length, 'season')}` : 'seasons'}</button>
      {#if row.seasons}
        <ul class="chips" aria-label="{row.title} seasons">
          {#each row.seasons as season (season.number)}
            <li class={['chip', { done: season.complete, now: season.number === nextSeason }]}>
              {season.number === 0 ? 'Specials' : `S${season.number}`}
              {#if season.announced !== undefined}soon{:else if season.complete}<Icon svg={check} />{:else}<span
                  class="mini"
                  ><span style:inline-size="{season.percent}%"></span></span>{season.percent}%{/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if open && loading}<span class="loading" role="status">Loading seasons…</span>{/if}
    </div>
    <div class="seasons" id="progress-seasons-{row.id}" hidden={!open}>
      {#if open && row.seasons}<ProgressSeasonGrid seasons={row.seasons} {type} />{/if}
    </div>
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
  display: block;

  & :is(img, .placeholder) {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    object-fit: cover;
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

.year {
  flex: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-progress-year);
}

/* The percent takes its own width (a twelfth of this narrower column is too tight for "100%"), and the column's
   gap spaces the bar, so it drops its own margin and centers the percent on itself. */
.main-info {
  --tick-bar-margin: 0;
  --line-height-tick-bar-percent: 1;

  & :global(.tick-bar) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stat) var(--space-stats);
  margin: 0;
}

/* The last episode as a chip: set apart from the stats, and clearly a link. */
.last {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  max-inline-size: 100%;
  margin-block-start: calc(var(--progress-last-gap) - var(--progress-main-gap));
  padding: var(--progress-last-padding);
  overflow: hidden;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
  color: var(--color-text-muted);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-progress-last-icon);
  }

  & b {
    color: var(--color-text);
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);

    & b {
      text-decoration: underline;
    }
  }
}

/* The seasons strip and the list it opens, across the whole row. */
.seasons-area {
  grid-column: 1 / -1;
  min-inline-size: 0;
  margin-block-start: var(--progress-strip-gap);
}

.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-strip-chip-gap);
  padding: var(--progress-strip-padding);
  border-radius: var(--radius-progress-band);
  background: var(--color-progress-band);

  &.open {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  min-block-size: 0;
  margin-inline-end: var(--progress-strip-toggle-gap);
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-progress-toggle-link);
  font: var(--font-weight-headings) var(--font-size-progress-row) / var(--line-height-progress-row) var(
    --font-headings
  );
  cursor: pointer;

  & :global(.icon) {
    font-size: var(--font-size-progress-toggle-icon);
    transition: rotate 0.2s;
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 180deg;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--progress-strip-chip-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  padding: var(--progress-chip-padding);
  border-radius: var(--radius-progress-chip);
  background: var(--color-progress-chip);
  color: var(--color-dropdown-menu-text);
  font: var(--font-weight-headings) var(--font-size-small) / 1.2 var(--font-headings);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.done {
    color: var(--color-progress-watched-text);
  }

  &.now {
    box-shadow: inset 0 0 0 1px var(--color-progress-chip-now);
  }
}

.mini {
  display: inline-block;
  inline-size: var(--progress-chip-bar);
  block-size: var(--progress-chip-bar-height);
  overflow: hidden;
  border-radius: var(--progress-chip-bar-height);
  background: var(--color-progress-square);

  & span {
    display: block;
    block-size: 100%;
    background: var(--color-progress-watched);
  }
}

.loading {
  color: var(--color-text-muted);
  font-style: italic;
}

.card {
  min-inline-size: 0;
}

.card-waiting {
  display: grid;
  background: var(--color-card-bg);

  & img {
    inline-size: 100%;
    aspect-ratio: var(--ratio-fanart);
    object-fit: cover;
    opacity: var(--opacity-progress-loading-card);
  }

  &:not(:has(img))::before {
    content: '';
    aspect-ratio: var(--ratio-fanart);
    background: var(--image-placeholder-fanart) center / cover;
  }

  & .bar {
    block-size: var(--progress-card-bar);
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
}

@media (width < 768px) {
  .progress-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle :global(.icon) {
    transition: none;
  }
}
</style>
