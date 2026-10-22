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
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '$lib/components/dashboard/PanelHelp.svelte';
import commentIcon from '$lib/icons/regular/comment.svg?raw';
import { gifQueryOf } from './gif/gifQueryOf.ts';
import CommentComposer from './CommentComposer.svelte';
import type { CommentItem } from './CommentItem';
import { focusComment } from './focusComment.ts';
import type { GifEntry } from './gif/GifEntry.ts';
import { newComment } from './newComment.svelte.ts';
import { postComment } from './postComment.ts';
import { prefersReducedMotion } from 'svelte/motion';

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
    const reduced = prefersReducedMotion.current;
    section?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    composer?.focus();
  });
});

// The create response leaves out images unless asked, and the member is the viewer.
const withAvatar = (comment: CommentResponse): CommentResponse =>
  comment.user.images || !settings ? comment : { ...comment, user: { ...comment.user, images: settings.user.images } };

const save = (text: string, spoiler: boolean, gif: GifEntry | null) =>
  postComment({ fetch: authenticatedFetch({ manager: userManager() }), item, comment: text, spoiler, gif });

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
    <div class="heading">
      <PanelHeading id="{id}-title" title="Add your comment" icon={commentIcon} />
      <PanelHelp id="{id}-rules">Write at least 5 words, keep it respectful, and mark anything that spoils the story.</PanelHelp>
    </div>
    {#if newComment.visible}
      <CommentComposer
        bind:this={composer}
        label="Your comment"
        placeholder="Add a comment as {name}..."
        submit="Post"
        posting="Posting your comment"
        avatar={user.images.avatar.full}
        rulesId="{id}-rules"
        spoiler={false}
        confirmLeave
        gifs={page.data.gifs}
        gifQuery={gifQueryOf(item)}
        oncancel={cancel}
        {save}
        onsaved={posted}
      />
    {/if}
  </section>
{/if}

<style>
.new-comment {
  margin-block-start: var(--comment-composer-pull-up);
  padding-block-end: var(--comment-composer-space-end);
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

/* The dashboard panels' heading: the title over a faint comment mark, the rules as its help line. */
.heading {
  margin-block-end: var(--comment-composer-heading-gap);
}
</style>
