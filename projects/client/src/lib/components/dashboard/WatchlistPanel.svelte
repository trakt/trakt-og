<script lang="ts">
  import { resolve } from '$app/paths';
  import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
  import type { Snippet } from 'svelte';
  import { browser } from '$app/env';
  import EmptyState from '#lib/components/empty/EmptyState.svelte';
  import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
  import PanelPrompt from '#lib/components/empty/PanelPrompt.svelte';
  import CardShimmerRow from '#lib/components/loading/CardShimmerRow.svelte';
  import StarterPicks from '#lib/components/first-night/StarterPicks.svelte';
  import { panelQuotes } from '#lib/firstNight/panelQuotes.ts';
  import PosterGrid from '#lib/components/media/PosterGrid.svelte';
  import { visibleColumns } from '#lib/components/media/visibleColumns.ts';
  import PageNavigator from '#lib/components/page-navigator/PageNavigator.svelte';
  import type { DashboardWatchlist } from '#lib/dashboard/fetchWatchlist.ts';
  import { rowCount } from '#lib/dashboard/rowCount.ts';
  import { savedRows } from '#lib/dashboard/savedRows.ts';
  import bookmark from '#lib/icons/regular/bookmark.svg?raw';
  import ListItemPoster from '#lib/lists/ListItemPoster.svelte';
  import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
  import { panelCards, panelHideDisabled, panelHideOptions } from '#lib/dashboard/panelHide.ts';
  import { panelSorts } from '#lib/dashboard/panelSorts.ts';
  import { PANEL_LIMIT } from '#lib/dashboard/toListPanel.ts';
  import type { ListSort } from '#lib/lists/resolveListSort.ts';
  import DashboardPanel from './DashboardPanel.svelte';
  import PanelHide from './PanelHide.svelte';
  import PanelSort from './PanelSort.svelte';

interface Props {
  watchlist: Promise<DashboardWatchlist>;
  /** The viewer's slug, for the watchlist link and the saved row count. */
  username: string;
  datePreferences: DatePreferences;
  /** Welcome mode: an empty panel offers starter picks instead of a link. */
  welcome?: boolean;
  /** A sort picked from the panel's menu, which the page saves and reads the watchlist in. */
  onsort?: (sort: ListSort) => void;
  /** The eye's Hide options, which the page saves. */
  hide?: readonly string[];
  /** Hide options picked from the panel's eye, which the page saves and, if needed, reads the whole watchlist for. */
  onhide?: (hide: string[]) => void;
}

  const { watchlist, username, datePreferences, welcome = false, onsort, hide = [], onhide }: Props = $props();
  const hideOptions = panelHideOptions({ kind: 'watchlist', isSelf: true });

  const PER_ROW = 6;
  // The grid's width, so a smaller tablet's four columns get whole rows.
  let width = $state(0);
  const perRow = $derived(visibleColumns(width, PER_ROW));
  const storageKey = $derived(`list:${username}`);
  // The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved count.
  let saved = $derived(browser ? savedRows.read(storageKey) : null);

  function changeRows(rows: number) {
    saved = rows;
    savedRows.write(storageKey, rows);
  }

  const allText = (total: number) => `All ${total.toLocaleString('en-US')} ${total === 1 ? 'item' : 'items'}`;
</script>

<!--
  The dashboard's Watchlist panel: the first 18 items of the viewer's
  watchlist in its own sort, one row of six at first, with the less and more pill for up to three. Its eye's hides read
  the whole watchlist and drop items from it, as the list page's do. Sorted by rank, the posters show it. Pass the unawaited
  `fetchWatchlist` promise from the loader, so the page streams in and a row of shimmering cards holds its place until it lands, and fails on
  its own if it doesn't.
-->

{#snippet panel(loading: boolean, content: Snippet, list?: DashboardWatchlist, footer?: Snippet)}
  <DashboardPanel
    --color-card-bg="var(--color-panel-quick-icons)"
    --panel-bg="var(--color-watchlist-bg)"
    title="Watchlist"
    titleHref="/users/{username}/watchlist"
    icon={bookmark}
    loading={loading}
    seeMore={list
      ? {
        href: `/users/${username}/watchlist`,
        text: allText(list.total)
      }
      : undefined}
    drilldown={{ source: 'watchlist' }}
    aside={list && onsort ? tools : undefined}
    footer={footer}
  >{@render content()}</DashboardPanel>

  {#snippet tools()}
    {#if list && onsort}
      <span class="tools">
        <PanelSort sorts={panelSorts('watchlist')} sort={list.sort} onchange={onsort} />
        {#if onhide}<PanelHide options={hideOptions} {hide} disabled={panelHideDisabled(list)} onchange={onhide} />{/if}
      </span>
    {/if}
  {/snippet}
{/snippet}

{#await watchlist}
  {@render panel(true, pending)}
{:then list}
  {@const shown = panelCards(list, hide)}
  {@const rows = rowCount({ rows: saved, items: Math.min(shown?.length ?? 0, PANEL_LIMIT), perRow })}
  {#snippet cards()}
    {#if shown === null}
      {@render pending()}
    {:else if list.cards.length === 0}
      <PanelPrompt
        roomy
        --panel-prompt-offset="var(--space-lg-block)"
        quote={panelQuotes.watchlist}
        welcome={welcome}
        text="Save what you want to watch next."
  action={{ href: resolve('/movies/[chart=chart]/[[period]]', { chart: 'anticipated' }), text: 'See what\'s coming' }}>
        {#snippet picks()}<StarterPicks chart="anticipated" type="both" count={4} action="watchlist" />{/snippet}
      </PanelPrompt>
    {:else if shown.length === 0}
      <div class="notice"><EmptyState action={{ onclick: () => onhide?.([]), text: 'Clear filters' }} /></div>
    {:else}
      <div class="cards" bind:clientWidth={width} {@attach trackDrilldowns({ source: 'watchlist' })}>
  <PosterGrid columns={PER_ROW}>
          {#each shown.slice(0, rows.rows * perRow) as item (item.key)}
            <ListItemPoster item={item} sortBy={list.sort.by} datePreferences={datePreferences}
              rank={list.sort.by === 'rank' ? item.rank : undefined} />
          {/each}
        </PosterGrid>
</div>
    {/if}
  {/snippet}
  {#snippet navigator()}
    <PageNavigator
  label="Watchlist"
  rows={rows.rows}
  maxRows={rows.maxRows}
  onchange={changeRows}
  edge
/>
  {/snippet}
  {@render panel(false, cards, list, shown?.length ? navigator : undefined)}
{:catch error}
  {#snippet failed()}
    <div class="notice"><LoadFailed what="Watchlist" error={error} /></div>
  {/snippet}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}
  <div class="shimmers"><CardShimmerRow columns={PER_ROW} ratio="poster" /></div>
{/snippet}

<style>
  /* OG's alert sat in the posters row, which kept 20px above it. */
  .notice {
    padding-block-start: var(--gutter);
  }

  .tools {
    display: flex;
    align-items: center;
    gap: var(--space-stats);
    margin-inline-end: var(--space-stats);
  }

  /* the panel fades in when its data lands, as OG's lazy panels did. */
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
