<script lang="ts">
  import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';
  import { browser } from '$app/env';
  import { apiQueue } from '#lib/api/apiQueue.ts';
  import { isApiUnavailable } from '#lib/api/isApiUnavailable.ts';
  import { logHidden } from '#lib/api/logHidden.ts';
  import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
  import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
  import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
  import EmptyState from '#lib/components/empty/EmptyState.svelte';
  import PanelPrompt from '#lib/components/empty/PanelPrompt.svelte';
  import CardShimmerRow from '#lib/components/loading/CardShimmerRow.svelte';
  import Shimmer from '#lib/components/loading/Shimmer.svelte';
  import TeamToFollow from '#lib/components/first-night/TeamToFollow.svelte';
  import { panelQuotes } from '#lib/firstNight/panelQuotes.ts';
  import PosterCard from '#lib/components/media/PosterCard.svelte';
  import PosterGrid from '#lib/components/media/PosterGrid.svelte';
  import { visibleColumns } from '#lib/components/media/visibleColumns.ts';
  import { quickIconFill } from '#lib/components/media/quickIconFill.ts';
  import PageNavigator from '#lib/components/page-navigator/PageNavigator.svelte';
  import GenreBand from '#lib/components/users/GenreBand.svelte';
  import { fetchSocialItems, type SocialFeed, type SocialGet } from '#lib/dashboard/fetchSocialFeed.ts';
  import { fetchFollowingWatching } from '#lib/dashboard/fetchFollowingWatching.ts';
  import type { LiveWatch } from '#lib/dashboard/fetchWatching.ts';
  import { liveTiles } from '#lib/dashboard/liveTiles.ts';
  import { pollWatching } from '#lib/dashboard/pollWatching.ts';
  import { rowCount } from '#lib/dashboard/rowCount.ts';
  import { savedRows } from '#lib/dashboard/savedRows.ts';
  import { type SocialPeriod, type SocialSpan, socialWindows } from '#lib/dashboard/socialWindows.ts';
import {
  type SocialCard,
  type SocialLinePart,
  type SocialView,
  toSocialBoard,
} from '#lib/dashboard/toSocialBoard.ts';
  import type { SocialTag } from '#lib/dashboard/toSocialTag.ts';
  import { socialTagLook } from './socialTagLook.ts';
  import CardTag from '#lib/components/media/CardTag.svelte';
  import EpisodeTypeBadge from '#lib/components/media/EpisodeTypeBadge.svelte';
  import type { SocialItem, SocialMember } from '#lib/dashboard/toSocialItem.ts';
  import userGroup from '#lib/icons/regular/user-group.svg?raw';
  import { overlay } from '#lib/overlay/overlay.ts';
  import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
  import type { BandWords } from '#lib/users/profile/toGenreBand.ts';
  import Stat from '#lib/components/stats/Stat.svelte';
  import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
  import RatingLine from '#lib/components/rating/RatingLine.svelte';
  import chartSimple from '#lib/icons/regular/chart-simple.svg?raw';
  import posterStack from '#lib/icons/regular/rectangle-vertical-history.svg?raw';
  import fire from '#lib/icons/solid/fire.svg?raw';
  import { toCircleEvents } from '#lib/dashboard/toCircleEvents.ts';
  import CircleHighlights from './CircleHighlights.svelte';
  import DashboardPanel from './DashboardPanel.svelte';
  import SocialDetails from './SocialDetails.svelte';
  import SocialTile from './SocialTile.svelte';
  import { viewerFetch } from '../../auth/viewerFetch.ts';

  interface Props {
    feed: Promise<SocialFeed>;
    datePreferences: DatePreferences;
    /** The viewer's slug, for the saved page count. */
    username: string;
    /** Who the viewer follows is watching now. Defaults to asking the API with the viewer's token. */
    watching?: () => Promise<readonly LiveWatch[]>;
    /** The rows of a period past today. Defaults to asking the API with the viewer's token. */
    rowsFor?: (period: Exclude<SocialSpan, 'today'>) => Promise<readonly SocialItem[]>;
    /** How many people the viewer follows, for the featured title's share; null when that didn't load. */
    following?: number | null;
    /** Welcome mode: following nobody offers the team to follow instead of a link. */
  welcome?: boolean;
  }

  const get: SocialGet = (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path }));

  const {
    feed,
    datePreferences,
    username,
    watching = () => fetchFollowingWatching({ get }),
    rowsFor,
    following = null,
  welcome = false,
  }: Props = $props();

  const PERIODS: Readonly<Record<SocialPeriod, string>> = { today: 'Today', yesterday: 'Yesterday', week: 'Week' };
  type CircleSpan = Extract<SocialSpan, 'week' | 'month'>;
  const SPANS: Readonly<Record<CircleSpan, string>> = { week: 'Week', month: 'Month' };
  const VIEWS: Readonly<Record<SocialView, string>> = { title: 'Title', person: 'Person', time: 'Time' };
