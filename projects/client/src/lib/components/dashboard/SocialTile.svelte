<!--
  One of the Social Feed's top tiles, a still with who and what over its bottom and nothing else there, so the avatar
  and title line up across the row. A live tile has the pulsing "Watching now" pill with the minutes left beside it,
  what's on as the headline and its progress along the bottom edge. A sitting tile has "Finished 24m ago" (within the
  hour) or "11h ago" and only the title watched last, whose newest episode gives the still, with their heart when they
  rated it; the rest of the sitting stays in the timeline. Screen readers get one sentence.
-->
<script lang="ts">
import fanartPlaceholder from '$lib/assets/placeholders/fanart.png';
import type { LiveTile, SittingTile } from '$lib/dashboard/arrangeSocialFeed';
import { imageUrl } from '$lib/utils/imageUrl';
import SocialHeart from './SocialHeart.svelte';
import SocialPill from './SocialPill.svelte';

const { tile }: { tile: LiveTile | SittingTile } = $props();

const view = $derived.by(() => {
  if (tile.kind === 'live') {
    const { watch, minutesLeft } = tile;
    const doing = watch.kind === 'checkin' ? 'checked in to' : 'watching';
    return {
      member: watch.member,
      still: { href: watch.href, path: watch.still },
      head: { text: watch.label, href: watch.href },
      heart: null,
      sentence: `${watch.member.name} is ${doing} ${watch.label}, ${minutesLeft} minutes left.`,
    };
  }

  const { member, summary } = tile.sitting;
  return {
    member,
    still: summary.tile.still,
    head: summary.tile.link ?? { text: '', href: '' },
    heart: summary.tile.heart,
    sentence: summary.sentence,
  };
});
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article class="tile">
  <a class="still" href={view.still.href} tabindex="-1" aria-hidden="true"><img
      src={imageUrl(view.still.path, 'medium') ?? fanartPlaceholder} alt="" loading="lazy" decoding="async" /></a>
  <span class="status" aria-hidden="true">
    {#if tile.kind === 'live'}
      <SocialPill dot="live" onImage>Watching now</SocialPill>
      <SocialPill onImage>{tile.minutesLeft}m left</SocialPill>
    {:else if tile.sitting.summary.fresh}
      <SocialPill dot="done" onImage>Finished {tile.sitting.summary.ago} ago</SocialPill>
    {:else}
      <SocialPill onImage>{tile.sitting.summary.ago} ago</SocialPill>
    {/if}
  </span>
  <p class="sr">{view.sentence}</p>
  <div class="over">
    <p class="who">
      <img class="avatar" src={view.member.avatar} alt="" loading="lazy" decoding="async" />
      {#if view.member.href}<a href={view.member.href}>{view.member.name}</a>{:else}<b>{view.member.name}</b>{/if}
    </p>
    <p class="head">
      <a href={view.head.href}>{view.head.text}</a>
      {#if view.heart}<span aria-hidden="true"><SocialHeart rating={view.heart} /></span>{/if}
    </p>
  </div>
  {#if tile.kind === 'live'}
    <div class="bar" aria-hidden="true"><i style:inline-size="{tile.progress}%"></i></div>
  {/if}
</article>

<style>
.tile {
  position: relative;
  overflow: hidden;
  min-inline-size: 0;
  border-radius: var(--social-still-radius);
  background-color: var(--color-social-still);
}

.still {
  display: block;
  position: relative;
  aspect-ratio: var(--social-tile-ratio);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  &::after {
    position: absolute;
    inset: 0;
    background: var(--social-tile-shade);
    content: '';
  }
}

.status {
  display: flex;
  position: absolute;
  inset-block-start: var(--social-tile-pill-inset);
  inset-inline: var(--social-tile-pill-inset);
  justify-content: space-between;
  gap: var(--space-sm-block);
}

.over {
  display: grid;
  position: absolute;
  inset-inline: var(--social-tile-inset);
  inset-block-end: var(--social-tile-inset);
  gap: var(--space-base-block);
  color: var(--color-social-on-image);
  pointer-events: none;

  & p {
    margin: 0;
    line-height: var(--line-height-social-tile);
    text-shadow: var(--social-text-shadow);
  }

  & a {
    color: inherit;
    pointer-events: auto;
  }
}

.who {
  display: flex;
  gap: var(--space-base-block);
  align-items: center;
  font-size: var(--font-size-social-chip);
  font-weight: bold;
}

.avatar {
  inline-size: var(--social-avatar-small);
  block-size: var(--social-avatar-small);
  border-radius: 50%;
  object-fit: cover;
}

.head {
  display: flex;
  gap: var(--space-base-block);
  align-items: center;
  font-size: var(--font-size-social-tile);
  font-weight: bold;

  & a {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & span {
    display: flex;
    flex: none;
  }
}

/* Along the bottom edge, so it never pushes the text up. */
.bar {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: var(--social-bar);
  background-color: var(--color-social-bar-track);

  & i {
    display: block;
    block-size: 100%;
    background-color: var(--color-social-live);
  }
}

.sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
