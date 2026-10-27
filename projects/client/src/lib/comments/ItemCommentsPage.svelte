<!--
  The comments of a movie, show, season or episode: the subpage frame, a subnav
  with the type and language dropdowns on the left and the sort dropdown and direction on the right, then 100
  comments a page in the picked language (English by default) with
  pagination above and below. Reviews are featured. The Reviews and Shouts types, the 30-day and Watched sorts and the
  locked-comments notice have no API. "Add comment" opens the new comment form, and what it posts goes on top.
-->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { gifArtContext } from '$lib/components/comments/gif/gifArtContext';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { commentSettings } from '$lib/components/comments/commentSettings';
import { newComment } from '$lib/components/comments/newComment.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import { withoutBlocked } from '$lib/components/comments/withoutBlocked';
import { commentLanguage } from './commentLanguage.ts';
import { type CommentLanguage, commentLanguages } from './commentLanguages.ts';
import { itemCommentsHref, type ItemCommentSortBy, itemCommentSorts } from './itemCommentSort.ts';
import type { loadItemComments } from './loadItemComments.ts';

const { data }: { data: Awaited<ReturnType<typeof loadItemComments>> } = $props();
const title = $derived(`All comments for ${data.media.item.title}`);
// The GIF picker's header, in every comment box on the page.
gifArtContext.set(() => data.media.fanart);
const viewer = $derived(data.user ? { slug: data.user.slug } : null);
const count = $derived(`${data.count.toLocaleString('en-US')} ${data.count === 1 ? 'comment' : 'comments'}`);
// Posted here since the page loaded, newest first. Blocked members' comments are dropped.
const comments = $derived([
  ...newComment.posted,
  ...withoutBlocked(data.comments, commentSettings(page.data.settings).blocked),
]);
const href = (by: ItemCommentSortBy, how = data.sort.how, language = data.language.search) =>
  itemCommentsHref(data.media.href, by, how, language);
const languageHref = (code: CommentLanguage) => href(data.sort.by, data.sort.how, commentLanguage(code).search);
</script>

<!-- The item links are the canonical API slugs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {title} description={title} image={data.media.poster} />

{#snippet sortLabel(by: ItemCommentSortBy)}{itemCommentSorts[by].label}{/snippet}

{#snippet subnav()}
  <SectionToolbar inSummary>
    {#snippet filters()}
      <Dropdown section="Comments">
        {#snippet trigger()}All&nbsp;{/snippet}
        <ul><li><a href={href(data.sort.by)} aria-current="page">All</a></li></ul>
      </Dropdown>
      <Dropdown section="Language">
        {#snippet trigger()}{data.language.label}&nbsp;{/snippet}
        <ul>
          {#each commentLanguages as language (language.code)}
            <li>
              <a href={languageHref(language.code)} aria-current={data.language.code === language.code ? 'page' : undefined}>
                {language.label}
              </a>
            </li>
          {/each}
        </ul>
      </Dropdown>
      <AddCommentLink />
    {/snippet}
    {#snippet summary()}
      <span class="sort">
        <Dropdown joined section="Sort">
          {#snippet trigger()}{@render sortLabel(data.sort.by)}&nbsp;{/snippet}
          <ul>
            {#each Object.keys(itemCommentSorts) as ItemCommentSortBy[] as by (by)}
              <li><a href={href(by, 'asc')} aria-current={data.sort.by === by ? 'page' : undefined}>{@render sortLabel(by)}</a></li>
            {/each}
          </ul>
        </Dropdown>
        <!-- Every comment sort runs most, highest or newest first. -->
        <SortDirection joined descending disabled={!data.sort.reversible} bind:flipped={
          () => data.sort.how === 'desc',
          (next) => goto(href(data.sort.by, next ? 'desc' : 'asc'))
        } />
      </span>
    {/snippet}
  </SectionToolbar>
{/snippet}

<SubpageFrame
  {...data}
  label="Comments"
  sections={[{ label: count, href: '#comments' }]}
  {subnav}
>
  <NewCommentForm item={data.media.item} />
  <div id="comments" class="comments">
    {#if comments.length === 0 && (data.language.code === 'en' || data.language.code === 'all')}
      <EmptyState />
    {:else if comments.length === 0}
      <EmptyState action={{ href: languageHref('en'), text: 'Show English comments' }} />
    {:else}
      {#if data.page}<Pagination meta={data.page} label="Comments pages" />{/if}
      {#each comments as comment (comment.id)}
        <CommentCard
          {comment}
          item={data.media.item}
          {viewer}
          dateOptions={data.datePreferences}
          featured={comment.review}
          wide
        />
      {/each}
      {#if data.page}<Pagination meta={data.page} label="Comments pages" />{/if}
    {/if}
  </div>
</SubpageFrame>

<style>
.sort {
  display: flex;
  align-items: center;
}

.comments {
  display: grid;
  gap: var(--gutter);
}
</style>