const PEOPLE: BandWords = { rest: (count) => `${count} ${count === 1 ? 'person' : 'people'}` };
  /** What each view's count counts. */
  const COUNTS: Readonly<Record<SocialView, { one: string; many: string }>> = {
    title: { one: 'title', many: 'titles' },
    person: { one: 'person', many: 'people' },
    time: { one: 'activity', many: 'activities' },
  };
  /** Between the parts of the line under a poster, which may be links. */
  const SPACE = ' ';
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
  let loaded = $state<Partial<Record<Exclude<SocialSpan, 'today'>, readonly SocialItem[]>>>({});
  let fetching = $state<SocialPeriod | null>(null);
  // The grid's width, so a smaller tablet's four columns get whole rows.
  let width = $state(0);
  const perPage = $derived(visibleColumns(width, PER_ROW) * ROWS_PER_PAGE);
  let liveRows = $state(1);
  let liveWidth = $state(0);
  // Half the poster grid's columns, as the live grid's container query below sets: three, two on smaller tablets.
  const livePerRow = $derived(Math.max(2, visibleColumns(liveWidth, PER_ROW) / 2));
  let failed = $state<SocialPeriod | null>(null);
  let span = $state<CircleSpan>('week');
  let spanFetching = $state(false);
  let spanFailed = $state(false);

  const storageKey = $derived(`social_feed_pages:${username}`);
  // The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved pages.
  let saved = $derived(browser ? savedRows.read(storageKey) : null);

  const windowsOf = (which: SocialSpan) => socialWindows(which, opened, datePreferences.timeZone);
const fromApi = (which: Exclude<SocialSpan, 'today'>) =>
  fetchSocialItems({ get, windows: windowsOf(which), datePreferences });

  // Each period loads once, for Hot in Your Network and the feed both. A failed load is dropped, so picking it again retries.
  const requests: Partial<Record<Exclude<SocialSpan, 'today'>, Promise<readonly SocialItem[]>>> = {};
  function rowsOf(which: Exclude<SocialSpan, 'today'>) {
    const request = requests[which] ?? (rowsFor ?? fromApi)(which);
    requests[which] = request;
    request.catch(() => delete requests[which]);
    return request;
  }

  /** Hot in Your Network's period, loaded the first time it's picked. */
  function pickSpan(next: CircleSpan) {
    span = next;
    spanFailed = false;
    if (loaded[next]) return;
    spanFetching = true;
    void rowsOf(next)
      .then((items) => loaded = { ...loaded, [next]: items })
      .catch(() => {
        if (span === next) spanFailed = true;
      })
      .finally(() => {
        if (span === next) spanFetching = false;
      });
  }

  function pick(next: SocialPeriod) {
    period = next;
    failed = null;
    if (next === 'today' || loaded[next]) return;

    fetching = next;

    void rowsOf(next).then((items) => loaded = { ...loaded, [next]: items }).catch(() => failed = next).finally(() => {
      if (fetching === next) fetching = null;
    });
}

