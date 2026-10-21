<!--
  A video's fanart card: the YouTube thumbnail, rounded, with the video's type in its own color over the bottom-left
  corner when a row mixes types, and the title centered under it like a poster card's, in up to two lines. The title
  is the link in the tab order; the image is the same link for the mouse.
    <VideoFanartCard {video} tagged />
-->
<script lang="ts">
import type { VideoCard } from '$lib/videos/toVideoCards';
import { videoTabSlug, videoTypes } from '$lib/videos/videoTypes';
import CardTag from './CardTag.svelte';
import FanartCard from './FanartCard.svelte';

interface Props {
  video: VideoCard;
  /** The type tag, for a row of every type. */
  tagged?: boolean;
}

const { video, tagged = false }: Props = $props();
</script>

<!-- Video links are YouTube's. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class="video-card">
  <FanartCard href={video.href} title={video.title} image={video.image} titles={false}>
    {#snippet fanartOverlay()}
      {#if tagged}
        <p class="type">
          <CardTag text={videoTypes[video.type].label} color="var(--video-{videoTabSlug(video.type)})" />
        </p>
      {/if}
    {/snippet}
  </FanartCard>
  <a class="title" href={video.href}><h3>{video.title}</h3></a>
</article>

<style>
.video-card {
  display: grid;
  gap: var(--video-caption-gap);
  align-content: start;
  min-inline-size: 0;

  & :global(.fanart) {
    border-radius: var(--radius-card-framed);
  }

  /* The shade is for titles over the art, and these sit under it. */
  & :global(.fanart .shadow-base) {
    display: none;
  }
}

.type {
  position: absolute;
  inset-inline-start: var(--video-tag-inset);
  inset-block-end: var(--video-tag-inset);
  z-index: 2;
  margin: 0;
  pointer-events: none;
}

.title {
  color: var(--color-text);
  text-align: center;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-text);
    text-decoration: underline;
  }
}

/* A season poster's title, in up to two lines. */
h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--font-size-card-title);
  line-height: var(--line-height-card-title);
}
</style>
