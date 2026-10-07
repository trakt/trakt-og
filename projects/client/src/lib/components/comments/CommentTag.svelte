<!--
  A comment header's quiet outline tag, with an optional icon: Review, Spoilers, Parent and Blocked on comments, and the
  history, library, rating, type and privacy tags on notes. `tone` colours the outline, text and icon.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  svg?: string;
  tone?: 'spoiler' | 'history' | 'collection' | 'rating' | 'media';
  children: Snippet;
}

const { svg, tone, children }: Props = $props();
</script>

<span class={['tag', tone]}>{#if svg}<Icon {svg} />{/if}{@render children()}</span>

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
  white-space: nowrap;

  &:is(.spoiler, .history, .collection, .rating, .media) {
    border-color: var(--tone);
  }

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-comment-tag-icon);
  }
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
</style>
