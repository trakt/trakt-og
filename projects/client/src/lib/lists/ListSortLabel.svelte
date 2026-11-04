<!--
  The picked sort on a sort dropdown's trigger: a site's sort as its logo and short name ("[IMDb] Votes", read as
  "IMDb Votes"), any other by its full name ("My Watched Date"). No sort is Rank.
-->
<script lang="ts">
import type { ListItemSort } from './listItemSorts.ts';
import { LIST_SORT_SITES } from './listSortMenu.ts';
import ListSortSiteLogo from './ListSortSiteLogo.svelte';

const { sort }: { sort: ListItemSort | undefined } = $props();
const siteName = $derived(LIST_SORT_SITES.find(([site]) => site === sort?.site)?.[1]);
</script>

{#if sort?.site && siteName}<span class="site-sort"><ListSortSiteLogo site={sort.site} alt={siteName} />{sort.short ??
      sort.label}</span>{:else}{sort?.label ?? 'Rank'}{/if}

<style>
/* Inline, not flex, so the name keeps the line's baseline beside whatever follows it, like the dialog's hint pill. */
.site-sort > :global(.site-logo) {
  margin-inline-end: var(--space-menu-icon);
}
</style>
