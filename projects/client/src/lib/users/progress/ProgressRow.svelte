<!--
  One show on the progress page, as a ledger row: the poster; the title, its status menu (`ProgressStatus`), the tick
  bar, the counts as stats, then View seasons beside a chip linking the episode you last watched; then the up-next card,
  og's fanart card for the next episode with its quick icons, or the show's once every episode is done. The poster and
  the card are the same height, and the text about matches them. View seasons reads the show's catalog (`onneed`) and
  opens the season list across the whole row, under the poster and the card (`ProgressSeasonGrid`). A drop or restore
  fades the row out and moves the focus on.
-->
<script lang="ts">
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
  /** The row's seasons opened: read the show's catalog. */
  onneed?: () => void;
  /** The catalog read is in flight. */
  loading?: boolean;
}

const { row, type, simple, datePreferences, onneed, loading = false }: Props = $props();

let open = $state(false);
let article = $state<HTMLElement>();
// Read only when the row leaves: paging and filtering aren't removals.
let removedByAction = false;

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
const count = (n: number) => n.toLocaleString('en-US');
const showTarget = $derived({ type: 'show' as const, id: row.id, title: row.title, airedEpisodes: row.aired });
const caughtUp = $derived(type === 'dropped' ? 'Dropped' : 'Caught up');

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
</script>

<!-- Show, season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article bind:this={article} class="progress-row" aria-labelledby="progress-{row.id}"
  out:removeCard|global={() => removedByAction}>
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
      label={`${row.title}: ${row.percent}% watched`} />

    <p class="stats">
      <Stat svg={check} tone="watched" value="{count(row.completed)}/{count(row.aired)}" noun="watched"
        label="Episodes watched" />
      <Stat svg={play} value={count(row.plays)} noun={plural(row.plays, 'play')} label="Plays, rewatches included" />
      <Stat svg={history} value={row.watchedTime} noun="watched" label="Time watched" />
      {#if row.left > 0}
        <Stat svg={clock} value={row.leftTime} noun="left"
          label="{count(row.left)} {plural(row.left, 'episode')} left to watch" />
      {/if}
    </p>

    <div class="actions">
      <button type="button" class="toggle" aria-expanded={open} aria-controls="progress-seasons-{row.id}"
        onclick={toggle}>{open ? 'Hide seasons' : 'View seasons'}<Icon svg={caretDown} /></button>
      {#if row.last}
        {@const verb = 'Last watched'}
        <Tooltip text={`${verb} ${row.last.number ?? ''}${row.last.title ? ` ${row.last.title}` : ''}\n${row.last.date}`}>
          {#snippet trigger(tooltip)}
            <a class="last" href={row.last?.href ?? row.href} {...tooltip}><Icon svg={history} />{verb}
              {#if row.last?.number}<b>{row.last.number}</b>{row.last.title ? ` ${row.last.title}` : ''}{/if}
              · {row.last?.relative ?? row.last?.date}</a>
          {/snippet}
        </Tooltip>
      {/if}
      {#if open && loading}<span class="loading" role="status">Loading seasons…</span>{/if}
    </div>
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
    {:else}
      <FanartCard href={row.href} title={row.status ?? row.title} image={row.fanart}
        tags={[{ text: caughtUp, kind: 'generic' }]}
        icons={{
          fill: quickIconFill({ state: overlay.state('show', row.id), airedEpisodes: row.aired, datePreferences }),
          ratingTarget: { type: 'show', id: row.id, title: row.title },
          watchTarget: showTarget,
          rating: row.rating,
        }} />
    {/if}
  </div>

  <div class="seasons" id="progress-seasons-{row.id}" hidden={!open}>
    {#if open && row.seasons}<ProgressSeasonGrid seasons={row.seasons} />{/if}
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

/* The last watched chip and View seasons on one line, set apart from the stats. */
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-title-gap);
  min-inline-size: 0;
  margin-block-start: calc(var(--progress-last-gap) - var(--progress-main-gap));
}

/* View seasons and the last watched chip: one height, one type size. */
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

/* The last episode, clearly a link. */
.last {
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow: hidden;
  color: var(--color-text-muted);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  & :global(.icon) {
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

/* View seasons: first on the line, its caret flipping once open. */
.toggle {
  flex: none;
  color: var(--color-control-text);
  cursor: pointer;

  &:is(:hover, :focus-visible),
  &[aria-expanded='true'] {
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

.loading {
  color: var(--color-text-muted);
  font-style: italic;
}

.card {
  min-inline-size: 0;
}

/* The season list, across the whole row under the poster and the card. */
.seasons {
  grid-column: 1 / -1;
  min-inline-size: 0;
  margin-block-start: var(--progress-strip-gap);
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
