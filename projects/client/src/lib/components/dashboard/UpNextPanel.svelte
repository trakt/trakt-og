<!--
  The dashboard's Up Next panel: the next episode of up to 18
  shows the viewer is watching in their saved sort, one row of six at first, with the less and more pill for up to
  three. Pass the
  unawaited `fetchUpNext` promise from the loader, so the page streams in and a row of shimmering cards holds its place until it lands, and
  fails on its own if it doesn't.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import LoadFailed from '$lib/components/empty/LoadFailed.svelte';
import PanelPrompt from '$lib/components/empty/PanelPrompt.svelte';
import CardShimmerRow from '$lib/components/loading/CardShimmerRow.svelte';
import StarterPicks from '$lib/components/first-night/StarterPicks.svelte';
import { panelQuotes } from '$lib/firstNight/panelQuotes';
import DashboardOnDeckCard from '$lib/components/dashboard/DashboardOnDeckCard.svelte';
import type { OnDeckItem } from '$lib/components/media/OnDeckItem';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { visibleColumns } from '$lib/components/media/visibleColumns';
import PageNavigator from '$lib/components/page-navigator/PageNavigator.svelte';
import { rowCount } from '$lib/dashboard/rowCount';
import { savedRows } from '$lib/dashboard/savedRows';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import { toDashboardSettings } from '$lib/dashboard/toDashboardSettings';
import forward from '$lib/icons/regular/forward.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import DashboardPanel from '$lib/components/dashboard/DashboardPanel.svelte';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  upNext: Promise<readonly OnDeckItem[]>;
  /** The viewer's slug, for the progress link and the saved row count. */
  username: string;
  /** Only VIPs could change the rows in OG; everyone else was sent to the VIP page. */
  isVip: boolean;
  /** The sort and favorites-only count for the help line and the Progress link. Left out, OG's defaults. */
  settings?: DashboardSettings['upNext'];
  /** Welcome mode: an empty panel offers starter picks instead of a link. */
  welcome?: boolean;
}

const { upNext, username, isVip, settings = toDashboardSettings({ settings: null }).upNext, welcome = false }: Props =
  $props();

const PER_ROW = 6;
// The grid's width, so a smaller tablet's four columns get whole rows.
let width = $state(0);
const perRow = $derived(visibleColumns(width, PER_ROW));
const storageKey = $derived(`on_deck:${username}`);
// The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved count.
let saved = $derived(browser ? savedRows.read(storageKey) : null);

function changeRows(rows: number) {
  saved = rows;
  savedRows.write(storageKey, rows);
}

const progressHref = $derived(
  `/users/${username}/progress/watched/${settings.sort.by}/${settings.sort.how}?hide_completed=true`,
);
const services = $derived(settings.favorites === 1 ? 'service' : 'services');
// Its leading space would be trimmed as markup.
const STREAMING = ' + streaming on your ';
</script>

{#snippet panel(loading: boolean, content: Snippet, footer?: Snippet)}
  <DashboardPanel
  --panel-bg="var(--color-panel-gray)"
  --color-badge-border="var(--color-panel-gray)"
  title="Up Next"
  icon={forward}
  {loading}
  seeMore={{ href: progressHref, text: 'Progress' }}
  {footer}
>
    {#snippet help()}
      Sorted by {settings.sort.title.toLowerCase()}{#if settings.favorites > 0}{STREAMING}<strong
          >{settings.favorites.toLocaleString('en-US')}</strong> favorite {services}{/if}.
    {/snippet}
    {@render content()}
  </DashboardPanel>
{/snippet}

{#await upNext}
  {@render panel(true, pending)}
{:then items}
  {@const visible = items.filter((item) => !overlay.state('show', item.showId).dropped)}
  {@const rows = rowCount({ rows: saved, items: visible.length, perRow })}
  {#snippet cards()}
    {#if visible.length === 0}
      <PanelPrompt quote={panelQuotes.upNext} {welcome}
  text="Watchlist a show and its next episode waits here."
  action={{ href: resolve('/shows/[chart=chart]', { chart: 'trending' }), text: 'Find a show' }}>
        {#snippet picks()}<StarterPicks chart="trending" type="shows" count={4} action="watchlist" />{/snippet}
      </PanelPrompt>
    {:else}
      <div class="cards" bind:clientWidth={width}>
  <PosterGrid columns={PER_ROW}>
          {#each visible.slice(0, rows.rows * perRow) as item (item.showId)}
            <DashboardOnDeckCard initial={item} {username} {settings} />
          {/each}
        </PosterGrid>
</div>
    {/if}
  {/snippet}
  {#snippet navigator()}
    <PageNavigator
  label="Up Next"
  rows={rows.rows}
  maxRows={rows.maxRows}
  onchange={changeRows}
  upsellHref={isVip ? undefined : traktUrls.vip}
/>
  {/snippet}
  {@render panel(false, cards, navigator)}
{:catch}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}<CardShimmerRow columns={PER_ROW} ratio="poster" />{/snippet}

{#snippet failed()}
  <div class="notice">
  <LoadFailed what="Up Next" />
</div>
{/snippet}

<style>
/* OG's alert sat in the posters row, which kept 20px above it. */
.notice {
  padding-block-start: var(--gutter);
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
