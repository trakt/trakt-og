<!--
  A smart list's page under the profile frame, laid out like a list's but with no subnav: the title row with its tags
  and a list's icons (the owner's edit and delete, then share), Open on the chart that shows it where a list has
  Progress and Manage, and the sort after it; then what it's made of where a list's description goes, then the
  posters between two paginations. It fills itself, so there's nothing to manage.
-->
<script lang="ts">
import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { viewerFetch } from '$lib/auth/viewerFetch';
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import SmartListDialog from '$lib/components/lists/SmartListDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import pencil from '$lib/icons/regular/pen.svg?raw';
import deleteIcon from '$lib/icons/regular/trash-xmark.svg?raw';
import { deleteSmartList } from './deleteSmartList.ts';
import { saveSmartList } from './saveSmartList.ts';
import type { SmartListPrivacy } from './SmartList.ts';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import FilterChips from '$lib/components/filters/FilterChips.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import ShareButton from '$lib/components/share/ShareButton.svelte';
import Icon from '$lib/icons/Icon.svelte';
import filtersIcon from '$lib/icons/regular/filters.svg?raw';
import ListTag from '$lib/components/lists/ListTag.svelte';
import ListTitleRow from '$lib/components/lists/ListTitleRow.svelte';
import { memberRelation } from '$lib/components/comments/memberRelation';
import { overlay } from '$lib/overlay/overlay';
import type { ProfileUser } from '$lib/users/ProfileUser';
import ListItemPoster from '$lib/lists/ListItemPoster.svelte';
import { listHref } from '$lib/lists/listHref';
import { listSortHow, reverseHow } from '$lib/lists/listItemSorts';
import { listSortGroups } from '$lib/lists/listSortGroups';
import SeoHead from '$lib/seo/SeoHead.svelte';
import { smartListSorts } from './smartListSorts.ts';
import { smartListSourceLabel } from './smartListSourceLabel.ts';
import type { loadSmartList } from './loadSmartList.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadSmartList>> & { profile: ProfileUser; user: HeaderUser | null };
};

const { data }: Props = $props();

// The owner edits the name and privacy, or deletes it, like their list. The API's cache can answer the reload with
// the old name, so an edit stands in until the page leaves.
const owner = $derived(data.user !== null && data.user.slug === data.profile.slug);
let editing = $state(false);
let busy = $state(false);
let edited = $state<{ slug: string; name: string; privacy: SmartListPrivacy }>();
const list = $derived(
  edited?.slug === data.smart.slug ? { ...data.smart, name: edited.name, privacy: edited.privacy } : data.smart,
);
const source = $derived(smartListSourceLabel(list.source, list.mediaType));
// Friend or Following, from the viewer's network, as on the list's row.
const relation = $derived(memberRelation(overlay.slices().network, data.profile.slug));
const pills = $derived(['Smart', ...(list.privacy === 'private' ? ['Private'] : list.privacy === 'friends' ? ['Following'] : [])]);
// Recommendations come in their own order only.
const sorts = $derived(list.source === 'recommendations' ? smartListSorts.slice(0, 1) : smartListSorts);
const request = (path: string, method: string, body?: unknown) =>
  rawApiFetch({
    fetch: viewerFetch(),
    path,
    init: {
      method,
      ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    },
  });

async function save(change: { name: string; privacy: SmartListPrivacy }) {
  if (busy) return;
  busy = true;
  const result = await saveSmartList({ request, slug: data.smart.slug, write: change });
  busy = false;
  if (!result.ok) {
    toast.error("Doh! We couldn't save this smart list. Please try again.");
    return;
  }
  editing = false;
  edited = { slug: data.smart.slug, ...change };
  toast.success(`You saved ${change.name}.`);
  await invalidateAll();
}

async function remove() {
  if (busy) return;
  busy = true;
  const ok = await deleteSmartList({ request, slug: data.smart.slug });
  busy = false;
  if (!ok) {
    toast.error("Doh! We couldn't delete this smart list. Please try again.");
    return;
  }
  toast.success('You deleted the smart list.');
  await goto(resolve('/users/[id]/smart-lists', { id: data.profile.slug }));
}
</script>

{#if editing}
  <SmartListDialog open editing initial={{ name: list.name, privacy: list.privacy }} {source} chips={[]} {busy}
    onsave={save} onclose={() => (editing = false)} />
{/if}

<!-- The sort, chart and item hrefs come built from this page's URL or the list. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead title={list.name} description="A smart list that fills itself from {source} on Trakt." />

{#snippet titleTags()}
  {#if relation}<span class="tag"><ListTag {relation} /></span>{/if}
  {#each pills as pill (pill)}<span class="tag"><ListTag tag={pill} /></span>{/each}
{/snippet}
<ListTitleRow id="smart-list-title" name={list.name} href={page.url.pathname} tags={titleTags} actions={titleActions} />
{#snippet titleActions()}
        {#if owner}
          <Tooltip text="Edit">
            {#snippet trigger(tooltip)}
              <button type="button" class="action edit" aria-label="Edit" {...tooltip} onclick={() => (editing = true)}
                ><Icon svg={pencil} /></button>
            {/snippet}
          </Tooltip>
          <span class="delete" style:--confirm-icon-size="var(--font-size-list-row-action)">
            <ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!"
              warning="This can't be undone!" disabled={busy} onconfirm={remove}>Delete this smart list?</ManageConfirm>
          </span>
        {/if}
        <span class="share"><ShareButton url={page.url.href} title={list.name} large={false} /></span>
        {#if data.chartHref}
          {@const label = `Open on ${smartListSourceLabel(list.source)}`}
          <a class="action open" href={data.chartHref} aria-label={label}><Icon svg={filtersIcon} /><span
              class="action-text"
            >{label}</span></a>
        {/if}
        <span class="sort">
          <Dropdown joined section="Sort">
            {#snippet trigger()}{sorts.find(({ by }) => by === data.sort.by)?.label ?? 'Rank'}{/snippet}
            {#each listSortGroups(sorts) as { group, header, sorts: items }, i (group)}
              {#if i > 0}<hr />{/if}
              <ul>
                {#if header}<li class="header" role="presentation">{header}</li>{/if}
                {#each items as sort (sort.by)}
                  <li><a href={listHref(page.url, { sort: { by: sort.by, how: listSortHow(sort.by) } })}
                    aria-current={sort.by === data.sort.by ? 'page' : undefined}>{sort.label}</a></li>
                {/each}
              </ul>
            {/each}
          </Dropdown>
          <SortDirection joined descending={listSortHow(data.sort.by) === 'desc'} disabled={data.sort.by === 'random'}
            bind:flipped={
              () => data.sort.how !== listSortHow(data.sort.by),
              (next) => goto(listHref(page.url, { sort: { by: data.sort.by, how: reverseHow(data.sort.by, next) } }))
            } />
        </span>
{/snippet}

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
/* Its funnel in the smart list purple, as on the list's row. */
.open :global(.icon) {
  color: var(--color-list-open-chart);
}

/* The title row's actions sit 6px apart; the sort gets 10px from the button before it. */
.sort {
  display: flex;
  align-items: center;
  margin-inline-start: calc(var(--space-sm-inline) - var(--space-list-title-actions));
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
