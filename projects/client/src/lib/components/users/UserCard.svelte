<!--
  OG's user card, three to a row on the network page, as a small profile header: the avatar and the name with the VIP
  label over a small grey location tag, centered on it, sit on the user's cover (the default
  one when unset, theirs fading in once it loads), then the profile header's follow buttons, and a darker band along
  the bottom, like a dialog's footer, with
  the chips: Private, the VIP veteran title and the year the follow started, as a green "Friends since" when they
  follow each other and a grey "Since" otherwise. `watch` marks someone watching now: the cover becomes the show's or movie's
  fanart with the dashboard's pulsing tags and title at the top, the time left across from them, and the live
  progress bar along the bottom edge.
  `relation` is the viewer's follow state with this user; pass null for your own card or when signed out, which
  leaves the buttons out, and `pending` while it loads, which holds their place with a shimmer. Buttons update the
  viewer's relationship immediately, with rollback on a failed write.
    <UserCard user={toProfileUser(row.user)} relation={relations[row.user.ids.slug]} />
-->
<script lang="ts">
import defaultCover from '$lib/assets/profile-cover-default.jpg';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import FollowButtonShimmer from '$lib/components/loading/FollowButtonShimmer.svelte';
import CardTag from '$lib/components/media/CardTag.svelte';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import Countdown from '$lib/components/status/Countdown.svelte';
import FollowButtons from '$lib/components/users/FollowButtons.svelte';
import { liveTags } from '$lib/dashboard/liveTags';
import type { LiveTile } from '$lib/dashboard/liveTiles';
import lock from '$lib/icons/regular/lock.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import locationPin from '$lib/icons/solid/location-pin.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import { fadeInOnLoad } from '$lib/utils/fadeInOnLoad';
import { imageUrl } from '$lib/utils/imageUrl';

interface Props {
  user: ProfileUser;
  relation?: ViewerRelation | null;
  /** The viewer's follow state is still loading. */
  pending?: boolean;
  canFollow?: boolean;
  /** What they're watching now, with how far in. */
  watch?: LiveTile | null;
  /** The VIP veteran title: "Veteran" or "Legend". */
  veteran?: string | null;
  /** When the follow started, as the API's ISO timestamp. */
  since?: string | null;
}

const { user, relation = null, pending = false, canFollow = true, watch = null, veteran = null, since = null }: Props =
  $props();
const href = $derived(`/users/${user.slug}`);
const media = $derived(watch?.watch ?? null);
const tags = $derived(media ? liveTags(media) : []);
const friends = $derived(relation?.follow === 'following' && relation.followsYou);
const sinceYear = $derived(since ? new Date(since).getUTCFullYear() : null);
</script>

