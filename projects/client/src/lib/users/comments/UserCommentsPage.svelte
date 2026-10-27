<!--
  `/users/:id/comments(/:comment_type)(/:type)` and `/users/:id/comments/liked` under the profile frame
: the comment type and media type dropdowns, the counter and the sort, then 30 comments
  a page beside their posters.
-->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { page } from '$app/state';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '$lib/components/toolbar/SubnavCount.svelte';
import commentIcon from '$lib/icons/regular/comment.svg?raw';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { loadUserComments } from './loadUserComments.ts';
import { userCommentMediaTypes } from './userCommentMediaTypes.ts';
import { userCommentTypes } from './userCommentTypes.ts';
import UserCommentWithPoster from './UserCommentWithPoster.svelte';

type Props = {
  data: Awaited<ReturnType<typeof loadUserComments>> & {
    profile: ProfileUser;
    datePreferences: DatePreferences;
    user: HeaderUser | null;
  };
};
const { data }: Props = $props();

const metaType = $derived(data.type === 'all' ? '' : `${data.type.replace(/s$/, '')} `);
const title = $derived(`${data.profile.displayName}'s ${metaType}${data.liked ? 'liked ' : ''}comments`);
const viewer = $derived(data.user ? { slug: data.user.slug } : null);

// Trailing defaults are left off the path: `/comments`, `/comments/reviews`, `/comments/all/movies`.
function segments({ liked = false, commentType = 'all', type = 'all' }) {
  if (liked) return ['liked'];
  if (type !== 'all') return [commentType, type];
  return commentType === 'all' ? [] : [commentType];
}

// OG's `link_params`: the query string without the page.
function href(filters: { liked?: boolean; commentType?: string; type?: string }) {
  const query = new SvelteURLSearchParams(page.url.searchParams);
  query.delete('page');
  const path = [`/users/${data.profile.slug}/comments`, ...segments(filters)].join('/');
  return `${path}${query.size ? `?${query}` : ''}`;
}
const current = (picked: boolean) => (picked ? 'page' : undefined);
</script>

<!-- Filter URLs keep the canonical profile slug and the query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {title} description="Check out {data.profile.firstName}'s {data.liked ? 'liked' : 'recent'} comments." />

<SectionToolbar>
  {#snippet filters()}
    <Dropdown section={data.liked ? 'Reactions' : 'Comments'}>
      {#snippet trigger()}{userCommentTypes[data.commentType]}{/snippet}
      <ul>
        <li class="header" role="presentation">Comments</li>
        {#each Object.entries(userCommentTypes) as [commentType, label] (commentType)}
          <li>
            <a
              href={href({ commentType, type: data.type })}
              aria-current={current(!data.liked && data.commentType === commentType)}
            >{label}</a>
          </li>
        {/each}
      </ul>
      <hr />
      <ul>
        <li class="header" role="presentation">Reactions</li>
        <li><a href={href({ liked: true })} aria-current={current(data.liked)}>{userCommentTypes.all}</a></li>
      </ul>
    </Dropdown>
    <Dropdown section="Media">
      {#snippet trigger()}{userCommentMediaTypes[data.type]}{/snippet}
      <ul>
        {#each Object.entries(userCommentMediaTypes) as [type, label] (type)}
          {#if !data.liked || type === 'all'}
            <li>
              <a
                href={href({ liked: data.liked, commentType: data.commentType, type })}
                aria-current={current(data.type === type)}
              >{label}</a>
            </li>
          {/if}
        {/each}
      </ul>
    </Dropdown>
  {/snippet}
  {#snippet stats()}
    <SubnavCount svg={commentIcon} count={data.itemCount} noun="comment" tooltip="Comments" />
  {/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}Added Date{/snippet}
        <ul><li><a href={page.url.pathname + page.url.search} aria-current="page">Added Date</a></li></ul>
      </Dropdown>
      <SortDirection joined descending disabled />
    </span>
  {/snippet}
</SectionToolbar>

<section class="comments" aria-label={title}>
  <Container>
    {#if data.entries.length > 0}
      {#if data.page.type === 'paginated'}
        <div class="pagination"><Pagination meta={data.page} label="Comments pages" /></div>
      {/if}
      {#each data.entries as { row, parent } (row.comment.id)}
        <div class="comment">
          <UserCommentWithPoster {row} {parent} {viewer} datePreferences={data.datePreferences} />
        </div>
      {/each}
      {#if data.page.type === 'paginated'}
        <div class="pagination"><Pagination meta={data.page} label="Comments pages" /></div>
      {/if}
    {:else if data.liked}
      <EmptyState />
    {:else if data.commentType !== 'all'}
      <EmptyState action={{ href: href({ type: data.type }), text: 'Clear filters' }} />
    {:else}
      <EmptyState />
    {/if}
  </Container>
</section>

<style>
.sort {
  display: flex;
  align-items: center;
}

.comments {
  padding-block: var(--user-comments-padding);
}
.comment {
  margin-block-end: var(--gutter);
}
/* `body.comments .pagination-top` and `.pagination-bottom`: 20px under the top one and the page. */
.pagination {
  margin-block-end: var(--gutter);
}
</style>
