<!--
  A streamed profile section's place while it loads: the four stat boxes under the frame, or the Most Watched Shows
  and Movies columns with their Period dropdowns and three posters each, with the time watched and plays lines. Each keeps the loaded section's boxes and
  spacing, so it lands without a jump. Hidden from screen readers, so the page says it's busy.
    {#await data.mostWatched}<ProfileSectionShimmer section="most-watched" />{:then ...}
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import CardShimmer from './CardShimmer.svelte';
import Shimmer from './Shimmer.svelte';

const { section }: { section: 'boxes' | 'most-watched' } = $props();

const id = $props.id();
const BOXES = [0, 1, 2, 3];
const POSTERS = [0, 1, 2];
const COLUMNS = [
  { type: 'shows', title: 'Most Watched Shows', icon: tvRetro },
  { type: 'movies', title: 'Most Watched Movies', icon: cameraMovie },
] as const;
</script>

<div class={['profile-shimmer', section]} aria-hidden="true">
  <Container>
    {#if section === 'boxes'}
      <div class="grid">
        {#each BOXES as slot (slot)}
          <span class="box">
            <Shimmer inline="var(--profile-box-shimmer-tag-width)" block="var(--profile-box-shimmer-tag-height)" />
            <span class="foot">
              <Shimmer inline="var(--profile-box-shimmer-title-width)" block="var(--font-size-profile-box-title)" />
              <Shimmer inline="var(--profile-box-shimmer-subtitle-width)"
                block="var(--font-size-profile-box-subtitle)" />
            </span>
          </span>
        {/each}
      </div>
    {:else}
      <div class="columns">
        {#each COLUMNS as column (column.type)}
          <div>
            <PanelHeading id="{id}-{column.type}" title={column.title} icon={column.icon} />
            <div class="controls">
              <Shimmer inline="var(--most-watched-shimmer-dropdown-width)" block="var(--control-height)" />
            </div>
            <div class="posters">
              {#each POSTERS as slot (slot)}<CardShimmer ratio="poster" subtitles={2} />{/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Container>
</div>

<style>
/* ProfileBoxStrip's strip: dark in both themes, so the bars are the light ones. */
.profile-shimmer.boxes {
  --shimmer: var(--shimmer-on-art);
  background-color: var(--color-profile-boxes-bg);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  block-size: var(--profile-box-height);
  padding: var(--profile-box-padding);
}

.foot {
  display: flex;
  flex-direction: column;
  gap: var(--profile-box-foot-gap);
}

/* MostWatched's columns, Period dropdown and posters. */
.profile-shimmer.most-watched {
  display: flow-root;
  background-color: var(--color-surface);
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gutter);

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}

.controls {
  display: flex;
  padding-block-start: var(--space-heading-dropdowns);
}

.posters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin-block-end: var(--gutter);
  padding-block-start: var(--gutter);

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    & > :global(:nth-child(3)) {
      display: none;
    }
  }
}
</style>