<!-- Profile and media links go to OG routes some of which other issues build; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<article class={['user-card', { live: media }]}>
  <div class="art">
    <a class="cover" {href} tabindex="-1" aria-hidden="true">
      {#if media}
        <img src={imageUrl(media.fanart ?? media.still, 'medium')} alt="" {@attach fadeInOnLoad()} />
      {:else}
        <img src={defaultCover} alt="" loading="lazy" />
        {#if user.coverUrl}<img src={user.coverUrl} alt="" loading="lazy" {@attach fadeInOnLoad()} />{/if}
      {/if}
      <span class="shade"></span>
    </a>

    {#if watch && media}
      <div class="now">
        <div class="now-title">
          <span class="tags">{#each tags as tag, i (i)}<CardTag {...tag} />{/each}</span>
          {#if media.episode}<a class="show" href={media.title.href}>{media.title.name}</a>{/if}
          <a class="watching" href={media.href}>{media.episode ? media.code : media.title.name}</a>
        </div>
        <span class="left"><Countdown startedAt={media.startedAt} endsAt={media.expiresAt} /></span>
      </div>
      <div class="bar">
        <UnderProgress
          live
          href={media.href}
          percent={watch.progress}
          tip={`${watch.progress}% watched\n${watch.minutesLeft}m left`}
        />
      </div>
    {/if}

    <div class="who">
      <a class="avatar" {href} tabindex="-1" aria-hidden="true"><img src={user.avatarUrl} alt="" loading="lazy" /></a>
      <div class="text">
        <h2 class="name">
          <a {href}>{user.displayName}</a>
          {#if user.vip}<VipLabel badge={user.vip} pill />{/if}
        </h2>
        {#if !user.isLocked}
          <p class="facts">
            <CommentTag svg={locationPin} tone="following" tint><b>{user.location}</b></CommentTag>
          </p>
        {/if}
      </div>
    </div>
  </div>

  {#if pending}
    <div class="buttons" aria-busy="true"><FollowButtonShimmer /></div>
  {:else if relation}
    <div class="buttons"><FollowButtons slug={user.slug} isPrivate={user.isPrivate} {relation} {canFollow} /></div>
  {/if}
  <!-- Always there, chips or not, so every card in a row has the same shape. -->
  <footer class="band">
    {#if user.isPrivate}<CommentTag svg={lock} color="var(--color-list-chip-private)" tint>Private</CommentTag>{/if}
    {#if veteran}<CommentTag svg={star} color="var(--color-user-card-chip-veteran)" tint>{veteran}</CommentTag>{/if}
    {#if friends}
      <CommentTag svg={userGroup} tone="friend" tint>Friends{#if sinceYear}&nbsp;since {sinceYear}{/if}</CommentTag>
    {:else if sinceYear}
      <CommentTag tone="following" tint>Since {sinceYear}</CommentTag>
    {/if}
  </footer>
</article>

<style>
.user-card {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  overflow: hidden;
  border-radius: var(--user-card-radius);
  background-color: var(--color-user-card-foot-bg);
  box-shadow: 0 0 0 1px var(--color-user-card-frame-line);

  & a {
    color: inherit;
  }
}

.art {
  position: relative;
  aspect-ratio: 16 / 9;
  background-color: var(--color-surface);
}

.cover {
  position: absolute;
  inset: 0;

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

/* Under the name and pills; a live card is shaded at the top too, for the tags and title. */
.shade {
  position: absolute;
  inset: 0;
  background: var(--gradient-user-card-shade);

  .live & {
    background: var(--gradient-user-card-live-shade);
  }
}

.now {
  position: absolute;
  inset-block-start: var(--user-card-inset);
  inset-inline: var(--user-card-inset);
  display: flex;
  gap: var(--space-sm-inline);
  align-items: flex-start;
  justify-content: space-between;
}

.now-title {
  display: grid;
  justify-items: start;
  min-inline-size: 0;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-headings);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-inline);
  margin-block-end: var(--user-card-live-gap);
}

.show {
  color: var(--gray-lighter);
  font-size: var(--font-size-h5);
}

.watching {
  font-size: var(--font-size-fanart-title);
  font-weight: var(--font-weight-headings-heavy);
}

.show,
.watching {
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.left {
  flex: none;
  color: var(--color-card-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-card-subtitle);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  text-shadow: var(--text-shadow-headings);
}

.bar {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 1;
}

/* Always clear of the live progress bar's room, so the avatar and name sit in the same place live or not. */
.who {
  position: absolute;
  inset-inline: var(--user-card-inset);
  inset-block-end: calc(var(--user-card-inset) + var(--progress-under-height));
  display: flex;
  gap: var(--user-card-who-gap);
  align-items: center;
}

.avatar img {
  display: block;
  box-sizing: border-box;
  inline-size: var(--user-card-avatar-size);
  block-size: var(--user-card-avatar-size);
  border: var(--user-card-avatar-border) solid var(--color-user-card-avatar-ring);
  border-radius: 50%;
  background-color: var(--color-avatar-border);
  object-fit: cover;
}

/* The name over the location, as a small tag rather than the profile header's pill. */
.text {
  display: grid;
  gap: var(--user-card-text-gap);
  min-inline-size: 0;
}

/* The bottom bar's grey tags, so the facts read as quietly as "Since", their values in bold white like the header's. */
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--comment-tags-gap);
  margin: 0;

  & b {
    color: var(--color-card-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* The name with its VIP label centered on it. */
.name {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  margin: 0;
  color: var(--color-card-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-user-card-name);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
  white-space: nowrap;
  text-shadow: var(--text-shadow-headings);

  & > a {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & :global(.label-vip) {
    flex: none;
    text-shadow: none;
  }
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--user-card-btn-gap);
  padding: var(--user-card-inset);
}

/* Along the card's bottom edge, a step darker with a rule on top, like a dialog's footer. */
.band {
  display: flex;
  flex-wrap: wrap;
  gap: var(--user-card-inset);
  align-items: center;
  min-block-size: var(--user-card-band-height);
  margin-block-start: auto;
  padding: var(--user-card-band-padding);
  border-block-start: 1px solid var(--color-user-card-band-line);
  background-color: var(--color-user-card-band-bg);
}
</style>
