<!--
  The list dialogs' default sort: a labelled sort dropdown, grouped like the list page's, joined to its direction
  button. The trigger says the order in words in a pill after the sort ("Rank [first to last]"), so the direction icon
  reads at a glance.
    <ListSortField bind:by bind:how />
-->
<script lang="ts">
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import { listItemSorts, listSortHow, reverseHow } from '$lib/lists/listItemSorts';
import { sortDirectionHint } from '$lib/lists/sortDirectionHint';

interface Props {
  by: string;
  how: string;
  disabled?: boolean;
}

let { by = $bindable(), how = $bindable(), disabled = false }: Props = $props();
const id = $props.id();
const groups = $derived(
  (['main', 'site', 'votes', 'mine'] as const)
    .map((group) => ({ group, items: listItemSorts.filter((sort) => sort.group === group) }))
    .filter(({ items }) => items.length > 0),
);
const hint = $derived(sortDirectionHint(by, how));
const headers: Readonly<Record<string, string>> = { site: 'Site Ratings', votes: 'Votes', mine: 'Your data' };
</script>

<div role="group" aria-labelledby="{id}-label">
  <FieldLabel text="Default sorting" id="{id}-label" />
  <span class="sort">
    <Dropdown joined block>
      {#snippet trigger()}{listItemSorts.find((sort) => sort.by === by)?.label ?? 'Rank'}{#if hint}<span class="hint">{hint}</span>{/if}{/snippet}
      <div class="limit-10">
      {#each groups as { group, items }, i (group)}
        {#if i > 0}<hr />{/if}
        <ul>
          {#if headers[group]}<li class="header" role="presentation">{headers[group]}</li>{/if}
          {#each items as sort (sort.by)}
            <li><button type="button" aria-current={sort.by === by ? 'true' : undefined} onclick={() => {
              by = sort.by;
              how = listSortHow(sort.by);
            }}>{sort.label}</button></li>
          {/each}
        </ul>
      {/each}
      </div>
    </Dropdown>
    <!-- Flipped is away from the sort's own direction; Random has none. -->
    <SortDirection joined descending={listSortHow(by) === 'desc'} disabled={disabled || by === 'random'}
      bind:flipped={() => how !== listSortHow(by), (flipped) => (how = reverseHow(by, flipped))} />
  </span>
</div>

<style>
/* The order in words, as a quiet tag pill after the sort's name. */
.hint {
  display: inline-block;
  margin-inline-start: var(--list-sort-hint-gap);
  padding: var(--list-sort-hint-padding);
  border-radius: var(--radius-search-pill);
  background-color: var(--color-tag-pill-bg);
  box-shadow: inset 0 0 0 1px var(--color-tag-pill-line);
  color: var(--color-dropdown-note);
  font-size: var(--font-size-search-pill);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  vertical-align: middle;
}

/* Ten rows tall and scrolling, like the list page's sort, so it fits under or over the field. */
.limit-10 {
  max-block-size: var(--dropdown-limit-10-height);
  overflow-y: auto;
}

.sort {
  display: flex;
  align-items: center;

  & > :global(.dropdown) {
    flex: 1;
    min-inline-size: 0;
  }
}
</style>
