<!--
  A note in the comments' style: the author's avatar in a column, then the name, member badge and date with tinted tags
  top right (what it's attached to, the item type, the privacy and spoilers, each in its own colour with an icon), the
  text in the comments' bordered bubble with read more and spoiler blur, and a footer bar like a comment's stats bar:
  the watch, collect or rate date in the attachment's colour, and the manage icons at its end.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import CommentAvatar from '$lib/components/comments/CommentAvatar.svelte';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import NoteText from '$lib/components/notes/NoteText.svelte';
import PrivacyTag from '$lib/components/notes/PrivacyTag.svelte';
import Icon from '$lib/icons/Icon.svelte';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import user from '$lib/icons/trakt/user.svg?raw';
import type { NoteView } from '$lib/users/notes/NoteView';

const { note, manage }: { note: NoteView; manage?: Snippet } = $props();

const activityIcons = { history: check, collection, rating: heart };
const mediaIcons = { movie: cameraMovie, show: tvRetro, season: tvRetro, episode: tvRetro, person: user };
const mediaLabel = $derived(note.item.type.charAt(0).toUpperCase() + note.item.type.slice(1));
// "Watched", "Collected" or "Rated 9", bold before the date.
const activityLabel = $derived.by(() => {
  const activity = note.activity;
  if (!activity) return '';
  if (activity.type === 'rating') return `Rated ${activity.rating ?? ''}`.trim();
  return { history: 'Watched', collection: 'Collected' }[activity.type];
});
</script>

{#snippet avatar()}
  <CommentAvatar src={note.author.avatar} />
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
      </p>
      <p class="when"><time datetime={note.updatedAt}>{note.updatedDate}</time></p>
      <p class="tags">
        {#if note.activity}
          <CommentTag svg={activityIcons[note.activity.type]} glyph={note.activity.type !== 'rating'} tone={note.activity.type}
            tint>{note.activity.label}</CommentTag>
        {/if}
        <CommentTag svg={mediaIcons[note.item.type]} tone="media" tint>{mediaLabel}</CommentTag>
        <PrivacyTag privacy={note.privacy} />
        {#if note.spoiler}<CommentTag svg={eyeSlash} tone="spoiler" tint>Spoilers</CommentTag>{/if}
      </p>
    </header>

    <div class="bubble"><NoteText text={note.text} concealed={note.concealed} /></div>

    {#if note.activity || manage}
      <footer class="under-note">
        {#if note.activity}
          <span class={['activity', note.activity.type]}>
            <span class={{ glyph: note.activity.type !== 'rating' }}><Icon svg={activityIcons[note.activity.type]} /></span>
            <strong>{activityLabel}</strong>{#if note.activity.date}<span class="date">{note.activity.date}</span>{/if}
          </span>
        {/if}
        {#if manage}<div class="tools">{@render manage()}</div>{/if}
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

/* The name and badge, then the date, centred against the avatar, with the tags across from them at the top right. */
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

.tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-self: start;
  gap: var(--comment-tags-gap);
  grid-area: 1 / 2 / span 2;
  margin: 0;
}

.when {
  grid-column: 1;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);
}

/* The manage icons at the footer's end, in their colors like a comment's. */
.tools {
  display: flex;
  margin-inline-start: auto;
}

/* The comments' bubble: bordered, every corner alike. */
.bubble {
  margin-block-start: var(--comment-bubble-gap);
  padding: var(--comment-bubble-padding);
  border: 1px solid var(--color-comment-bubble-border);
  border-radius: var(--radius-comment-bubble-round);
  background-color: var(--color-comment-bg);
  overflow-wrap: break-word;
}

/* Like a comment's stats bar: the attachment's date in its colour, then the tools at the end. */
.under-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-stats-gap);
  padding-block-start: var(--comment-stats-space);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
}

/* The watch, collect or rate date in a box the footer buttons' size, washed in the attachment's colour. */
.activity {
  --tone: var(--color-note-tag-history);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--note-activity-gap);
  min-block-size: var(--control-height);
  padding-inline: var(--glass-action-padding-card);
  border: 1px solid color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-control);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-family: var(--font-body);
  font-size: var(--font-size-glass-action);
  font-weight: normal;
  white-space: nowrap;

  & :global(.icon) {
    flex: none;
    color: var(--tone);
  }

  & strong {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }

  &.collection {
    --tone: var(--color-note-tag-collection);
  }

  &.rating {
    --tone: var(--color-note-tag-rating);
  }
}

/* The Trakt-font check and library icons sit high. */
.glyph {
  display: inline-flex;
  --icon-shift: var(--quick-icon-trakt-shift);
}

@media (prefers-reduced-motion: reduce) {
  .tools {
    transition: none;
  }
}
</style>
