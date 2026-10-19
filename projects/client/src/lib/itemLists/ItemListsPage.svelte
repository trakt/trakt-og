<!--
  The lists featuring a movie, show, season, episode or person: the subpage frame,
  a subnav with the type dropdown on the left and the sort dropdown on the right, then 30 list rows a page with
  pagination above and below, or OG's empty notice. The 30-day sorts and the direction arrow have no API.
-->
<script lang="ts">
import { page } from '$app/state';
import ListEditor from '$lib/components/lists/ListEditor.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import listIcon from '$lib/icons/regular/list.svg?raw';
import ListRow from '$lib/components/media/ListRow.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import { countLabel } from '$lib/utils/countLabel';
import {
  type ItemListQuery,
  itemListsHref,
  type ItemListSortBy,
  itemListSorts,
  type ItemListType,
  itemListTypes,
} from './itemListQuery.ts';
import { createItemListActions } from './createItemListActions.svelte.ts';
import type { loadItemLists } from './loadItemLists.ts';

const { data }: { data: Awaited<ReturnType<typeof loadItemLists>> } = $props();
const typeLabel = $derived(itemListTypes[data.query.type].label);
// OG's `humanize`: "Personal lists featuring Fight Club (1999)".
const title = $derived(
  `${typeLabel.charAt(0)}${typeLabel.slice(1).toLowerCase()} featuring ${data.media.item.title}`,
);
const first = $derived(data.lists.at(0));
const description = $derived(first ? [first.name, first.description].filter(Boolean).join(' - ') : title);
// The empty state names what was filtered for, then offers every list.
const emptyLine = $derived(
  {
    all: `No lists feature ${data.media.item.title} yet.`,
    personal: `No personal lists feature ${data.media.item.title} yet.`,
    official: `No official lists feature ${data.media.item.title}.`,
    me: `None of your lists feature ${data.media.item.title} yet.`,
  }[data.query.type],
);
const href = (next: Partial<ItemListQuery>) => itemListsHref(data.media.href, { ...data.query, ...next });
// Me needs the viewer's lists, so it's only offered signed in.
const types = $derived(
  (Object.keys(itemListTypes) as ItemListType[]).filter((type) => type !== 'me' || data.user !== null),
);
const sorts = Object.keys(itemListSorts) as ItemListSortBy[];
// Pagination renders nothing for one page.
const pages = $derived(data.page && data.page.total > 1 ? data.page : null);
const viewer = $derived(data.user ? { slug: data.user.slug, isVip: data.user.isVip } : null);

// The row icons, with the owner's edit and delete, as on their own lists page.
const own = createItemListActions({ viewer: () => viewer, origin: () => page.url.origin });
const lists = $derived(own.visible(data.lists));
</script>

<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {#if data.media.poster}<meta property="og:image" content={data.media.poster} />{/if}
</svelte:head>

<!-- The item links are the canonical API slugs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet subnav()}
  <SectionToolbar inSummary>
    {#snippet filters()}
      <Dropdown section="List">
        {#snippet trigger()}{data.query.type === 'all' ? 'All' : typeLabel}&nbsp;{/snippet}
        <ul>
          {#each types as type (type)}
            <li>
              <a href={href({ type })} aria-current={data.query.type === type ? 'page' : undefined}>
                {itemListTypes[type].label}
              </a>
            </li>
          {/each}
        </ul>
      </Dropdown>
    {/snippet}
    {#snippet summary()}
      <span class="sort">
        <Dropdown joined section="Sort">
          {#snippet trigger()}{itemListSorts[data.query.sortBy].label}&nbsp;{/snippet}
          <ul>
            {#each sorts as sortBy (sortBy)}
              <li>
                <a href={href({ sortBy })} aria-current={data.query.sortBy === sortBy ? 'page' : undefined}>
                  {itemListSorts[sortBy].label}
                </a>
              </li>
            {/each}
          </ul>
        </Dropdown>
        <SortDirection joined disabled />
      </span>
    {/snippet}
  </SectionToolbar>
{/snippet}

<SubpageFrame
  {...data}
  label={typeLabel}
  sections={[{ label: countLabel(data.count, 'list'), href: '#lists' }]}
  {subnav}
>
  <!-- Each row brings OG's 20px above it, so rows straight under the subnav sit flush like OG's. -->
  <div id="lists" class={['lists', { flush: data.lists.length > 0 && !pages }]}>
    {#if data.lists.length === 0}
      <EmptyState icon={listIcon} action={data.query.type === 'all' ? undefined : { href: href({ type: 'all' }), text: 'See all lists' }}>
        {emptyLine}
      </EmptyState>
    {:else}
      {#if pages}<div class="pages-top"><Pagination meta={pages} label="Lists pages" /></div>{/if}
      {#each lists as list (list.id)}
        <ListRow {...list} mine={list.owner.slug === page.data.user?.slug} likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.owner.slug : undefined, viewer: page.data.user?.slug ?? null }} actions={own.actions(list)} />
      {/each}
      {#if pages}<div class="pages-bottom"><Pagination meta={pages} label="Lists pages" /></div>{/if}
    {/if}
  </div>
</SubpageFrame>

{#if own.editor}<ListEditor id={own.editor.id} posters={own.editor.posters} count={own.editor.count}
  onclose={own.closeEditor} />{/if}

<style>
.sort {
  display: flex;
  align-items: center;
}

.lists {
  display: grid;
  grid-template-columns: minmax(0, 1fr);

  &.flush {
    margin-block-start: calc(-1 * var(--gutter));
  }
}

/* OG's `.pagination-top` and `.pagination-bottom`: 20px between the pages and the rows. */
.pages-top {
  margin-block-end: var(--gutter);
}

.pages-bottom {
  margin-block: var(--gutter);
}
</style>
