<!--
  The new comment form, under a summary's overview and above an item's or a list's comments, for members who may
  comment. Hidden until an "Add comment" button opens it; then it scrolls into view with the composer open beside the
  viewer's avatar and the field focused. Cancel hides it again (asking first when there's text), and so does posting.
  It posts in the browser: the new comment goes to the top of the page's list, and failures toast and refocus the
  field. Leaving with unposted text asks first.
  `cut:` the X, Mastodon, Tumblr and Medium toggles (the integrations are gone, as on check-in) and the emoji picker.
  The rules links pointed at `/about/comments`, which no longer exists, so the rules are plain text, and "English only"
  is gone from them: the API doesn't check it.
-->
<script lang="ts">
import { page } from '$app/state';
import type { CommentResponse } from '@trakt/api';
import { tick } from 'svelte';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import type { ViewerSettings } from '$lib/settings/ViewerSettings';
import CommentComposer from './CommentComposer.svelte';
import type { CommentItem } from './CommentItem';
import { focusComment } from './focusComment.ts';
import { newComment } from './newComment.svelte.ts';
import { postComment } from './postComment.ts';

const { item }: { item: CommentItem } = $props();

const id = $props.id();
// The root layout's `/users/settings`, null logged out.
const settings: ViewerSettings | null = $derived(page.data.settings ?? null);
const user = $derived(settings?.permissions.commenting ? settings.user : null);
const name = $derived(user ? user.name?.trim() || user.username : '');

let section = $state<HTMLElement>();
let composer = $state<ReturnType<typeof CommentComposer>>();

$effect(() => (user ? newComment.mount() : undefined));

// Each "Add comment" click.
$effect(() => {
  if (newComment.opened === 0) return;
  void tick().then(() => {
    section?.scrollIntoView({ block: 'start' });
    composer?.focus();
  });
});

// The create response leaves out images unless asked, and the member is the viewer.
const withAvatar = (comment: CommentResponse): CommentResponse =>
  comment.user.images || !settings ? comment : { ...comment, user: { ...comment.user, images: settings.user.images } };

const save = (text: string, spoiler: boolean) =>
  postComment({ fetch: authenticatedFetch({ manager: userManager() }), item, comment: text, spoiler });

// The focus goes back to the "Add comment" button that opened the form.
function cancel() {
  const opener = newComment.opener;
  newComment.close();
  opener?.focus();
}

async function posted(comment: CommentResponse | null) {
  newComment.close();
  if (!comment) return;
  newComment.add(withAvatar(comment));
  await focusComment(comment.id);
}
</script>

{#if user}
  <section id="new-comment" class="new-comment" bind:this={section} hidden={!newComment.visible}
  aria-labelledby="{id}-title">
    <h2 id="{id}-title"><strong>Add</strong> your comment</h2>
    {#if newComment.visible}
      <CommentComposer
        bind:this={composer}
        label="Your comment"
        placeholder="Add a comment as {name}..."
        submit="Post"
        posting="Posting your comment"
        avatar={user.images.avatar.full}
        rules="5+ words, be respectful, mark spoilers."
        spoiler={false}
        confirmLeave
        oncancel={cancel}
        {save}
        onsaved={posted}
      />
    {/if}
  </section>
{/if}

<style>
.new-comment {
  padding-block-end: var(--gutter);
  scroll-margin-block-start: var(--header-height);

  @media (prefers-reduced-motion: no-preference) {
    animation: fade-in var(--transition-comment-fade);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

h2 {
  margin: 0 0 var(--comment-composer-heading-gap);
  font-weight: var(--font-weight-headings-light);

  & strong {
    font-weight: var(--font-weight-headings);
  }
}
</style>
