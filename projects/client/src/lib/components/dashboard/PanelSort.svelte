<!--
  A list panel's sort, on the right of its heading: the list page's sort menu and direction arrow as one split control.
  Picking a sort starts it in its own direction; the arrow flips it. The panel saves the pick and reads the list again.
    <PanelSort sorts={dashboardListSorts} sort={list.sort} onchange={(sort) => resort(sort)} />
-->
<script lang="ts" generics="T extends ListItemSort">
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import SortDirection from '#lib/components/dropdown/SortDirection.svelte';
import SortLabel from '#lib/components/sort/SortLabel.svelte';
import SortMenu from '#lib/components/sort/SortMenu.svelte';
import { type ListItemSort, listSortHow, reverseHow } from '#lib/lists/listItemSorts.ts';
import type { ListSort } from '#lib/lists/resolveListSort.ts';

interface Props {
  sorts: readonly T[];
  sort: ListSort;
  onchange: (sort: ListSort) => void;
}

const { sorts, sort, onchange }: Props = $props();
</script>

<span class="sort">
  <Dropdown joined section="Sort">
    {#snippet trigger()}<SortLabel sort={sorts.find(({ by }) => by === sort.by)} />{/snippet}
    <SortMenu {sorts} current={sort.by} onpick={(picked) => onchange({ by: picked.by, how: listSortHow(picked.by) })} />
  </Dropdown>
  <SortDirection joined descending={listSortHow(sort.by) === 'desc'} disabled={sort.by === 'random'}
    bind:flipped={
      () => sort.how !== listSortHow(sort.by),
      (next) => onchange({ by: sort.by, how: reverseHow(sort.by, next) })
    } />
</span>

<style>
.sort {
  display: flex;
  align-items: center;
}
</style>
