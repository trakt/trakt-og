<!--
  A summary's "Videos" section: the heading with "All Videos", a type dropdown with each type's count (on the trailers,
  else the teasers, else All), and one row of fanart cards sized so four fit, that scrolls sideways for the rest. A plain click plays a video in the popup, and
  "All Videos" opens the videos page on the picked type. The thumbnails only load as they scroll into view.
-->
<script lang="ts">
import VideoPopup from '$lib/components/dialog/VideoPopup.svelte';
import { videoLinkClicks } from '$lib/components/dialog/videoLinkClicks';
import VideoFanartCard from '$lib/components/media/VideoFanartCard.svelte';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';
import { defaultVideoTab, toVideoTabs, type VideoCard } from '$lib/videos/toVideoCards';
import VideoTypeDropdown from '$lib/videos/VideoTypeDropdown.svelte';
import { videosHref, type VideoTabId } from '$lib/videos/videoTypes';

interface Props {
  videos: readonly VideoCard[];
  /** The item's summary, which the videos page hangs off. */
  href: string;
}

const { videos, href }: Props = $props();
const tabs = $derived(toVideoTabs(videos));
const fallback = $derived(defaultVideoTab(tabs));
let picked = $state<VideoTabId>();
const current = $derived(tabs.find(({ id }) => id === picked) ?? fallback);
let playing = $state<string>();
const playingTitle = $derived(videos.find((video) => video.href === playing)?.title);
</script>

{#if current}
  <div class="videos">
  <div class="heading">
    <h2>Videos</h2>
    <SeeMore href={videosHref(href, current === fallback ? undefined : current.id)} text="All Videos" />
  </div>
  <div class="controls">
    <VideoTypeDropdown {tabs} {current} onpick={(id) => (picked = id)} />
  </div>
  <ul class="row" {@attach videoLinkClicks((url) => (playing = url))}>
      {#each current.videos as video (video.href)}
        <li>
          <VideoFanartCard {video} tagged={current.id === 'all'} />
        </li>
      {/each}
    </ul>
</div>
{/if}

{#if playing}
  <VideoPopup bind:url={playing} title={playingTitle} />
{/if}

<style>
.videos {
  container-type: inline-size;
}

.heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-block-start: var(--gutter);

  & h2 {
    margin: 0;
  }
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}

/* The actors row's scroller with fanart cards: four fill the width, two in a narrow column, the rest scroll in. */
.row {
  --visible: var(--videos-visible);
  display: grid;
  grid-auto-columns: calc((100% - (var(--visible) - 1) * var(--gutter)) / var(--visible));
  grid-auto-flow: column;
  gap: var(--gutter);
  margin: var(--gutter) 0;
  padding: 0 0 var(--actors-scrollbar-gap);
  overflow-x: auto;
  list-style: none;
  scroll-snap-type: x mandatory;
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
  scrollbar-width: thin;
}

.row > li {
  min-inline-size: 0;
  scroll-snap-align: start;
}

@container (width < 720px) {
  .row {
    --visible: var(--videos-visible-narrow);
  }
}
</style>
