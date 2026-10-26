<!--
  The dashboard's Social Feed: a period (today, yesterday, the week) and a view (by title, person or time) to pick,
  then whoever's watching now as fanart cards, three across, and a poster grid of the rest of the period with the
  viewer's own quick icons, so each title shows where they stand and can be marked or listed from here. A Most Active
  panel follows with a band of who did the most. Pass the unawaited `fetchSocialFeed` promise from the loader: it
  brings today, and the browser fetches the other periods when they're picked. Until a period lands, shimmering
  cards hold its place. After it renders, the browser asks
  what the most recently active members are watching, every 2 minutes while the tab is visible.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import { apiQueue } from '$lib/api/apiQueue';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import LoadFailed from '$lib/components/empty/LoadFailed.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import PanelPrompt from '$lib/components/empty/PanelPrompt.svelte';
import CardShimmerRow from '$lib/components/loading/CardShimmerRow.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import TeamToFollow from '$lib/components/first-night/TeamToFollow.svelte';
import { panelQuotes } from '$lib/firstNight/panelQuotes';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { visibleColumns } from '$lib/components/media/visibleColumns';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import PageNavigator from '$lib/components/page-navigator/PageNavigator.svelte';
import GenreBand from '$lib/components/users/GenreBand.svelte';
import { fetchSocialItems, type SocialFeed, type SocialGet } from '$lib/dashboard/fetchSocialFeed';
import { fetchWatching, type LiveWatch } from '$lib/dashboard/fetchWatching';
import { liveTiles } from '$lib/dashboard/liveTiles';
import { pollWatching } from '$lib/dashboard/pollWatching';
import { rowCount } from '$lib/dashboard/rowCount';
import { savedRows } from '$lib/dashboard/savedRows';
import { type SocialPeriod, socialWindows } from '$lib/dashboard/socialWindows';
import { type SocialCard, type SocialLinePart, type SocialView, toSocialBoard } from '$lib/dashboard/toSocialBoard';
import type { SocialItem, SocialMember } from '$lib/dashboard/toSocialItem';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { BandWords } from '$lib/users/profile/toGenreBand';
import { imageUrl } from '$lib/utils/imageUrl';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import RatingLine from '$lib/components/rating/RatingLine.svelte';
import chartSimple from '$lib/icons/regular/chart-simple.svg?raw';
import clockRotateLeft from '$lib/icons/regular/clock-rotate-left.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import user from '$lib/icons/regular/user.svg?raw';
import fire from '$lib/icons/solid/fire.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import SocialTile from './SocialTile.svelte';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  feed: Promise<SocialFeed>;
  datePreferences: DatePreferences;
  /** The viewer's slug, for the saved page count. */
  username: string;
  /** Who of these members is watching now. Defaults to asking the API with the viewer's token. */
  watching?: (members: readonly SocialMember[]) => Promise<readonly LiveWatch[]>;
  /** The rows of a period past today. Defaults to asking the API with the viewer's token. */
  rowsFor?: (period: Exclude<SocialPeriod, 'today'>) => Promise<readonly SocialItem[]>;
  /** Welcome mode: following nobody offers the team to follow instead of a link. */
  welcome?: boolean;
}

const get: SocialGet = (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path }));

const {
  feed,
  datePreferences,
  username,
  watching = (members) => fetchWatching({ get, members }),
  rowsFor,
  welcome = false,
}: Props = $props();

const PERIODS: Readonly<Record<SocialPeriod, string>> = { today: 'Today', yesterday: 'Yesterday', week: 'Week' };
const VIEWS: Readonly<Record<SocialView, string>> = { title: 'Title', person: 'Person', time: 'Time' };
const PEOPLE: BandWords = { rest: (count) => `${count} ${count === 1 ? 'person' : 'people'}`, top: 'the most active' };
/** The grid's heading for each view, and what its count counts. */
const GRIDS: Readonly<Record<SocialView, { title: string; icon: string; one: string; many: string }>> = {
  title: { title: 'Titles', icon: tvRetro, one: 'title', many: 'titles' },
  person: { title: 'People', icon: user, one: 'person', many: 'people' },
  time: { title: 'Timeline', icon: clockRotateLeft, one: 'activity', many: 'activities' },
};
const PER_ROW = 6;
const LIVE_PER_ROW = 3;
/** Less and more step two rows at a time: a page. One to start, and more adds up to six. */
const ROWS_PER_PAGE = 2;
const MAX_PAGES = 7;
const CLOCK_MS = 30_000;
/** The windows' anchor: fixed for the page, so a period's rows and its history links agree. */
const opened = new Date();

