<!--
  A note on the comment card's thread layout: the author's avatar (with their rating on a rating note) in a column, then
  the name, the member badge and the note's tags, the date, and the text in a soft bubble with read more and spoiler blur.
  The tags say what the note is attached to (history, library or rating), the item type, the privacy and spoilers, each
  in its own colour with an icon. Under the bubble, the watch, collect or rate date in the attachment's colour. The
  manage icons at the end of the name row stay faint until the card is hovered or focused.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import CommentAvatar from '$lib/components/comments/CommentAvatar.svelte';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import NoteText from '$lib/components/notes/NoteText.svelte';
import Icon from '$lib/icons/Icon.svelte';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import globe from '$lib/icons/solid/globe.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import user from '$lib/icons/trakt/user.svg?raw';
import type { NoteView } from '$lib/users/notes/NoteView';

const { note, manage }: { note: NoteView; manage?: Snippet } = $props();

const activityIcons = { history: check, collection, rating: heart };
const mediaIcons = { movie: cameraMovie, show: tvRetro, season: tvRetro, episode: tvRetro, person: user };
const privacy = {
  private: { svg: lockKeyhole, label: 'Private' },
  friends: { svg: friends, label: 'Friends' },
  public: { svg: globe, label: 'Public' },
};
const mediaLabel = $derived(note.item.type.charAt(0).toUpperCase() + note.item.type.slice(1));
// "Watched Sep 19, 2025 6:39 PM", "Collected ...", "Rated 9 · ...".
const activityText = $derived.by(() => {
  const activity = note.activity;
  if (!activity) return '';
  if (activity.type === 'rating') {
    return [`Rated ${activity.rating ?? ''}`.trim(), activity.date].filter(Boolean).join(' · ');
  }
  return [{ history: 'Watched', collection: 'Collected' }[activity.type], activity.date].filter(Boolean).join(' ');
});
</script>

{#snippet avatar()}
  <CommentAvatar src={note.author.avatar} rating={note.activity?.rating} />
{/snippet}

<!-- The API supplies canonical user URLs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<article class="note-card" aria-label="Note by {note.author.name}">
  <div>
    {#if note.author.href}
      <a class="avatar" href={note.author.href} tabindex="-1" aria-hidden="true">{@render avatar()}</a>
    {:else}
      <span class="avatar">{@render avatar()}</span>
    {/if}
  </div>

  <div class="main">
    <header class="above-note">
      <p class="byline">
        {#if note.author.href}
          <a class="username" href={note.author.href}>{note.author.name}</a>
        {:else}
          <strong class="username">{note.author.name}</strong>
        {/if}
        {#if note.author.vip}<VipLabel badge={note.author.vip} quiet />{/if}
        {#if note.activity}
          <CommentTag svg={activityIcons[note.activity.type]} tone={note.activity.type}>{note.activity.label}</CommentTag>
        {/if}
        <CommentTag svg={mediaIcons[note.item.type]} tone="media">{mediaLabel}</CommentTag>
        <CommentTag svg={privacy[note.privacy].svg}>{privacy[note.privacy].label}</CommentTag>
        {#if note.spoiler}<CommentTag svg={eyeSlash} tone="spoiler">Spoilers</CommentTag>{/if}
      </p>
      <p class="when"><time datetime={note.updatedAt}>{note.updatedDate}</time></p>
      {#if manage}<div class="tools">{@render manage()}</div>{/if}
    </header>

    <div class="bubble"><NoteText text={note.text} concealed={note.concealed} /></div>

    {#if note.activity}
      <footer class="under-note">
        <span class={['activity', note.activity.type]}><Icon svg={activityIcons[note.activity.type]} />{activityText}</span>
      </footer>
    {/if}
  </div>
</article>

<style>
/* The comment card's two columns: the avatar, and everything else. */
.note-card {
  display: grid;
  grid-template-columns: var(--comment-avatar) minmax(0, 1fr);
  column-gap: var(--comment-column-gap);
  margin-block-end: var(--note-padding);
}

.avatar {
  display: block;
}

.main {
  min-inline-size: 0;
  padding-block-end: var(--comment-main-padding-end);
}

/* Two lines centred against the avatar: the name, badge and tags, then the date. The manage icons end the name's line. */
.above-note {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: var(--comment-head-line-gap) var(--comment-head-gap-inline);
  min-block-size: var(--comment-avatar);
}

.byline,
.when {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-inline-size: 0;
  margin: 0;
  line-height: var(--line-height-headings);
}

.byline {
  gap: var(--comment-head-gap);
}

.username {
  color: var(--color-comment-name);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:is(a):hover {
    color: var(--color-link);
  }
}

.when {
  grid-column: 1 / -1;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);
}

/* Faint until the card is hovered or has the focus. Touch screens always show them. */
.tools {
  display: flex;
  grid-area: 1 / 2;
  align-self: center;
  margin-block: var(--comment-tools-overhang);
  opacity: var(--opacity-comment-tools-idle);
  transition: opacity var(--transition-comment-quiet);

  @media (hover: none) {
    opacity: 1;
  }
}

.note-card:is(:hover, :focus-within) .tools {
  opacity: 1;
}

.bubble {
  margin-block-start: var(--comment-bubble-gap);
  padding: var(--comment-bubble-padding);
  border-radius: var(--radius-comment-bubble);
  background-color: var(--color-comment-bg);
  overflow-wrap: break-word;
}

/* The comment card's quiet action row, holding the attachment's date in its colour. */
.under-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-actions-gap);
  padding: var(--comment-actions-padding);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
}

.activity {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-action-icon-gap);

  & :global(.icon) {
    --icon-shift: var(--comment-action-icon-shift);
    flex: none;
    font-size: var(--font-size-comment-action-icon);
  }

  &.history {
    color: var(--color-note-tag-history);
  }

  &.collection {
    color: var(--color-note-tag-collection);
  }

  &.rating {
    color: var(--color-note-tag-rating);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tools {
    transition: none;
  }
}
</style>
