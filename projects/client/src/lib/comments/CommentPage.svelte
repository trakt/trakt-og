<!--
  A comment's own page: the item's slim fanart header with "Shout by NAME", the summary sidebar with its section links,
  then the comment as the root of its thread, scaled up, and every reply on one rail under it, oldest first, after a
  small "N replies" divider. The thread ends with the reply box. There's no pagination and no comment form. A reply
  posted here goes on top of the replies, and deleting the comment itself goes on to the item's comments.
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { CommentResponse } from '@trakt/api';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { authorOf } from '$lib/components/comments/authorOf';
import RepliesDivider from '$lib/components/comments/RepliesDivider.svelte';
import { commentSettings } from '$lib/components/comments/commentSettings';
import { withoutBlocked } from '$lib/components/comments/withoutBlocked';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import ExternalLinks from '$lib/components/summary/ExternalLinks.svelte';
import SectionNav from '$lib/components/summary/SectionNav.svelte';
import SubpageTitle from '$lib/components/summary/SubpageTitle.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import type { loadComment } from './loadComment.ts';

const { data }: { data: Awaited<ReturnType<typeof loadComment>> } = $props();
const media = $derived(data.media);
let posted = $state<readonly CommentResponse[]>([]);
// Blocked members' replies are dropped.
const thread = $derived([
  ...posted,
  ...withoutBlocked(data.replies, commentSettings(page.data.settings).blocked).filter(({ id }) =>
    !posted.some((reply) => reply.id === id)
  ),
]);
const addReply = (reply: CommentResponse) => (posted = [reply, ...posted]);
// The count and the delete rule go by the replies posted here too.
const comment = $derived({ ...data.comment, replies: data.comment.replies + posted.length });
const author = $derived(authorOf(comment.user));
// The header and the page title go by the comment alone, even on lists.
const type = $derived(comment.review ? 'Review' : 'Shout');
const viewer = $derived(data.user ? { slug: data.user.slug } : null);
const commentsHref = $derived(`${media.href}/comments`);
// API's `' Reply'.pluralize(n)`, with no delimiter in the sidebar.
const repliesWord = (count: number) => (count === 1 ? 'Reply' : 'Replies');
const sections = $derived([
  { label: `Read ${type}`, href: '#read' },
  { label: `${comment.replies} ${repliesWord(comment.replies)}`, href: '#replies' },
  { label: 'All Comments', href: commentsHref },
]);
const title = $derived(`${media.item.title} ${type.toLowerCase()} by ${author.name}`);
</script>

<!-- Hrefs are built from API slugs, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content={comment.comment} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={comment.comment} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={new URL(`/comments/${comment.id}`, page.url.origin).href} />
  {#if media.poster}<meta property="og:image" content={media.poster} />{/if}
</svelte:head>

<FanartHeader image={media.fanart} slim>
  <SubpageTitle
    label="{type} by {author.name}"
    parents={media.parents}
    title={media.title}
    year={media.year}
    href={media.href}
  />
</FanartHeader>

<SummaryFrame label={media.title} fullWidth>
  {#snippet sidebar()}
    <a href={commentsHref}>
      <SummaryPoster image={media.poster} alt={media.item.title} ratingTarget={media.ratingTarget} />
    </a>
    {#if data.watchNow && media.watchNow}
      <WatchNow button={data.watchNow} title={media.watchNow.title} year={media.watchNow.year} fanart={media.fanart} />
    {/if}
    <SectionNav {sections} label="Comment sections" />
    <ExternalLinks links={media.links} />
  {/snippet}

  {#snippet details()}
    <div id="read" class="read">
      <CommentCard
        {comment}
        item={media.item}
        {viewer}
        dateOptions={data.datePreferences}
        wide
        read
        onreply={addReply}
        ondelete={() => goto(commentsHref)}
      >
        {#snippet replies()}
          {#if thread.length > 0}
            <div id="replies" class="replies">
              <RepliesDivider count={thread.length} />
              {#each thread as reply (reply.id)}
                <CommentCard
                  comment={reply}
                  item={media.item}
                  {viewer}
                  dateOptions={data.datePreferences}
                  opSlug={author.slug}
                  inheritSpoiler={comment.spoiler}
                  nested
                  onreply={addReply}
                />
              {/each}
            </div>
          {/if}
        {/snippet}
      </CommentCard>
    </div>
  {/snippet}
</SummaryFrame>

<style>
.replies {
  display: grid;
  gap: var(--comment-thread-gap);
  scroll-margin-block-start: calc(var(--header-height) + var(--gutter));
}
</style>
