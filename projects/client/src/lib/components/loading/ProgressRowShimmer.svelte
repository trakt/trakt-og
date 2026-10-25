<!--
  A progress row's place while your progress loads: the poster, then the title, the tick bar with its percent, the
  stats and Seasons, then the up-next card's art and quick-icon bar, in the row's own columns and heights so nothing
  moves when the shows land. Hidden from screen readers, so the list around it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';
</script>

<div class="progress-row-shimmer" aria-hidden="true">
  <span class="poster"><Shimmer inline="100%" block="100%" /></span>
  <div class="main-info">
    <span class="title"><Shimmer inline="var(--progress-shimmer-title-width)" block="var(--font-size-progress-title)" /></span>
    <span class="bar">
      <Shimmer inline="100%" block="var(--progress-bar-height)" />
      <Shimmer inline="var(--progress-shimmer-percent-width)" block="var(--font-size-tick-bar-percent)" />
    </span>
    <span class="stats">
      {#each Array.from({ length: 3 }, (_, i) => i) as stat (stat)}
        <Shimmer inline="var(--progress-shimmer-stat-width)" block="var(--font-size-stat-number)" />
      {/each}
    </span>
    <span class="actions">
      <Shimmer inline="var(--progress-shimmer-toggle-width)" block="var(--progress-action-height)" />
    </span>
  </div>
  <div class="card">
    <span class="art"><Shimmer inline="100%" block="100%" /></span>
    <Shimmer inline="100%" block="calc(var(--card-shimmer-bar) - var(--space-card-shimmer-bar))" />
  </div>
</div>

<style>
.progress-row-shimmer {
  display: grid;
  grid-template-columns: var(--progress-poster-width) minmax(0, 1fr) var(--progress-card-width);
  align-items: start;
  column-gap: var(--progress-row-gap);
  padding: var(--progress-row-padding);
  border-block-start: 1px solid var(--color-separator);

  &:first-child {
    border-block-start: 0;
  }
}

.poster,
.art {
  display: flex;
}

.poster {
  aspect-ratio: var(--ratio-poster);
}

.main-info {
  display: grid;
  gap: var(--progress-main-gap);
  min-inline-size: 0;
}

/* Each line as tall as the loaded one: the title's status menu, the percent's letters, the stats' line box. */
.title,
.bar,
.stats,
.actions {
  display: flex;
  align-items: center;
}

.title {
  block-size: var(--progress-shimmer-title-line);
}

.bar {
  gap: var(--tick-bar-percent-gap);
  block-size: var(--font-size-tick-bar-percent);

  & > :global(:first-child) {
    flex: 1;
  }
}

.stats {
  gap: var(--space-stats);
  block-size: calc(var(--font-size-stat-number) * var(--line-height-base));
}

.actions {
  margin-block-start: calc(var(--progress-last-gap) - var(--progress-main-gap));
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-shimmer-bar);
  min-inline-size: 0;
}

.art {
  aspect-ratio: var(--ratio-fanart);
}

@media (width < 1200px) {
  .progress-row-shimmer {
    grid-template-columns: var(--progress-poster-width-tablet) minmax(0, 1fr) var(--progress-card-width-tablet);
  }
}

@media (width < 992px) {
  .progress-row-shimmer {
    grid-template-columns: minmax(0, 1fr) var(--progress-card-width-tablet);
  }

  .poster {
    display: none;
  }
}

@media (width < 768px) {
  .progress-row-shimmer {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