function changePages(pages: number) {
  saved = pages;
  savedRows.write(storageKey, pages);
}

  // A client ID that may not call the feed gets no panel, and a note in the browser console.
  $effect(() => {
    feed.catch((error: unknown) => {
      if (isApiUnavailable(error)) logHidden('The Social Feed');
    });
  });

  // After the feed lands: who's watching, now and every 2 minutes while visible, and a clock for the minutes left.
  $effect(() => {
    let stop = () => {};
    let cancelled = false;
    void feed.then(({ follows }) => {
      if (cancelled || !follows) return;
      stop = pollWatching({
        load: watching,
        onupdate: (value) => {
          live = value;
          now = new Date();
      },
      });
    }).catch(() => {});
    const clock = setInterval(() => now = new Date(), CLOCK_MS);

    return () => {
      cancelled = true;
      stop();
      clearInterval(clock);
    };
  });

  // After the feed lands: the week, for what the most people the viewer follows were on.
  $effect(() => {
    let cancelled = false;
    void feed.then(({ follows }) => {
      if (cancelled || !follows || loaded.week) return;
      return rowsOf('week').then((items) => {
        if (!cancelled) loaded = { ...loaded, week: items };
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  });

  const circleOf = (which: SocialSpan, items: readonly SocialItem[] | undefined) =>
    items && toCircleEvents(items, following, windowsOf(which));
  const hasEvents = (events: ReturnType<typeof circleOf>) =>
    events !== undefined && (events.featured !== null || events.standouts.length > 0);
  // Hot in Your Network shows when the week has something to show, and then stays for every period.
  const weekEvents = $derived(circleOf('week', loaded.week));
  const tiles = $derived(liveTiles(live, now));
  const livePages = $derived(rowCount({ rows: liveRows, items: tiles.length, perRow: livePerRow, maxRows: tiles.length }));
  /** Who's watching now, in a period that runs up to now, for the counts and the band. */
  const playing = $derived(period === 'yesterday' ? [] : tiles);
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

<!--
  The dashboard's Social Feed. Watching Now comes first, a panel of its own while anyone is: fanart cards, three
  across, with the less and more pill for the rest. Then the feed: a period (today, yesterday, the week) and a view
  (by title, person or time) to pick, and a poster grid of the period with the viewer's own quick icons, so each title
  shows where they stand and can be marked or listed from here. By title, members take turns, and past two a
  member's other titles fold into one poster that opens their history. A Most Active panel follows with a band of who
  did the most. Pass the unawaited `fetchSocialFeed` promise from the loader: it
  brings today, and the browser fetches the other periods when they're picked. Until a period lands, shimmering
  cards hold its place. After it renders, the browser asks
  what the most recently active members are watching, every 2 minutes while the tab is visible.
-->
<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet panel(loading: boolean, content: Snippet, footer?: Snippet, aside?: Snippet)}
  <DashboardPanel
    --panel-bg="var(--color-social-feed-bg)"
    --color-card-bg="var(--color-panel-quick-icons)"
    title="Social Feed"
    icon={userGroup}
    loading={loading}
    footer={footer}
    aside={aside}
  ><div class="body">{@render content()}</div></DashboardPanel>
{/snippet}

<!-- Each count is its icon and number; what it counts is the tooltip, "Titles". -->
{#snippet stat(svg: string, count: number, one: string, many: string)}
  {@const noun = count === 1 ? one : many}
  <Stat {svg} value={count.toLocaleString('en-US')} {noun} label={noun.charAt(0).toUpperCase() + noun.slice(1)} bare />
{/snippet}

{#snippet face(member: SocialMember)}
  <Tooltip text={member.name}>
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
<!-- What stands out about a poster, over its bottom-left corner, as Hot in Your Network's story cards tag it. An episode's type
     goes through its badge, which the viewer can turn off. -->
{#snippet tag(tag: SocialTag)}
  {@const { band: _, ...look } = socialTagLook(tag)}
  <span class="tag">
    {#if tag.kind === 'episode'}
      <EpisodeTypeBadge label={tag.episode.text} kind={tag.episode.kind} inline />
    {:else}
      <CardTag {...look} />
    {/if}
  </span>
{/snippet}
{#snippet card(item: SocialCard)}
  {@const target = item.target}
  {@const state = overlay.state(target.type, target.id, target.season)}
  <PosterCard
  href={item.href}
  title={item.title}
  number={item.number}
  image={item.poster}
  userRating={item.folded ? undefined : state.rating}
  icons={item.folded ? undefined : {
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
      {#if item.details}<SocialDetails card={item} {now} />{/if}
      {#if item.tag}{@render tag(item.tag)}{/if}
      <span class="faces">
        {#each item.members.slice(0, 3) as member (member.key)}
          {@render face(member)}
        {/each}
        {#if item.members.length > 3}<span class="more-faces">+{item.members.length - 3}</span>{/if}
      </span>
      {#if item.folded}<span class="fold" aria-hidden="true">+{item.folded}</span>{/if}
    {/snippet}
    {#if item.line.length > 0}
      <span class="line">
        {#each item.line as part, i (i)}{#if i > 0}{SPACE}{/if}{@render linePart(part)}{/each}
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
    {@const counted = COUNTS[view]}
    {#snippet body()}
      <div class="feed" {@attach trackDrilldowns({ source: 'social-feed' })}>
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
                <li>
                  <button
                    type="button"
                    aria-current={key === view ? 'true' : undefined}
                    onclick={() => view = key as SocialView}
                  >{label}</button>
                </li>
              {/each}
            </ul>
          </Dropdown>
        </div>

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
      <PageNavigator label="Social Feed" rows={pages.rows} maxRows={pages.maxRows} onchange={changePages} edge />
    {/snippet}
    {#snippet count()}
      {#if board}<span class="stats">{@render stat(posterStack, board.total, counted.one, counted.many)}</span>{/if}
    {/snippet}
    {#if tiles.length > 0}
      {#snippet liveNavigator()}
        <PageNavigator label="Watching Now" rows={livePages.rows} maxRows={livePages.maxRows}
          onchange={(rows) => liveRows = rows} edge />
      {/snippet}
      {#snippet liveCount()}
        <span class="stats">{@render stat(userGroup, tiles.length, 'person', 'people')}</span>
      {/snippet}
      {#snippet liveHelp()}From people you follow.{/snippet}
      <DashboardPanel --panel-bg="var(--color-social-live-bg)" title="Watching Now" live help={liveHelp}
        footer={liveNavigator} aside={liveCount}>
        <div class="live" bind:clientWidth={liveWidth} {@attach trackDrilldowns({ source: 'social-feed' })}>
          <PosterGrid columns={LIVE_PER_ROW} phoneColumns={2}>
            {#each tiles.slice(0, livePages.rows * livePerRow) as tile (tile.watch.member.key)}
              <SocialTile tile={tile} />
            {/each}
          </PosterGrid>
        </div>
      </DashboardPanel>
    {/if}
    {#if hasEvents(weekEvents)}
      {@const events = circleOf(span, loaded[span])}
      {#snippet circleCount()}
        {#if following !== null}<span class="stats">{@render stat(userGroup, following, 'person you follow',
            'people you follow')}</span>{/if}
      {/snippet}
      <DashboardPanel --panel-bg="var(--color-panel-gray)" title="Hot in Your Network" hot
        loading={spanFetching} aside={circleCount}>
        <div class="circle" {@attach trackDrilldowns({ source: 'social-feed' })}>
          <div class="controls">
            <Dropdown section="Period">
              {#snippet trigger()}{SPANS[span]}{/snippet}
              <ul>
                {#each Object.entries(SPANS) as [key, label] (key)}
                  <li><button type="button" aria-current={key === span ? 'true' : undefined}
                      onclick={() => pickSpan(key as CircleSpan)}>{label}</button></li>
                {/each}
              </ul>
            </Dropdown>
          </div>
          {#if spanFailed}
            <div class="notice"><LoadFailed what={SPANS[span]} onretry={() => pickSpan(span)} /></div>
          {:else if events && hasEvents(events)}
            <div class="highlights"><CircleHighlights {events} {following} {now} /></div>
          {:else if events}
            <p class="quiet">Nothing three or more of the people you follow were on.</p>
          {:else}
            <div class="highlights"><Shimmer inline="100%" block="var(--social-circle-banner-height)" /></div>
          {/if}
        </div>
      </DashboardPanel>
    {/if}
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
{:catch error}
  {#if !isApiUnavailable(error)}
    {#snippet broken()}
      <div class="notice"><LoadFailed what="Social Feed" error={error} /></div>
    {/snippet}
    {@render panel(false, broken)}
  {/if}
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
  <PanelPrompt
    quote={panelQuotes.socialFeed}
    welcome={welcome}
    text="Follow people to see what they watch, rate and say."
    action={{
      href: `${resolve('about')}#about-team`,
      text: 'Meet the team'
    }}
  >
    {#snippet picks()}
      <TeamToFollow />
    {/snippet}
  </PanelPrompt>
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

  /* Under its heading over the grid's own gutter, then a little room before the less and more pill, which hangs over
   the panel's edge. */
  .live {
    container-type: inline-size;
    margin-block-start: var(--space-social-live-top);
    margin-block-end: calc(var(--space-social-live-end) - var(--gutter));
  }

  /* Smaller tablets: two across, half the width each. */
  @container (width < 940px) {
    .live :global(.poster-grid) {
      --visible: 2;
    }
  }

  .controls + .grid {
    margin-block-start: var(--space-social-live-top);
  }

  /* Under its heading, as the feed's dropdowns sit under "Social Feed". */
  .circle {
    container-type: inline-size;
    padding-block: var(--space-heading-dropdowns) var(--space-social-circle-end);
  }

  .highlights {
    margin-block-start: var(--space-social-circle-top);
  }

  .quiet {
    margin: var(--space-social-circle-top) 0 0;
    color: var(--color-card-subtitle);
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

  /* A member's other titles: how many, over the next one's poster. The poster's link takes the click. */
  .fold {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background-color: var(--color-social-fold-scrim);
    color: var(--color-social-on-image);
    font-size: var(--font-size-social-fold);
    font-weight: var(--font-weight-headings-heavy);
    pointer-events: none;
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

  /* Over the poster's bottom-left corner, where an episode's type tag goes on other cards. */
  .tag {
    position: absolute;
    z-index: 1;
    inset-inline-start: var(--episode-tag-inset);
    inset-block-end: var(--episode-tag-inset);
    display: flex;
    max-inline-size: calc(100% - 2 * var(--episode-tag-inset));
    pointer-events: none;
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
