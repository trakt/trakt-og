<!--
  Someone the viewer follows watching now: the dashboard's fanart card, as Recently Watched draws it but without the
  quick icons, with Up Next's progress bar under it, then one line: who on the left and the time left ticking down on
  the right. Its tags
  are the pulsing "Watching now" (or "Checked in") and the type; an episode's show sits small over its number and
  title.
-->
<script lang="ts">
import FanartCard from '$lib/components/media/FanartCard.svelte';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import Countdown from '$lib/components/status/Countdown.svelte';
import type { LiveTile } from '$lib/dashboard/liveTiles';
import type { SocialTarget } from '$lib/dashboard/toSocialItem';
import { imageUrl } from '$lib/utils/imageUrl';

const { tile }: { tile: LiveTile } = $props();

const TYPES: Readonly<Record<SocialTarget['type'], string>> = { episode: 'Episode', movie: 'Movie', show: 'Show' };

const watch = $derived(tile.watch);
const tags = $derived([
  { text: watch.kind === 'checkin' ? 'Checked in' : 'Watching now', kind: 'primary' as const, live: true },
  { text: TYPES[watch.target.type], kind: 'generic' as const },
]);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="tile">
  <FanartCard
    framed
    href={watch.href}
    title={watch.episode ? watch.episode.title ?? '' : watch.title.name}
    number={watch.code}
    smallTitle={watch.episode ? { text: watch.title.name, href: watch.title.href } : undefined}
    image={imageUrl(watch.still, 'medium')}
    {tags}
  >
    {#snippet progress()}
      <UnderProgress
        live
        href={watch.href}
        percent={tile.progress}
        lines={[[{ text: `${tile.progress}% watched` }, { text: `${tile.minutesLeft}m left` }]]}
      />
    {/snippet}
  </FanartCard>
  <div class="below">
    <p class="who">
      <img class="avatar" src={watch.member.avatar} alt="" loading="lazy" decoding="async" />
      {#if watch.member.href}<a href={watch.member.href}>{watch.member.name}</a>{:else}<span>{watch.member.name}</span>{/if}
    </p>
    <p class="when">
      <Countdown startedAt={watch.startedAt} endsAt={watch.expiresAt} />
    </p>
  </div>
</div>

<style>
.tile {
  min-inline-size: 0;
}

/* One line under the bar: who in a card title's style with their avatar, and the time left on the right. */
.below {
  display: flex;
  gap: var(--space-sm-inline);
  align-items: center;
  justify-content: space-between;
  margin-block: calc(var(--space-under-progress-title) - var(--progress-under-height)) var(--space-xs-block);
}

/* Up Next's title spacing under its progress bar, held to the title's line height so the avatar doesn't push the
   line under it further away than on a poster. */
.who {
  display: flex;
  gap: var(--space-social-who-avatar);
  align-items: center;
  min-inline-size: 0;
  block-size: var(--line-height-social-who);
  margin: 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-card-title);
  line-height: var(--line-height-social-who);

  & a,
  & span {
    overflow: hidden;
    color: var(--color-text);
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & a:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.when {
  flex: none;
  margin: 0;
  color: var(--color-card-subtitle);
  font-family: var(--font-headings);
  font-size: var(--font-size-card-subtitle);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-social-who);
}

.avatar {
  flex: none;
  inline-size: var(--social-avatar-small);
  block-size: var(--social-avatar-small);
  border-radius: 50%;
  object-fit: cover;
}
</style>
