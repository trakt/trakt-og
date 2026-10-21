<!--
  OG's comments preview on a summary: "Comments" with "All N Comments", then a Filter dropdown picking Popular,
  Recent or Me and a Language dropdown (English first, reloading through `reload`) with "Add comment" beside them,
  the new comment form (`form`) under them while it's open, and up to three comments of the pick, reviews featured.
  With nothing to show in the first language (English), only the form renders, without the heading, so the page's
  Add Comment still opens it; a comment posted from it shows the section. Picks without comments are left out by the
  caller. After picking another language with none, the controls stay so another can be picked. "Add comment" opens
  the page's new comment form; what it posts goes on top of Recent, which it switches to.
  `cut:` "Likes 30 Days" and "Following" (no API sort or filter).
-->
<script lang="ts">
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { page } from '$app/state';
import { commentSettings } from '$lib/components/comments/commentSettings';
import { newComment } from '$lib/components/comments/newComment.svelte';
import type { CommentItem } from '$lib/components/comments/CommentItem';
import type { Snippet } from 'svelte';
import type { CommentViewer } from '$lib/components/comments/CommentViewer';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import type { CommentTab } from '$lib/summary/sectionsClient';
import type { FormatDateOptions } from '$lib/utils/formatDate';
import { countLabel } from '$lib/utils/countLabel';
import { commentLanguage } from '$lib/comments/commentLanguage';
import { type CommentLanguage, commentLanguages } from '$lib/comments/commentLanguages';
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
  /** The tabs again in another language (`null` for all of them). Left out, there's no Language dropdown. */
  reload?: (language: string | null) => Promise<readonly CommentTab[] | null>;
  /** The page's new comment form, under the controls. */
  form?: Snippet;
}

const { tabs: first, item, viewer, count, href, dateOptions, reload, form }: Props = $props();

let language = $state<CommentLanguage>('en');
let reloaded = $state<readonly CommentTab[]>();
const loaded = $derived(reloaded ?? first);
const shown = $derived(commentLanguage(language));

// The last pick wins, however the reads come back.
async function pickLanguage(code: CommentLanguage) {
  if (!reload || code === language) return;
  language = code;
  picked = undefined;
  const tabs = await reload(commentLanguage(code).api ?? null).catch(() => null);
  if (language === code) reloaded = tabs ?? [];
}

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

<!-- Nothing to show until another language is picked: only the form. -->
{#if current || reloaded}
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
    {#if reload}
      <Dropdown section="Language">
        {#snippet trigger()}{shown.label}{/snippet}
        <ul>
          {#each commentLanguages as option (option.code)}
            <li>
              <button type="button" aria-current={option.code === language} onclick={() => pickLanguage(option.code)}>
                {option.label}
              </button>
            </li>
          {/each}
        </ul>
      </Dropdown>
    {/if}
    <AddCommentLink />
  </div>
  {#if form}<div class="form">{@render form()}</div>{/if}
  {#each current?.comments ?? [] as comment (comment.id)}
    <div class="comment">
      <CommentCard {comment} {item} {viewer} {dateOptions} featured={comment.review} wide />
    </div>
  {/each}
</div>
{:else}
  {@render form?.()}
{/if}

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

.form {
  margin-block-start: var(--gutter);

  /* Closed, the form is an empty hidden section. */
  &:not(:has(.new-comment:not([hidden]))) {
    display: none;
  }
}

.comment {
  margin-block-start: var(--gutter);

  /* A deleted comment leaves its wrapper empty. */
  &:not(:has(.comment-wrapper)) {
    display: none;
  }
}
</style>
