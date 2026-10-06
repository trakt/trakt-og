<!--
  One of the Social Feed's top tiles, a still with the text over its bottom. A live tile has the pulsing "Watching now"
  pill, what's on as the headline, a progress bar and the minutes left. A sitting tile has "Finished 24m ago" (within
  the hour) or "11h ago", what was watched led by the title watched last, whose newest episode gives the still, and
  chips for the count and that title's rating. Screen readers get one sentence.
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
      head: { text: watch.label, href: watch.href, more: null },
      sentence: `${watch.member.name} is ${doing} ${watch.label}, ${minutesLeft} minutes left.`,
    };
  }

  const { member, summary } = tile.sitting;
  return {
    member,
    still: summary.tile.still,
    head: { ...(summary.tile.link ?? { text: '', href: '' }), more: summary.tile.more },
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
    <p class="head"><a href={view.head.href}>{view.head.text}</a>{#if view.head.more}<span aria-hidden="true">{
            ` ${view.head.more}`
          }</span>{/if}</p>
    {#if tile.kind === 'live'}
      <div class="bar" aria-hidden="true"><i style:inline-size="{tile.progress}%"></i></div>
      <p class="left" aria-hidden="true">
        <span>{tile.earlier ? `+${tile.earlier} earlier` : ''}</span>
        <span>{tile.minutesLeft} min left</span>
      </p>
    {:else if tile.sitting.summary.count || tile.sitting.summary.tile.heart}
      <p class="chips" aria-hidden="true">
        {#if tile.sitting.summary.count}<span class="chip">{tile.sitting.summary.count}</span>{/if}
        {#if tile.sitting.summary.tile.heart}<SocialHeart rating={tile.sitting.summary.tile.heart} />{/if}
      </p>
    {/if}
  </div>
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
  position: absolute;
  inset-block-start: var(--social-tile-pill-inset);
  inset-inline-start: var(--social-tile-pill-inset);
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
  overflow: hidden;
  font-size: var(--font-size-social-tile);
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar {
  block-size: var(--social-bar);
  overflow: hidden;
  border-radius: var(--social-bar);
  background-color: var(--color-social-bar-track);

  & i {
    display: block;
    block-size: 100%;
    background-color: var(--color-social-live);
  }
}

.left {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-social-pill);
  font-variant-numeric: tabular-nums;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-social-chip-gap);
  align-items: center;
}

.chip {
  padding: var(--space-social-chip);
  border: 1px solid var(--color-social-chip-border-on-image);
  border-radius: var(--social-pill-radius);
  background-color: var(--color-social-chip-on-image);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  line-height: var(--social-chip-line);
  white-space: nowrap;
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
