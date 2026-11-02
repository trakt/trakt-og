<!--
  A smart list's page under the profile frame, laid out like a list's: the subnav with its item count and sort, the
  title row with its tags, Open on the chart that shows it and Share, then what it's made of where a list's
  description goes, then the posters between two paginations. It fills itself, so there's nothing to manage.
-->
<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import FilterChips from '$lib/components/filters/FilterChips.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import ShareButton from '$lib/components/share/ShareButton.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import Icon from '$lib/icons/Icon.svelte';
import file from '$lib/icons/regular/file.svg?raw';
import filtersIcon from '$lib/icons/regular/filters.svg?raw';
import ListTag from '$lib/components/lists/ListTag.svelte';
import { memberRelation } from '$lib/components/comments/memberRelation';
import { overlay } from '$lib/overlay/overlay';
import type { ProfileUser } from '$lib/users/ProfileUser';
import ListItemPoster from '$lib/lists/ListItemPoster.svelte';
import { listHref } from '$lib/lists/listHref';
import { listSortHow } from '$lib/lists/listItemSorts';
import SeoHead from '$lib/seo/SeoHead.svelte';
import { smartListSorts } from './smartListSorts.ts';
import { smartListSourceLabel } from './smartListSourceLabel.ts';
import type { loadSmartList } from './loadSmartList.ts';

type Props = { data: Awaited<ReturnType<typeof loadSmartList>> & { profile: ProfileUser } };

const { data }: Props = $props();
const list = $derived(data.smart);
const source = $derived(smartListSourceLabel(list.source, list.mediaType));
// Friend or Following, from the viewer's network, as on the list's row.
const relation = $derived(memberRelation(overlay.slices().network, data.profile.slug));
const pills = $derived(['Smart', ...(list.privacy === 'private' ? ['Private'] : list.privacy === 'friends' ? ['Following'] : [])]);
// Recommendations come in their own order only.
const sorts = $derived(list.source === 'recommendations' ? smartListSorts.slice(0, 1) : smartListSorts);
const reverseHow = (by: string, flipped: boolean) => {
  const how = listSortHow(by);
  return flipped ? (how === 'asc' ? 'desc' : 'asc') : how;
};
</script>

<!-- The sort, chart and item hrefs come built from this page's URL or the list. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead title={list.name} description="A smart list that fills itself from {source} on Trakt." />

<SectionToolbar statsChip={{ svg: file, value: data.total.toLocaleString('en-US'), label: 'Items' }}>
  {#snippet filters()}{/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}{sorts.find(({ by }) => by === data.sort.by)?.label ?? 'Rank'}{/snippet}
        <ul>
          {#each sorts as sort (sort.by)}
            <li><a href={listHref(page.url, { sort: { by: sort.by, how: listSortHow(sort.by) } })}
              aria-current={sort.by === data.sort.by ? 'page' : undefined}>{sort.label}</a></li>
          {/each}
        </ul>
      </Dropdown>
      <SortDirection joined descending={listSortHow(data.sort.by) === 'desc'} disabled={data.sort.by === 'random'}
        bind:flipped={
          () => data.sort.how !== listSortHow(data.sort.by),
          (next) => goto(listHref(page.url, { sort: { by: data.sort.by, how: reverseHow(data.sort.by, next) } }))
        } />
    </span>
  {/snippet}
</SectionToolbar>

<section class="title-row" aria-labelledby="smart-list-title">
  <Container>
    <div class="title-bar">
      <h2 id="smart-list-title">
        {list.name}
        {#if relation}<span class="tag"><ListTag {relation} /></span>{/if}
        {#each pills as pill (pill)}<span class="tag"><ListTag tag={pill} /></span>{/each}
      </h2>
      <div class="actions">
        {#if data.chartHref}
          <a class="open" href={data.chartHref}><Icon svg={filtersIcon} />Open on {smartListSourceLabel(list.source)}</a>
        {/if}
        <span class="share"><ShareButton url={page.url.href} title={list.name} large={false} /></span>
      </div>
    </div>
  </Container>
</section>

<section class="recipe" aria-label="What this list is made of">
  <Container>
    <div class="recipe-text">
      <p>Fills itself from <strong>{source}</strong>{data.recipe.length > 0 ? ', with:' : '.'}</p>
      {#if data.recipe.length > 0}<FilterChips chips={data.recipe} />{/if}
    </div>
  </Container>
</section>

<section class="items" aria-label="{list.name} items">
  <Container>
    {#if data.cards.length > 0}
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="List pages" />{/if}
      <div class="grid">
        <PosterGrid>
          {#each data.cards as item (item.key)}
            <ListItemPoster {item} rank={data.sort.by === 'rank' ? item.rank : undefined}
              datePreferences={data.datePreferences} />
          {/each}
        </PosterGrid>
      </div>
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="List pages" />{/if}
    {:else}
      <div class="empty"><EmptyState /></div>
    {/if}
  </Container>
</section>

<style>
.sort {
  display: flex;
  align-items: center;
}

.title-row {
  padding: var(--list-title-padding);
  background-color: var(--color-surface);
}

.title-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  column-gap: var(--gutter);
}

h2 {
  flex: 1 1 auto;
  min-inline-size: 0;
  margin: var(--list-title-heading-margin);
  font-family: var(--font-headings);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-headings);
}

/* The tags, as on a list row, after the name. */
.tag {
  display: inline-flex;
  margin-inline-start: var(--list-title-pill-gap);
  vertical-align: middle;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-list-title-actions);
}

.open {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
  min-block-size: var(--comment-tool-size);
  padding-inline: var(--space-sm-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  color: var(--color-control-text);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }
}

.recipe {
  background-color: var(--color-subnav-text-bg);
  color: var(--color-list-card-description);
  font-size: var(--font-size-base);
}

.recipe-text {
  display: grid;
  gap: var(--space-base-block);
  padding-block: var(--list-description-padding);

  & p {
    margin: 0;
  }
}

.items {
  display: flow-root;
  padding-block-end: var(--space-panel);

  & :global(nav) {
    margin-block: var(--line-height-computed) 0;
  }
}

.grid:first-child {
  padding-block-start: var(--list-grid-offset);
}

.empty {
  padding-block-start: var(--line-height-computed);
}
</style>
