<!--
  A list pinned to the dashboard: its first 18 items, one row of six at first with the less and more pill, like the
  Watchlist panel, each poster with the list page's lines for its sort, and its rank when the list shows its numbers or is
  sorted by rank. The title links to the list, with its tags after
  it (Smart, Official List, and the owner's on someone else's). On the right: the list page's Watched and Collected
  percentages, its sort and eye, which the panel keeps, and All N items. Its hides drop items from the whole list, as
  the list page's do. Unpinning is in the customize popup and on the list. A list the viewer can no longer see steps
  aside, and the customize popup says so.
    <PinnedListPanel {pin} list={fetchPinnedList(...)} stats={fetchPinnedListStats(...)} {datePreferences}
      onsort={...} onhide={...} />
-->
<script lang="ts">
import { browser } from '$app/env';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import ListOwnerTag from '#lib/components/lists/ListOwnerTag.svelte';
import ListTag from '#lib/components/lists/ListTag.svelte';
import CardShimmerRow from '#lib/components/loading/CardShimmerRow.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import { visibleColumns } from '#lib/components/media/visibleColumns.ts';
import PageNavigator from '#lib/components/page-navigator/PageNavigator.svelte';
import { panelCards, panelHideDisabled, panelHideOptions } from '#lib/dashboard/panelHide.ts';
import { panelSorts } from '#lib/dashboard/panelSorts.ts';
import type { PinnedList } from '#lib/dashboard/fetchPinnedList.ts';
import { type ListPin, pinHref, pinKey } from '#lib/dashboard/listPins.ts';
import { rowCount } from '#lib/dashboard/rowCount.ts';
import { savedRows } from '#lib/dashboard/savedRows.ts';
import { PANEL_LIMIT } from '#lib/dashboard/toListPanel.ts';
import thumbtack from '#lib/icons/solid/thumbtack.svg?raw';
import ListItemPoster from '#lib/lists/ListItemPoster.svelte';
import ListStats from '#lib/lists/ListStats.svelte';
import type { ListSort } from '#lib/lists/resolveListSort.ts';
import type { ListStats as ListStatsData } from '#lib/lists/toListStats.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import type { Snippet } from 'svelte';
import DashboardPanel from './DashboardPanel.svelte';
import PanelHide from './PanelHide.svelte';
import PanelSort from './PanelSort.svelte';

type Loaded = Extract<PinnedList, { status: 'loaded' }>;

interface Props {
  pin: ListPin;
  list: Promise<PinnedList>;
  /** Every item, for the percentages. Null until the list has loaded. */
  stats: Promise<ListStatsData | null> | null;
  datePreferences: DatePreferences;
  onsort: (sort: ListSort) => void;
  onhide: (hide: string[]) => void;
}

const { pin, list, stats, datePreferences, onsort, onhide }: Props = $props();

const PER_ROW = 6;
let width = $state(0);
const perRow = $derived(visibleColumns(width, PER_ROW));
const storageKey = $derived(pinKey(pin));
let saved = $derived(browser ? savedRows.read(storageKey) : null);
const href = $derived(pinHref(pin));
const hide = $derived(pin.hide ?? []);
const hideOptions = $derived(panelHideOptions({ kind: pin.kind, isSelf: !pin.by && pin.kind !== 'official' }));

function changeRows(rows: number) {
  saved = rows;
  savedRows.write(storageKey, rows);
}

const allText = (total: number) => `All ${total.toLocaleString('en-US')} ${total === 1 ? 'item' : 'items'}`;
</script>

{#snippet panel(loading: boolean, content: Snippet, loaded?: Loaded, footer?: Snippet)}
  <DashboardPanel
    --color-card-bg="var(--color-panel-quick-icons)"
    --panel-bg="var(--color-watchlist-bg)"
    title={pin.name}
    icon={thumbtack}
    {loading}
    titleHref={href}
    {tags}
    alternate
    seeMore={loaded ? { href, text: allText(loaded.total) } : undefined}
    aside={loaded ? tools : undefined}
    {footer}
  >{@render content()}</DashboardPanel>

  {#snippet tools()}
    <span class="tools">
      {#if loaded && stats}<ListStats itemCount={loaded.total} {stats} progress progressOnly />{/if}
      {#if loaded}
        <PanelSort sorts={panelSorts(pin.kind)} sort={loaded.sort} onchange={onsort} />
        <PanelHide options={hideOptions} {hide} disabled={panelHideDisabled(loaded)} onchange={onhide} />
      {/if}
    </span>
  {/snippet}
{/snippet}

{#snippet tags()}
  {#if pin.kind === 'smart'}<ListTag tag="Smart" />{:else if pin.kind === 'official'}<ListTag tag="Official List" />{/if}
  {#if pin.by}<ListOwnerTag username={pin.by} avatar={pin.avatar} />{/if}
{/snippet}

{#await list}
  {@render panel(true, pending)}
{:then read}
  {#if read.status === 'loaded'}
    {@const shown = panelCards(read, hide)}
    {@const rows = rowCount({ rows: saved, items: Math.min(shown?.length ?? 0, PANEL_LIMIT), perRow })}
    {#snippet cards()}
      {#if shown === null}
        {@render pending()}
      {:else if read.cards.length === 0}
        <div class="notice"><EmptyState /></div>
      {:else if shown.length === 0}
        <div class="notice"><EmptyState action={{ onclick: () => onhide([]), text: 'Clear filters' }} /></div>
      {:else}
        <div class="cards" bind:clientWidth={width}>
          <PosterGrid columns={PER_ROW}>
            {#each shown.slice(0, rows.rows * perRow) as item (item.key)}
              <ListItemPoster {item} sortBy={read.sort.by} {datePreferences}
                rank={read.numbers || read.sort.by === 'rank' ? item.rank : undefined} />
            {/each}
          </PosterGrid>
        </div>
      {/if}
    {/snippet}
    {#snippet navigator()}
      <PageNavigator label={pin.name} rows={rows.rows} maxRows={rows.maxRows} onchange={changeRows} edge />
    {/snippet}
    {@render panel(false, cards, read, shown?.length ? navigator : undefined)}
  {/if}
{:catch error}
  {#snippet failed()}
    <div class="notice"><LoadFailed what={pin.name} {error} /></div>
  {/snippet}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}
  <div class="shimmers"><CardShimmerRow columns={PER_ROW} ratio="poster" /></div>
{/snippet}

<style>
.notice {
  padding-block-start: var(--gutter);
}

.tools {
  display: flex;
  align-items: center;
  gap: var(--space-stats);
  margin-inline-end: var(--space-stats);
}

.cards {
  animation: fade-in var(--transition-card) ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cards {
    animation: none;
  }
}
</style>
