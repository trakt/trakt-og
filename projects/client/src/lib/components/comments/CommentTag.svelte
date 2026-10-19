<!--
  A comment header's quiet outline tag, with an optional icon: the history, library, rating, type and privacy tags on
  notes. `tone` colours the outline, text and icon. `tint` is the comment card's tag, top right like a list row's
  chips: Linked (the comment a link pointed at), Friend or Following, OP, the author's plays, their rating, Review, Spoilers, Parent and Blocked, filled with a
  wash of its tone. `solid` fills it with its tone, for a show or season the author has watched all of. `glyph` marks
  a Trakt-font icon, which sits high and is nudged down to the text's middle.
    <CommentTag svg={star} tone="review" tint>Review</CommentTag>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  svg?: string;
  tone?:
    | 'spoiler'
    | 'history'
    | 'collection'
    | 'rating'
    | 'media'
    | 'review'
    | 'rated'
    | 'op'
    | 'watched'
    | 'friend'
    | 'following'
    | 'linked';
  tint?: boolean;
  solid?: boolean;
  glyph?: boolean;
  children: Snippet;
}

const { svg, tone, tint = false, solid = false, glyph = false, children }: Props = $props();
</script>

<span class={['tag', tone, { tint, solid, glyph }]}>{#if svg}<Icon {svg} />{/if}{@render children()}</span>

<style>
.tag {
  --tone: var(--color-comment-muted);
  display: inline-flex;
  align-items: center;
  gap: var(--comment-tag-gap);
  block-size: var(--comment-tag-height);
  padding: var(--comment-tag-padding);
  border: 1px solid var(--color-comment-tag-border);
  border-radius: var(--radius-comment-tag);
  color: var(--tone);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-tag);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  /* Its own case and spacing, even inside an uppercase label (the notes dialog's privacy tag). */
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;

  &:is(.spoiler, .history, .collection, .rating, .media) {
    border-color: var(--tone);
  }

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-comment-tag-icon);
  }
}

/* The list row's chip: its tone's wash and outline, the text a shade toward the page's ink. */
.tint {
  --tone: var(--color-comment-chip-quiet);
  block-size: var(--comment-chip-height);
  padding: 0 var(--comment-chip-padding);
  border-color: color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-list-card-chip);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-variant-numeric: tabular-nums;

  &.spoiler {
    --tone: var(--color-comment-chip-spoiler);
  }

  /* Over the outline tags' full-tone border for these tones. */
  &:is(.spoiler, .history, .collection, .rating, .media) {
    border-color: color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  }
}

.glyph :global(.icon) {
  --icon-shift: var(--quick-icon-trakt-shift);
}

.tint.solid {
  border-color: var(--tone);
  background-color: var(--tone);
  color: var(--color-text-inverse);
}

.spoiler {
  --tone: var(--color-comment-tag-spoiler);
}

.history {
  --tone: var(--color-note-tag-history);
}

.collection {
  --tone: var(--color-note-tag-collection);
}

.rating {
  --tone: var(--color-note-tag-rating);
}

.media {
  --tone: var(--color-note-tag-media);
}

.review {
  --tone: var(--color-comment-chip-review);
}

.rated {
  --tone: var(--color-comment-chip-rated);
}

.op {
  --tone: var(--color-comment-chip-op);
  font-weight: var(--font-weight-headings-heavy);
}

.watched {
  --tone: var(--color-comment-chip-watched);
}

.friend {
  --tone: var(--color-comment-chip-friend);
}

.following {
  --tone: var(--color-comment-chip-following);
}

.linked {
  --tone: var(--color-comment-chip-linked);
}
</style>
