<!--
  A list's comments: the slim header with the list name, the quartered poster sidebar, All Comments and the sort dropdown, then 100
  comments a page. "Add comment" opens the new comment form on a list that takes comments.
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { commentSettings } from '$lib/components/comments/commentSettings';
import { newComment } from '$lib/components/comments/newComment.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import { withoutBlocked } from '$lib/components/comments/withoutBlocked';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import SectionNav from '$lib/components/summary/SectionNav.svelte';
import SubpageTitle from '$lib/components/summary/SubpageTitle.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { PageMeta } from '$lib/api/PageMeta';
import type { CommentResponse } from '@trakt/api';
import type { ListCommentsTarget } from './ListCommentsTarget';
import { listCommentMenu, listCommentSorts } from './listCommentSorts';

const { data }: {
  data: {
    list: ListCommentsTarget;
    sort: keyof typeof listCommentSorts;
    comments: readonly CommentResponse[];
    itemCount: number;
    page: PageMeta;
    datePreferences: DatePreferences;
    user: HeaderUser | null;
  };
} = $props();
const item = $derived(data.list.id ? { type: 'list' as const, id: data.list.id, title: data.list.title } : undefined);
const viewer = $derived(data.user ? { slug: data.user.slug } : null);
const canComment = $derived(Boolean(item && data.list.allowComments));
// Posted here since the page loaded, newest first. OG left out the members the viewer blocked
//; the count stays the API's total.
const comments = $derived([
  ...(canComment ? newComment.posted : []),
  ...withoutBlocked(data.comments, commentSettings(page.data.settings).blocked),
]);
const addedDate = $derived(data.sort === 'newest' || data.sort === 'oldest');
const sortHref = (sort: string) => {
  const query = new SvelteURLSearchParams(page.url.searchParams);
  query.delete('page');
  query.delete('sort_how');
  query.set('sort_by', sort);
  return `${data.list.href}/comments?${query}`;
};
</script>

<!-- List URLs are the canonical API slugs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<svelte:head>
  <title>All comments for {data.list.fullTitle} - Trakt</title>
  <meta name="description" content={data.list.description ?? `Read comments about ${data.list.fullTitle}.`} />
</svelte:head>

<FanartHeader slim>
  <SubpageTitle label="Comments" title={data.list.title} href={data.list.href} />
</FanartHeader>
<SummaryFrame label={data.list.title} fullWidth>
  {#snippet subnav()}
    <SectionToolbar inSummary>
      {#snippet filters()}
        <Dropdown section="Comments">
          {#snippet trigger()}All{/snippet}
          <ul><li><a href={page.url.pathname + page.url.search} aria-current="page">All</a></li></ul>
        </Dropdown>
        {#if canComment}<AddCommentLink />{/if}
      {/snippet}
      {#snippet summary()}
        <span class="sort">
          <Dropdown joined section="Sort">
            {#snippet trigger()}{listCommentSorts[data.sort]}{/snippet}
            <ul>
              {#each listCommentMenu as sort (sort)}
                <li><a href={sortHref(sort)} aria-current={sort === data.sort || (sort === 'newest' && addedDate) ? 'page' : undefined}
                  >{listCommentSorts[sort]}</a></li>
              {/each}
            </ul>
          </Dropdown>
          <!-- Every comment sort runs most or newest first. -->
          <SortDirection joined descending disabled={!addedDate} bind:flipped={
            () => data.sort === 'oldest',
            (next) => goto(sortHref(next ? 'oldest' : 'newest'))
          } />
        </span>
      {/snippet}
    </SectionToolbar>
  {/snippet}
  {#snippet sidebar()}
    <a href={data.list.href}><SummaryPoster alt={data.list.title} posters={data.list.posters} /></a>
    <SectionNav sections={[{ label: `${data.itemCount.toLocaleString('en-US')} ${data.itemCount === 1 ? 'comment' : 'comments'}`, href: '#comments' }]} />
  {/snippet}
  {#snippet details()}
    {#if canComment && item}<NewCommentForm {item} />{/if}
    <div id="comments">
      {#if data.page.type === 'paginated'}<div class="pagination"><Pagination meta={data.page} label="Comments pages" /></div>{/if}
      {#each comments as comment (comment.id)}
        <div class="comment"><CommentCard {comment} {item} {viewer} dateOptions={data.datePreferences} featured={comment.review} wide /></div>
      {:else}
        <NoData>No comments yet. What do you think?</NoData>
      {/each}
      {#if data.page.type === 'paginated'}<div class="pagination"><Pagination meta={data.page} label="Comments pages" /></div>{/if}
    </div>
  {/snippet}
</SummaryFrame>

<style>
.sort {
  display: flex;
  align-items: center;
}

.comment {
  margin-block-end: var(--gutter);

  /* A deleted comment leaves its wrapper empty. */
  &:not(:has(.comment-wrapper)) {
    display: none;
  }
}
.pagination {
  margin-block-end: var(--gutter);
}
</style>
