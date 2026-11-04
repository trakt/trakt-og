<!--
  A list page's sort menu, inside its Dropdown: the everyday sorts as rows, then a row per site (Trakt, IMDb, TMDB,
  Rotten Tomatoes, Metacritic) and one for My Data, each opening its sorts beside it under their short names. The
  row holding the picked sort turns red. List pages link each sort; the list dialogs' sort field, without `href`, picks
  it with a button.
-->
<script lang="ts">
import DropdownFlyout from '$lib/components/dropdown/DropdownFlyout.svelte';
import type { ListItemSort } from './listItemSorts.ts';
import { flyoutHolds, listSortMenu } from './listSortMenu.ts';
import ListSortSiteLogo from './ListSortSiteLogo.svelte';

interface Props {
  sorts: readonly ListItemSort[];
  /** The picked sort. */
  current: string;
  /** Left out, the rows are buttons that only call `onpick`. */
  href?: (sort: ListItemSort) => string;
  onpick?: (sort: ListItemSort, event: MouseEvent) => void;
}

const { sorts, current, href, onpick }: Props = $props();
const sections = $derived(listSortMenu(sorts));
</script>

{#snippet row(sort: ListItemSort, label: string)}
  {#if href}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves the list's own URL -->
    <li><a href={href(sort)} onclick={(event) => onpick?.(sort, event)}
        aria-current={sort.by === current ? 'page' : undefined}>{label}</a></li>
  {:else}
    <li><button type="button" onclick={(event) => onpick?.(sort, event)}
        aria-current={sort.by === current ? 'true' : undefined}>{label}</button></li>
  {/if}
{/snippet}

{#each sections as section, i (i)}
  {#if i > 0}<hr />{/if}
  <ul>
    {#each section as entry (entry.kind === 'sort' ? entry.sort.by : entry.flyout.key)}
      {#if entry.kind === 'sort'}
        {@render row(entry.sort, entry.sort.label)}
      {:else}
        {@const site = entry.flyout.sorts[0]?.site}
        <DropdownFlyout label={entry.flyout.label} current={flyoutHolds(entry.flyout, current)}>
          {#snippet icon()}{#if site}<ListSortSiteLogo {site} />{/if}{/snippet}
          <ul>
            {#each entry.flyout.sorts as sort (sort.by)}{@render row(sort, sort.short ?? sort.label)}{/each}
          </ul>
        </DropdownFlyout>
      {/if}
    {/each}
  </ul>
{/each}