let period = $state<SocialPeriod>('today');
let view = $state<SocialView>('title');
let live = $state<readonly LiveWatch[]>([]);
let now = $state(new Date());
let loaded = $state<Partial<Record<Exclude<SocialPeriod, 'today'>, readonly SocialItem[]>>>({});
let fetching = $state<SocialPeriod | null>(null);
// The grid's width, so a smaller tablet's four columns get whole rows.
let width = $state(0);
const perPage = $derived(visibleColumns(width, PER_ROW) * ROWS_PER_PAGE);
let failed = $state<SocialPeriod | null>(null);

const storageKey = $derived(`social_feed_pages:${username}`);
// The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved pages.
let saved = $derived(browser ? savedRows.read(storageKey) : null);

const windowsOf = (which: SocialPeriod) => socialWindows(which, opened, datePreferences.timeZone);
const fromApi = (which: Exclude<SocialPeriod, 'today'>) =>
  fetchSocialItems({ get, windows: windowsOf(which), datePreferences });

function pick(next: SocialPeriod) {
  period = next;
  failed = null;
  if (next === 'today' || loaded[next]) return;

  fetching = next;
  void (rowsFor ?? fromApi)(next)
    .then((items) => (loaded = { ...loaded, [next]: items }))
    .catch(() => (failed = next))
    .finally(() => {
      if (fetching === next) fetching = null;
    });
}

function changePages(pages: number) {
  saved = pages;
  savedRows.write(storageKey, pages);
}

// After the feed lands: who's watching, now and every 2 minutes while visible, and a clock for the minutes left.
$effect(() => {
  let stop = () => {};
  let cancelled = false;
  void feed.then(({ recent }) => {
    if (cancelled || recent.length === 0) return;
    stop = pollWatching({
      load: () => watching(recent),
      onupdate: (value) => {
        live = value;
        now = new Date();
      },
    });
  }).catch(() => {});
  const clock = setInterval(() => (now = new Date()), CLOCK_MS);

  return () => {
    cancelled = true;
    stop();
    clearInterval(clock);
  };
});

/** Who's watching now, in a period that runs up to now. */
const playing = $derived(period === 'yesterday' ? [] : liveTiles(live, now));
const boardOf = (items: readonly SocialItem[] | undefined) =>
  items &&
  toSocialBoard({
    items,
    live: playing.map(({ watch }) => watch),
    view,
    windows: windowsOf(period),
    now,
    datePreferences,
  });
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet panel(loading: boolean, content: Snippet, footer?: Snippet, aside?: Snippet)}
  <DashboardPanel
  --panel-bg="var(--color-social-feed-bg)"
  --color-card-bg="var(--color-panel-quick-icons)"
  title="Social Feed"
  icon={userGroup}
  {loading}
  {footer}
  {aside}
>
  <div class="body">{@render content()}</div>
</DashboardPanel>
{/snippet}

