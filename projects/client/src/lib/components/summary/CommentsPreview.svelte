<!--
  OG's comments preview on a summary: "Comments" with "All N Comments", then a Filter dropdown picking Reactions,
  Recent or Me with "Add comment" beside it, and up to three comments of the pick, reviews featured. Picks without
  comments are left out by the caller. "Add comment" opens the page's new comment form; what it posts goes on top of
  Recent, which it switches to.
  `cut:` "Likes 30 Days" and "Following" (no API sort or filter).
-->
<script lang="ts">
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { page } from '$app/state';
import { commentSettings } from '$lib/components/comments/commentSettings';
import { newComment } from '$lib/components/comments/newComment.svelte';
import type { CommentItem } from '$lib/components/comments/CommentItem';
import type { CommentViewer } from '$lib/components/comments/CommentViewer';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import type { CommentTab } from '$lib/summary/sectionsClient';
import type { FormatDateOptions } from '$lib/utils/formatDate';
import { countLabel } from '$lib/utils/countLabel';
import SectionHeading from './SectionHeading.svelte';
import { withoutBlocked } from '$lib/components/comments/withoutBlocked';
import { withPostedComments } from './withPostedComments.ts';

interface Props {
  tabs: readonly CommentTab[];
  item: CommentItem;
  viewer: CommentViewer;
  /** The item's comment count, for "All N Comments". */
  count: number;
  /** The item's page; the see-more link goes to its `/comments`. */
  href: string;
  dateOptions: Pick<FormatDateOptions, 'order' | 'hour24' | 'timeZone'>;
}

const { tabs: loaded, item, viewer, count, href, dateOptions }: Props = $props();

// Blocked members' comments are dropped, and a tab left empty goes.
const tabs = $derived.by(() => {
  const { blocked } = commentSettings(page.data.settings);
  const kept = loaded.map((tab) => ({ ...tab, comments: withoutBlocked(tab.comments, blocked) }));
  return withPostedComments(kept.filter((tab) => tab.comments.length > 0), newComment.posted);
});
let picked = $state<string>();
$effect(() => {
  if (newComment.posted.length > 0) picked = 'recent';
});
const current = $derived(tabs.find(({ id }) => id === picked) ?? tabs[0]);
</script>

<div class="summary-comments">
  <SectionHeading title="Comments" more={{ href: `${href}/comments`, text: `All ${countLabel(count, 'Comment')}` }} />
  <div class="controls">
    {#if current}
      <Dropdown section="Filter">
        {#snippet trigger()}{current.label}{/snippet}
        <ul>
          {#each tabs as tab (tab.id)}
            <li>
              <button type="button" aria-current={tab.id === current.id} onclick={() => (picked = tab.id)}>{tab.label}</button>
            </li>
          {/each}
        </ul>
      </Dropdown>
    {/if}
    <AddCommentLink />
  </div>
  {#each current?.comments ?? [] as comment (comment.id)}
    <div class="comment">
      <CommentCard {comment} {item} {viewer} {dateOptions} featured={comment.review} wide />
    </div>
  {/each}
</div>

<style>
.summary-comments {
  margin-block-end: var(--gutter);
}

/* Add comment sits as far from the dropdown as the toolbars' Add list does. */
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--toolbar-gap);
  padding-block-start: var(--space-heading-dropdowns);
}

.comment {
  margin-block-start: var(--gutter);

  /* A deleted comment leaves its wrapper empty. */
  &:not(:has(.comment-wrapper)) {
    display: none;
  }
}
</style>
