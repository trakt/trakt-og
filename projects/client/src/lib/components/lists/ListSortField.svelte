<!--
  The list dialogs' default sort: a labelled sort dropdown, grouped like the list page's (VIP sorts only for VIP),
  joined to its direction button. The trigger says the order in words in a pill after the sort ("Rank [first to
  last]"), so the direction icon reads at a glance.
    <ListSortField bind:by bind:how {vip} />
-->
<script lang="ts">
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import { listItemSorts } from '$lib/lists/listItemSorts';
import { sortDirectionHint } from '$lib/lists/sortDirectionHint';

interface Props {
  by: string;
  how: string;
  vip: boolean;
  disabled?: boolean;
}

let { by = $bindable(), how = $bindable(), vip, disabled = false }: Props = $props();
const id = $props.id();
const sorts = $derived(listItemSorts.filter((sort) => vip || !sort.vip));
const groups = $derived(
  (['main', 'site', 'votes', 'mine'] as const)
    .map((group) => ({ group, items: sorts.filter((sort) => sort.group === group) }))
    .filter(({ items }) => items.length > 0),
);
const hint = $derived(sortDirectionHint(by, how));
const headers: Readonly<Record<string, string>> = { site: 'Site Ratings', votes: 'Votes', mine: 'Your data' };
</script>

<div role="group" aria-labelledby="{id}-label">
  <FieldLabel text="Default sorting" id="{id}-label" />
  <span class="sort">
    <Dropdown joined block>
      {#snippet trigger()}{sorts.find((sort) => sort.by === by)?.label ?? 'Rank'}{#if hint}<span class="hint">{hint}</span>{/if}{/snippet}
      <div class="limit-10">
      {#each groups as { group, items }, i (group)}
        {#if i > 0}<hr />{/if}
        <ul>
          {#if headers[group]}<li class="header" role="presentation">{headers[group]}</li>{/if}
          {#each items as sort (sort.by)}
            <li><button type="button" aria-current={sort.by === by ? 'true' : undefined} onclick={() => (by = sort.by)}
              >{sort.label}</button></li>
          {/each}
        </ul>
      {/each}
      </div>
    </Dropdown>
    <SortDirection joined {disabled} bind:flipped={() => how === 'desc', (flipped) => (how = flipped ? 'desc' : 'asc')} />
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