{#snippet stat(svg: string, count: number, one: string, many: string)}
  <Stat {svg} value={count.toLocaleString('en-US')} noun={count === 1 ? one : many} />
{/snippet}

{#snippet face(member: SocialMember)}
  <Tooltip text={member.name === member.key ? member.name : `${member.name} (@${member.key})`}>
    {#snippet trigger(tooltip)}
      {#if member.href}
        <a class="face" href={member.href} aria-label={member.name} {...tooltip}><img src={member.avatar} alt=""
            loading="lazy" decoding="async" /></a>
      {:else}
        <span class="face" {...tooltip}><img src={member.avatar} alt="" loading="lazy" decoding="async" /></span>
      {/if}
    {/snippet}
  </Tooltip>
{/snippet}
{#snippet linePart(part: SocialLinePart)}
  {#if part.href}
    <a href={part.href}>{part.text}</a>
  {:else}
    <span>{part.text}</span>
  {/if}
{/snippet}
{#snippet card(item: SocialCard)}
  {@const target = item.target}
  {@const state = overlay.state(target.type, target.id, target.season)}
  <PosterCard
  href={item.href}
  title={item.title}
  number={item.number}
  image={imageUrl(item.poster, 'thumb')}
  userRating={state.rating}
  icons={{
      fill: quickIconFill({ state, airedEpisodes: target.airedEpisodes, runtime: target.runtime, datePreferences }),
      rating: target.rating,
      ratingTarget: { type: target.type, id: target.id, title: target.title, season: target.season },
      watchTarget: {
        type: target.type,
        id: target.id,
        title: target.title,
        season: target.season,
        airedEpisodes: target.airedEpisodes,
        runtime: target.runtime,
      },
      listLabel: target.type === 'episode' ? 'Add to list' : 'Add to watchlist',
    }}
>
    {#snippet posterOverlay()}
      <span class="faces">
        {#each item.members.slice(0, 3) as member (member.key)}
          {@render face(member)}
        {/each}
        {#if item.members.length > 3}<span class="more-faces">+{item.members.length - 3}</span>{/if}
      </span>
    {/snippet}
    {#if item.line.length > 0}
      <span class="line">
        {#each item.line as part, i (i)}{#if i > 0}<span class="separator" aria-hidden="true">·</span>{/if}{@render
            linePart(part)}{/each}
      </span>
    {/if}
    {#if item.rating}
      {#if item.rating.href}
        <a class="rating" href={item.rating.href}><RatingLine rating={item.rating.value} /></a>
      {:else}
        <RatingLine rating={item.rating.value} />
      {/if}
    {/if}
  </PosterCard>
{/snippet}

{#await feed}
  {@render panel(true, pending)}
{:then social}
  {#if !social.follows}
    {@render panel(false, nobody)}
  {:else}
    {@const board = boardOf(period === 'today' ? social.items : loaded[period])}
    {@const pages = rowCount({ rows: saved, items: board?.cards.length ?? 0, perRow: perPage, maxRows: MAX_PAGES })}
    {@const shown = GRIDS[view]}
    {#snippet body()}
      <div class="feed">
        <div class="controls">
          <Dropdown section="Period">
            {#snippet trigger()}{PERIODS[period]}{/snippet}
            <ul>
              {#each Object.entries(PERIODS) as [key, label] (key)}
                <li><button type="button" aria-current={key === period ? 'true' : undefined}
                    onclick={() => pick(key as SocialPeriod)}>{label}</button></li>
              {/each}
            </ul>
          </Dropdown>
          <Dropdown section="View">
            {#snippet trigger()}{VIEWS[view]}{/snippet}
            <ul>
              {#each Object.entries(VIEWS) as [key, label] (key)}
                <li><button type="button" aria-current={key === view ? 'true' : undefined}
                    onclick={() => (view = key as SocialView)}>{label}</button></li>
              {/each}
            </ul>
          </Dropdown>
        </div>

        {#if playing.length > 0}
          <div class="live">
            <PosterGrid columns={LIVE_PER_ROW} phoneColumns={2}>
              {#each playing as tile (tile.watch.member.key)}
                <SocialTile {tile} />
              {/each}
            </PosterGrid>
          </div>
        {/if}

        {#if failed === period}
          <div class="notice">
  <LoadFailed what={PERIODS[period]} onretry={() => pick(period)} />
</div>
        {:else if board && board.cards.length === 0}
          <div class="notice">
  <EmptyState />
</div>
        {:else if board}
          <div class="grid" bind:clientWidth={width}>
            <PosterGrid columns={PER_ROW}>
              {#each board.cards.slice(0, pages.rows * perPage) as item (item.key)}
                {@render card(item)}
              {/each}
            </PosterGrid>
          </div>
        {:else}
          <div class="grid"><CardShimmerRow columns={PER_ROW} ratio="poster" /></div>
        {/if}
      </div>
    {/snippet}
    {#snippet navigator()}
      <PageNavigator label="Social Feed" rows={pages.rows} maxRows={pages.maxRows} onchange={changePages} />
    {/snippet}
    {#snippet count()}
      {#if board}<span class="stats">{@render stat(shown.icon, board.cards.length, shown.one, shown.many)}</span>{/if}
    {/snippet}
    {@render panel(fetching !== null, body, board && board.cards.length > 0 ? navigator : undefined, count)}

    {#if board && board.bars.length > 0}
      {@const { activities, people } = board.stats}
      <DashboardPanel --panel-bg="var(--color-watchlist-bg)" title="Most Active" icon={fire}>
        {#snippet aside()}
          <span class="stats">
            {@render stat(userGroup, people, 'person', 'people')}
            {@render stat(chartSimple, activities, 'activity', 'activities')}
          </span>
        {/snippet}
        <div class="band"><GenreBand genres={board.bars} words={PEOPLE} /></div>
      </DashboardPanel>
    {/if}
  {/if}
{:catch}
  {@render panel(false, broken)}
{/await}

{#snippet pending()}
  <div class="shimmers">
    <div class="controls">
      <Shimmer inline="var(--social-shimmer-dropdown-width)" block="var(--control-height)" />
      <Shimmer inline="var(--social-shimmer-dropdown-width)" block="var(--control-height)" />
    </div>
    <div class="grid"><CardShimmerRow columns={PER_ROW} ratio="poster" /></div>
  </div>
{/snippet}

{#snippet nobody()}
  <PanelPrompt quote={panelQuotes.socialFeed} {welcome}
  text="Follow people to see what they watch, rate and say."
  action={{ href: `${resolve('/about')}#about-team`, text: 'Meet the team' }}>
    {#snippet picks()}<TeamToFollow />{/snippet}
  </PanelPrompt>
{/snippet}

{#snippet broken()}
  <div class="notice">
  <LoadFailed what="Social Feed" />
</div>
{/snippet}

<style>
.notice {
  padding-block: var(--gutter);
}

/* the panel fades in when its data lands, as OG's lazy panels did. */
.feed {
  container-type: inline-size;
  animation: fade-in var(--transition-card) ease-out;
}

.feed,
.shimmers {
  padding-block-start: var(--space-heading-dropdowns);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-dropdown-row);
  align-items: center;
}

/* On the heading's line: as tall as the h2's, centered on it. */
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stats);
  align-items: center;
  min-block-size: calc(var(--font-size-h2) * var(--line-height-headings));
}

/* Under its heading, like the panel's own content under "Social Feed". */
.band {
  padding-block: var(--space-social-band);
}

/* The grid's own top gutter sets it under its heading and leaves room for the faces. Under the posters, a little
   room before the less and more pill, which hangs over the panel's edge. */
/* The poster grid under it brings its own gutter, which the faces lift into. */
.live {
  margin-block-start: var(--space-social-live-top);
  margin-block-end: calc(var(--space-social-live-end) - var(--gutter));
}

/* Smaller tablets: two across, half the width each. */
@container (width < 940px) {
  .live :global(.poster-grid) {
    --visible: 2;
  }
}

/* With nobody watching, the posters take the live cards' room under the dropdowns. */
.controls + .grid {
  margin-block-start: var(--space-social-live-top);
}

.grid {
  margin-block-end: calc(var(--space-social-grid-end) - var(--gutter));
}

/* Who's on a poster, over its top-left corner; each face names them on hover and opens their profile. */
.faces {
  position: absolute;
  z-index: 1;
  inset-block-start: calc(-1 * var(--social-face-lift));
  inset-inline-start: calc(-1 * var(--social-face-lift));
  display: flex;
  /* Every face overlaps the one before; this takes the first one's overlap back. */
  padding-inline-start: var(--social-face-overlap);
}

.face,
.more-faces {
  display: block;
  inline-size: var(--social-face);
  block-size: var(--social-face);
  border: 2px solid var(--color-social-feed-bg);
  border-radius: 50%;
  margin-inline-start: calc(-1 * var(--social-face-overlap));
  background-color: var(--color-social-face-more);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

a.face {
  transition: transform var(--transition-card);

  &:is(:hover, :focus-visible) {
    transform: translateY(-2px);
  }
}

.more-faces {
  display: grid;
  place-items: center;
  background-color: var(--color-social-face-more);
  color: var(--color-social-on-image);
  font-size: var(--font-size-social-pill);
  font-weight: bold;
}

.line {
  display: block;
  margin-block-start: var(--space-card-subtitle);
  overflow: hidden;
  color: var(--color-card-subtitle);
  font-family: var(--font-headings);
  font-size: var(--font-size-card-subtitle);
  line-height: var(--line-height-card-subtitle);
  text-overflow: ellipsis;
  white-space: nowrap;

  & a {
    color: inherit;

    &:is(:hover, :focus-visible) {
      color: var(--color-text);
      text-decoration: underline;
    }
  }
}

.separator {
  margin-inline: var(--space-social-separator);
}

.rating {
  display: block;
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) :global(.rating-line) {
    color: var(--color-text);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed {
    animation: none;
  }
}
</style>
