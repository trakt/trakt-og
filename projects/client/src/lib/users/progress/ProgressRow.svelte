<!--
  One show on the progress page, as a ledger row: the poster; the title, its status menu (`ProgressStatus`), the tick
  bar, the counts as stats and when you last watched (or collected); then the up-next card, og's fanart card for the
  next episode with its quick icons. The row reads the show's catalog (`onneed`) as it nears the screen, since the
  card and exact counts need it; until then the card waits on the show's fanart. Once every episode is done, the card
  is the show's. "Show seasons" opens the season lines under the row (`ProgressSeasonGrid`), in their own grid row,
  so opening them moves nothing above. A drop, hide or restore fades the row out and moves the focus on.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import { removeCard } from '$lib/components/media/removeCard';
import TickBar from '$lib/components/media/TickBar.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
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
      <p class="last">
        {kind === 'watched' ? 'Last watched' : 'Last added'}
        {#if row.last.number}<a href={row.last.href}><b>{row.last.number}</b>{row.last.title ? ` ${row.last.title}` : ''}</a>{/if}
        {row.last.relative ? `${row.last.relative} ` : ''}on {row.last.date}
      </p>
    {/if}

    <p class="toggle-line">
      <button type="button" class="toggle" aria-expanded={open} aria-controls="progress-seasons-{row.id}"
        onclick={toggle}><Icon svg={caretDown} />{open ? 'Hide' : 'Show'}
        {row.seasons ? `${row.seasons.length} ${plural(row.seasons.length, 'season')}` : 'seasons'}</button>
      {#if open && loading}<span class="loading" role="status">Loading seasons…</span>{/if}
    </p>
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

  <div class="seasons" id="progress-seasons-{row.id}" hidden={!open}>
    {#if open && row.seasons}<ProgressSeasonGrid seasons={row.seasons} {type} />{/if}
  </div>
</article>

<style>
.progress-row {
  display: grid;
  grid-template-columns: var(--progress-poster-width) minmax(0, 1fr) var(--progress-card-width);
  column-gap: var(--progress-row-gap);
  row-gap: var(--progress-season-gap);
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
  grid-template-rows: auto auto auto auto 1fr;
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

/* The percent takes its own width: a twelfth of this narrower column is too tight for "100%". */
.main-info :global(.tick-bar) {
  grid-template-columns: minmax(0, 1fr) auto;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stat) var(--space-stats);
  margin: 0;
}

.last {
  margin: 0;
  color: var(--color-text-muted);
  line-height: var(--line-height-progress-row);

  & a {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      color: var(--color-text);
      text-decoration: underline;
    }
  }

  & b {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.toggle-line {
  display: flex;
  align-items: end;
  gap: var(--progress-title-gap);
  margin: 0;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  min-block-size: 0;
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

/* Its own row under the text and the card, so opening it moves nothing above. */
.seasons {
  grid-column: 2 / -1;
  min-inline-size: 0;
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

  .seasons {
    grid-column: 1 / -1;
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
