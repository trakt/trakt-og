<!--
  A card's place while its panel loads: the art at a poster's or a fanart's ratio with the quick-icon bar under it,
  then a poster's title and subtitle lines. A fanart card's titles sit on its art, so it has none. Hidden from screen
  readers, so the panel around it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';

const { ratio }: { ratio: 'poster' | 'fanart' } = $props();
</script>

<div class="card-shimmer" aria-hidden="true">
  <span class={['art', ratio]}><Shimmer inline="100%" block="100%" /></span>
  <Shimmer inline="100%" block={ratio === 'poster' ? 'var(--card-shimmer-bar-small)' : 'var(--card-shimmer-bar)'} />
  {#if ratio === 'poster'}
    <span class="titles">
      <Shimmer inline="var(--card-shimmer-title-width)" block="var(--font-size-card-title)" />
      <Shimmer inline="var(--card-shimmer-subtitle-width)" block="var(--font-size-card-subtitle)" />
    </span>
  {/if}
</div>

<style>
.card-shimmer {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-shimmer-bar);
  min-inline-size: 0;
}

.art {
  display: flex;
  aspect-ratio: var(--ratio-poster);

  &.fanart {
    aspect-ratio: var(--ratio-fanart);
  }
}

/* Each line as tall as its letters, centered in the line it holds, so the card is as tall as a loaded one. */
.titles {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--space-card-subtitle) + var(--line-height-card-subtitle) - var(--font-size-card-subtitle));
  padding-block: var(--space-card-shimmer-title) var(--space-card-shimmer-titles-end);
}
</style>
