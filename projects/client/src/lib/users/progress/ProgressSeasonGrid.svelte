<!--
  An open progress row's seasons: one line a season, with its name linking to the season page, a numbered square an
  episode, then its percent and what's left. A square is purple once watched, the library's teal while it's in your
  library but not watched, outlined and pulsing for up next, and dashed until it airs. Each links to its episode
  and says what it is in a tooltip.
    <ProgressSeasonGrid seasons={row.seasons} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { ProgressSeason } from './toProgressSeasons.ts';

interface Props {
  seasons: readonly ProgressSeason[];
}

const { seasons }: Props = $props();
</script>

<!-- Season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ul class="seasons">
  {#each seasons as season (season.number)}
    <li class={['season', { announced: season.announced }]}>
      <a class="name" href={season.href}>{season.name}</a>
      <ul class="squares" aria-label="{season.name} episodes">
        {#each season.squares as square (square.code)}
          <li>
            <Tooltip text={`${square.code}${square.title ? ` ${square.title}` : ''}\n${square.readout}`}>
              {#snippet trigger(tooltip)}
                <a class={['square', square.state, { collected: square.collected }]} href={square.href}
                  aria-label={square.label} {...tooltip}>{square.number}</a>
              {/snippet}
            </Tooltip>
          </li>
        {/each}
      </ul>
      <span class={['percent', { complete: season.complete }]}>{season.announced ? '' : `${season.percent}%`}</span>
      <span class="summary">{season.summary}</span>
    </li>
  {/each}
</ul>

<style>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.seasons {
  container: progress-seasons / inline-size;
  display: grid;
  gap: var(--progress-season-gap);
  padding-block-start: var(--progress-season-gap);
  border-block-start: 1px dashed var(--color-separator);
  font-size: var(--font-size-progress-row);
}

.season {
  display: grid;
  grid-template-columns: var(--progress-season-name) minmax(0, 1fr) var(--progress-season-percent) var(
    --progress-season-summary
  );
  gap: var(--progress-season-columns);
  align-items: center;
}

.name {
  color: var(--color-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;
  white-space: nowrap;

  &:is(:hover, :focus-visible) {
    color: var(--color-progress-watched-text);
    text-decoration: underline;
  }

  .announced & {
    color: var(--color-text-muted);
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
  block-size: var(--progress-square);
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

.percent {
  font: var(--font-weight-headings-heavy) var(--font-size-progress-season-percent) / 1 var(--font-headings);
  font-variant-numeric: tabular-nums;
  text-align: end;

  &.complete {
    color: var(--color-progress-watched-text);
  }
}

.summary {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  text-align: end;
  white-space: nowrap;
}

/* A narrow row: the squares take their own line under the name. */
@container progress-seasons (width < 560px) {
  .season {
    grid-template-columns: 1fr auto auto;
  }

  .squares {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .square.up-next {
    animation: none;
  }
}
</style>
