<!--
  The picked sort on a sort dropdown's trigger: a site's sort as its logo and short name ("[IMDb] Votes", read as
  "IMDb Votes"), any other by its full name ("My Watched Date"). No sort reads `fallback`, Rank by default.
-->
<script lang="ts">
import { type MenuSort, sortSiteName } from './sortMenu.ts';
import SortSiteLogo from './SortSiteLogo.svelte';

const { sort, fallback = 'Rank' }: { sort: MenuSort | undefined; fallback?: string } = $props();
const siteName = $derived(sortSiteName(sort?.site));
</script>

{#if sort?.site && siteName}<span class="site-sort"><SortSiteLogo site={sort.site} alt={siteName} />{sort.short ??
      sort.label}</span>{:else}{sort?.label ?? fallback}{/if}

<style>
/* Inline, not flex, so the name keeps the line's baseline beside whatever follows it, like the dialog's hint pill. */
.site-sort > :global(.site-logo) {
  margin-inline-end: var(--space-menu-icon);
}
</style>
