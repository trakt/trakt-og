<!--
  A calendar card's place while its month reads, in CalendarEntryCard's own frame for the artwork, so the day keeps its
  size when the card lands: the art at a poster's or a fanart's ratio (none for Text), the caption's title and tag
  lines at their fixed heights, then the quick-icon bar. Hidden from screen readers, so the calendar says it's busy.
    <CalendarEntryShimmer artwork="poster" />
-->
<script lang="ts">
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';

interface Props {
  artwork: CalendarArtwork;
  /** A month's narrow days, whose cards take the small quick-icon bar. */
  small?: boolean;
}

const { artwork, small = false }: Props = $props();
</script>

<div class={['calendar-entry', 'calendar-entry-shimmer', artwork]} aria-hidden="true">
  {#if artwork !== 'none'}<span class="art"><Shimmer inline="100%" block="100%" /></span>{/if}
  <span class="caption">
    <span class="titles"><Shimmer inline="var(--card-shimmer-title-width)" block="var(--font-size-card-title)" /></span>
    <span class="tags"><Shimmer inline="var(--card-shimmer-subtitle-width)" block="var(--font-size-card-subtitle)" /></span>
  </span>
  <span class="bar">
    <Shimmer inline="100%"
      block={small || artwork === 'poster' ? 'var(--card-shimmer-bar-small)' : 'var(--card-shimmer-bar)'} />
  </span>
</div>

<style>
.calendar-entry-shimmer {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  min-inline-size: 0;
  overflow: hidden;
  border: 1px solid var(--color-calendar-card-line);
  border-radius: var(--radius-calendar-card);
  background-color: var(--color-calendar-card);
}

.art {
  display: flex;
  aspect-ratio: var(--ratio-fanart);

  .poster > & {
    aspect-ratio: var(--ratio-poster);
  }
}

.caption {
  display: grid;
  gap: var(--calendar-caption-gap);
  padding: var(--calendar-caption-padding);
}

.titles {
  display: flex;
  align-items: center;
  block-size: var(--calendar-titles-height);
}

.tags {
  display: flex;
  align-items: center;
  block-size: var(--calendar-tags-height);
}

.bar {
  display: flex;
  margin-block-start: auto;
  border-block-start: 1px solid var(--color-calendar-card-line);
}
</style>
