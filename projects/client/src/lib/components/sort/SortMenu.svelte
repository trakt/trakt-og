<!--
  A sort menu, inside its Dropdown: the everyday sorts as rows, then a row per site (Trakt, IMDb, TMDB, Rotten
  Tomatoes, Metacritic) and one for My Data, each opening its sorts beside it under their short names. The row holding
  the picked sort turns red. Pages link each sort with `href`; without it the rows are buttons that only call `onpick`.
    <Dropdown joined section="Sort">
      {#snippet trigger()}<SortLabel sort={picked} />{/snippet}
      <SortMenu {sorts} current={picked.by} href={(sort) => sortHref(sort.by)} />
    </Dropdown>
-->
<script lang="ts" generics="T extends MenuSort">
import DropdownFlyout from '$lib/components/dropdown/DropdownFlyout.svelte';
import { flyoutHolds, type MenuSort, sortMenu } from './sortMenu.ts';
import SortSiteLogo from './SortSiteLogo.svelte';

interface Props {
  sorts: readonly T[];
  /** The picked sort. */
  current: string;
  href?: (sort: T) => string;
  onpick?: (sort: T, event: MouseEvent) => void;
}

const { sorts, current, href, onpick }: Props = $props();
const sections = $derived(sortMenu(sorts));
</script>

{#snippet row(sort: T, label: string)}
  {#if href}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves its own page's URL -->
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
          {#snippet icon()}{#if site}<SortSiteLogo {site} />{/if}{/snippet}
          <ul>
            {#each entry.flyout.sorts as sort (sort.by)}{@render row(sort, sort.short ?? sort.label)}{/each}
          </ul>
        </DropdownFlyout>
      {/if}
    {/each}
  </ul>
{/each}
