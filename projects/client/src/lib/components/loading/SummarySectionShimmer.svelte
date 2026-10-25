<!--
  A lazy summary section's place while it loads, under its own heading: People You Follow's three cells, a row of
  video cards under the Type dropdown, three comments under the Filter and Language dropdowns, or three list rows.
  Each keeps the loaded section's boxes and spacing, so it lands without a jump. Hidden from screen readers, so the
  section around it says it's busy.
    <LazySection id="videos" load={...}>
      {#snippet pending()}<SummarySectionShimmer section="videos" />{/snippet}
    </LazySection>
-->
<script lang="ts">
import SectionHeading from '$lib/components/summary/SectionHeading.svelte';
import CommentShimmer from './CommentShimmer.svelte';
import ListRowShimmer from './ListRowShimmer.svelte';
import Shimmer from './Shimmer.svelte';

type Section = 'activity' | 'videos' | 'comments' | 'lists';

const { section }: { section: Section } = $props();

const TITLES: Record<Section, string> = {
  activity: 'People You Follow',
  videos: 'Videos',
  comments: 'Comments',
  lists: 'Popular Lists',
};
// The activity panel's cells, the video row's visible cards, and the comments and lists previews' limit of three.
const COUNTS: Record<Section, number> = { activity: 3, videos: 4, comments: 3, lists: 3 };
const slots = $derived(Array.from({ length: COUNTS[section] }, (_, i) => i));
</script>

<div class={['section-shimmer', section]} aria-hidden="true">
  <SectionHeading title={TITLES[section]} />
  {#if section === 'activity'}
    <div class="panel">
      {#each slots as slot (slot)}
        <span class="cell">
          <Shimmer inline="var(--activity-icon-slot)" block="var(--activity-icon-slot)" round />
          <Shimmer inline="var(--activity-shimmer-figure-width)" block="var(--activity-shimmer-figure-height)" />
          <Shimmer inline="var(--activity-shimmer-label-width)" block="var(--activity-shimmer-label-height)" />
        </span>
      {/each}
    </div>
  {:else if section === 'videos'}
    <div class="controls"><Shimmer inline="var(--videos-shimmer-dropdown-width)" block="var(--control-height)" /></div>
    <div class="row">
      {#each slots as slot (slot)}
        <span class="video">
          <span class="art"><Shimmer inline="100%" block="100%" /></span>
          <span class="title"><Shimmer inline="var(--videos-shimmer-title-width)" block="var(--font-size-card-title)" /></span>
        </span>
      {/each}
    </div>
  {:else if section === 'comments'}
    <div class="controls">
      <Shimmer inline="var(--comment-shimmer-dropdown-width)" block="var(--control-height)" />
      <Shimmer inline="var(--comment-shimmer-dropdown-width)" block="var(--control-height)" />
    </div>
    {#each slots as slot (slot)}
      <div class="comment"><CommentShimmer /></div>
    {/each}
  {:else}
    {#each slots as slot (slot)}
      <ListRowShimmer />
    {/each}
  {/if}
</div>

<style>
/* The loaded sections' own margins: each ends a gutter above the next. */
.section-shimmer {
  margin-block-end: var(--gutter);
}

/* VideosRail is a size container, so its heading's margin stays inside it. */
.videos {
  container-type: inline-size;
  margin-block-end: 0;
}

.panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-block-start: var(--space-activity-panel-top);
  border: 1px solid var(--color-activity-panel-line);
  border-radius: var(--radius-activity-panel);
  background-color: var(--color-activity-panel-bg);
}

.cell {
  display: flex;
  align-items: center;
  gap: var(--activity-cell-gap);
  min-inline-size: 0;
  min-block-size: var(--activity-cell-height);
  padding: var(--activity-cell-padding);

  & + & {
    border-inline-start: 1px solid var(--color-activity-panel-line);
  }
}

.controls {
  display: flex;
  gap: var(--toolbar-gap);
  padding-block-start: var(--space-heading-dropdowns);
}

.row {
  --visible: var(--videos-visible);
  display: grid;
  grid-auto-columns: calc((100% - (var(--visible) - 1) * var(--gutter)) / var(--visible));
  grid-auto-flow: column;
  gap: var(--gutter);
  margin: var(--gutter) 0;
  padding-block-end: var(--actors-scrollbar-gap);
  overflow: hidden;
}

@container (width < 720px) {
  .row {
    --visible: var(--videos-visible-narrow);
  }
}

.video {
  display: grid;
  gap: var(--video-caption-gap);
}

.art {
  display: flex;
  aspect-ratio: var(--ratio-fanart);
}

.title {
  display: flex;
  justify-content: center;
  align-items: center;
  block-size: var(--line-height-card-title);
}

.comment {
  margin-block-start: var(--gutter);
}
</style>
