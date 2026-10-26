<!--
  The dashboard's Recently Watched panel: the viewer's last nine plays as
  fanart cards, one row of three at first, with the less and more pill for up to three. Pass the unawaited
  `fetchRecentlyWatched` promise from the loader, so the page streams in and a row of shimmering cards holds its place until it lands, and
  fails on its own if it doesn't. A check-in still running reads as live, like the Social Feed's watching-now cards.
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
import FanartCard from '$lib/components/media/FanartCard.svelte';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import PageNavigator from '$lib/components/page-navigator/PageNavigator.svelte';
import { rowCount } from '$lib/dashboard/rowCount';
import { savedRows } from '$lib/dashboard/savedRows';
import { toCheckin } from '$lib/dashboard/toCheckin';
import type { RecentPlay } from '$lib/dashboard/toRecentPlay';
import clockRotateLeft from '$lib/icons/regular/clock-rotate-left.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import DashboardPanel from './DashboardPanel.svelte';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  plays: Promise<readonly RecentPlay[]>;
  /** The viewer's slug, for the history link and the saved row count. */
  username: string;
  /** Only VIPs could change the rows in OG; everyone else was sent to the VIP page. */
  isVip: boolean;
  datePreferences: DatePreferences;
  /** Welcome mode: an empty panel offers starter picks instead of a link. */
  welcome?: boolean;
}

const { plays, username, isVip, datePreferences, welcome = false }: Props = $props();

const PER_ROW = 3;
const CLOCK_MS = 30_000;
const storageKey = $derived(`recently_watched:${username}`);
// The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved count.
let saved = $derived(browser ? savedRows.read(storageKey) : null);

let now = $state(new Date());

$effect(() => {
  const clock = setInterval(() => (now = new Date()), CLOCK_MS);
  return () => clearInterval(clock);
});

function changeRows(rows: number) {
  saved = rows;
  savedRows.write(storageKey, rows);
}
</script>

{#snippet panel(loading: boolean, content: Snippet, footer?: Snippet)}
  <DashboardPanel
  --color-card-bg="var(--color-panel-quick-icons)"
  title="Recently Watched"
  icon={clockRotateLeft}
  section
  {loading}
  seeMore={{ href: `/users/${username}/history`, text: 'History' }}
  {footer}
>
  <div class="body">{@render content()}</div>
</DashboardPanel>
{/snippet}

{#snippet card(play: RecentPlay)}
  {@const state = overlay.state(play.type, play.id, play.season)}
  {@const checkin = toCheckin(play, now)}
  {#snippet checkinBar()}
    <UnderProgress live href={play.href} percent={checkin?.progress ?? 0}
  tip={`${checkin?.progress ?? 0}% watched`} />
  {/snippet}
  <div class="play">
  <FanartCard
    framed
    href={play.href}
    title={play.title}
    year={play.year}
    number={play.number}
    smallTitle={play.smallTitle}
    image={play.image}
    tags={checkin?.tags ?? play.tags}
    userRating={state.rating}
    icons={{
      fill: quickIconFill({ state, datePreferences }),
      rating: play.rating,
      ratingTarget: { type: play.type, id: play.id, title: play.title },
      watchTarget: { type: play.type, id: play.id, title: play.title, runtime: play.runtime, season: play.season },
      favorite: true,
      favoriteTarget: play.favorite,
      watchNow: 'play',
      listLabel: play.type === 'movie' ? 'Add to watchlist' : 'Add to list',
    }}
    progress={checkin ? checkinBar : undefined}
  />
</div>
{/snippet}

{#await plays}
  {@render panel(true, pending)}
{:then items}
  {@const rows = rowCount({ rows: saved, items: items.length, perRow: PER_ROW })}
  {#snippet cards()}
    {#if items.length === 0}
      <PanelPrompt roomy --panel-prompt-offset="calc(var(--space-lg-block) + var(--space-fanarts-row-end))"
  quote={panelQuotes.recentlyWatched} {welcome}
  text="Mark what you've seen. Stats, recaps and picks follow."
  action={{ href: resolve('/movies/[chart=chart]', { chart: 'popular' }), text: 'Find a movie' }}>
        {#snippet picks()}<StarterPicks chart="popular" type="movies" count={4} action="seen" />{/snippet}
      </PanelPrompt>
    {:else}
      <div class="cards">
  <PosterGrid columns={PER_ROW} phoneColumns={1}>
          {#each items.slice(0, rows.rows * PER_ROW) as play (play.key)}
            {@render card(play)}
          {/each}
        </PosterGrid>
</div>
    {/if}
  {/snippet}
  {#snippet navigator()}
    <PageNavigator
  label="Recently Watched"
  rows={rows.rows}
  maxRows={rows.maxRows}
  onchange={changeRows}
  upsellHref={isVip ? undefined : traktUrls.vip}
/>
  {/snippet}
  {@render panel(false, cards, items.length > 0 ? navigator : undefined)}
{:catch}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}<CardShimmerRow columns={PER_ROW} phoneColumns={1} ratio="fanart" />{/snippet}

{#snippet failed()}
  <div class="notice">
  <LoadFailed what="Recently Watched" />
</div>
{/snippet}

<style>
/* OG's `h2.section` kept 28px under it, and its `.row.fanarts` 30px after the cards' own 20px. */
.body {
  padding-block: calc(var(--space-heading-section) - var(--gutter)) var(--space-fanarts-row-end);
}

.play {
  min-inline-size: 0;
}

/* OG's alert sat in the fanarts row, which kept 20px above it. */
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
