<!--
  A comment or review card in the Social Feed's Comments column: what it's on, who wrote it (and "review"), the text,
  then "4 likes · 1 reply · 11h" with the time linking to the comment. A spoiler's text stays blurred until "Show
  spoiler" is pressed. Rows' comment chips jump here, so the card takes focus.
-->
<script lang="ts">
import CommentText from '$lib/components/comments/CommentText.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import type { SocialFeed } from '$lib/dashboard/fetchSocialFeed';
import { countLabel } from '$lib/utils/countLabel';

interface Props {
  item: SocialFeed['comments'][number];
  id: string;
}

const { item, id }: Props = $props();
const comment = $derived(item.comment);
const blocks = $derived(parseComment(comment?.body ?? ''));
let revealed = $state(false);
const hidden = $derived(!!comment?.spoiler && !revealed);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if comment}
  <article class="comment" {id} tabindex="-1">
  <p class="on"><a href={item.href}>{item.label}</a></p>
  <p class="by">
      <img class="avatar" src={item.member.avatar} alt="" loading="lazy" decoding="async" />
      {#if item.member.href}<a class="name" href={item.member.href}>{item.member.name}</a>{:else}<b class="name">{
            item.member.name
          }</b>{/if}
      {#if item.kind === 'review'}<span>· review</span>{/if}
    </p>
  <div class="text">
      <div class={['body', { hidden }]} inert={hidden} aria-hidden={hidden}><CommentText {blocks} /></div>
      {#if hidden}
        <button type="button" class="reveal" onclick={() => (revealed = true)}>Show spoiler</button>
      {/if}
    </div>
  <p class="foot">
      {countLabel(comment.likes, 'like')} · {comment.replies.toLocaleString('en-US')}
      {comment.replies === 1 ? 'reply' : 'replies'} · <a href={comment.href}><time datetime={item.at}>{item.ago}</time></a>
    </p>
</article>
{/if}

<style>
.comment {
  display: grid;
  gap: var(--space-base-block);
  min-inline-size: 0;
  padding: var(--space-social-comment);
  background-color: var(--color-surface);
  font-size: var(--font-size-social-meta);

  & p {
    margin: 0;
  }
}

.on a {
  color: var(--color-text);
  font-weight: bold;
}

.by {
  display: flex;
  gap: var(--space-base-block);
  align-items: center;
  color: var(--color-social-muted);
}

.name {
  color: var(--color-social-name);
  font-weight: bold;
}

.avatar {
  inline-size: var(--social-avatar-small);
  block-size: var(--social-avatar-small);
  border-radius: 50%;
  object-fit: cover;
}

.text {
  display: grid;
  place-items: center;

  & > * {
    grid-area: 1 / 1;
  }
}

.body {
  display: -webkit-box;
  justify-self: stretch;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--social-comment-lines);
  line-clamp: var(--social-comment-lines);
  overflow-wrap: anywhere;

  &.hidden {
    filter: var(--blur-spoiler);
    user-select: none;
  }
}

.reveal {
  min-block-size: 0;
  padding: var(--space-social-pill);
  border: 1px solid var(--color-social-line);
  border-radius: var(--social-pill-radius);
  background-color: var(--color-social-chip-bg);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  cursor: pointer;
}

.foot {
  color: var(--color-social-faint);
  font-size: var(--font-size-social-chip);

  & a {
    color: inherit;
  }
}
</style>
