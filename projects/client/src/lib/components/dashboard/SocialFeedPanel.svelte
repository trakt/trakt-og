<script lang="ts">
  import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';
  import { browser } from '$app/env';
  import { isApiUnavailable } from '#lib/api/isApiUnavailable.ts';
  import { logHidden } from '#lib/api/logHidden.ts';
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
  import { rowCount } from '#lib/dashboard/rowCount.ts';
  import { savedRows } from '#lib/dashboard/savedRows.ts';
  import type { SocialCircle } from '#lib/dashboard/socialCircle.svelte.ts';
  import type { SocialPeriod } from '#lib/dashboard/socialWindows.ts';
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
  import type { BandWords } from '#lib/users/profile/toGenreBand.ts';
  import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
  import RatingLine from '#lib/components/rating/RatingLine.svelte';
  import chartSimple from '#lib/icons/regular/chart-simple.svg?raw';
  import posterStack from '#lib/icons/regular/rectangle-vertical-history.svg?raw';
  import fire from '#lib/icons/solid/fire.svg?raw';
  import DashboardPanel from './DashboardPanel.svelte';
  import PanelCounts from './PanelCounts.svelte';
  import SocialDetails from './SocialDetails.svelte';

  interface Props {
    /** The page's social reads, shared with Watching Now and Hot in Your Network. */
    circle: SocialCircle;
    /** The viewer's slug, for the saved page count. */
    username: string;
    /** Welcome mode: following nobody offers the team to follow instead of a link. */
  welcome?: boolean;
  }

  const { circle, username, welcome = false }: Props = $props();
  const { feed, datePreferences } = $derived(circle);

  const PERIODS: Readonly<Record<SocialPeriod, string>> = { today: 'Today', yesterday: 'Yesterday', week: 'Week' };
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
  /** Less and more step two rows at a time: a page. One to start, and more adds up to six. */
  const ROWS_PER_PAGE = 2;
  const MAX_PAGES = 7;

  let period = $state<SocialPeriod>('today');
  let view = $state<SocialView>('title');
  let fetching = $state<SocialPeriod | null>(null);
  // The grid's width, so a smaller tablet's four columns get whole rows.
  let width = $state(0);
  const perPage = $derived(visibleColumns(width, PER_ROW) * ROWS_PER_PAGE);
  let failed = $state<SocialPeriod | null>(null);

  const storageKey = $derived(`social_feed_pages:${username}`);
  // The cards only render in the browser, once the streamed promise lands, so SSR never needs the saved pages.
  let saved = $derived(browser ? savedRows.read(storageKey) : null);

  function pick(next: SocialPeriod) {
    period = next;
    failed = null;
    if (next === 'today' || circle.loaded[next]) return;

    fetching = next;

    void circle.load(next).catch(() => failed = next).finally(() => {
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

  /** Who's watching now, in a period that runs up to now, for the counts and the band. */
  const playing = $derived(period === 'yesterday' ? [] : circle.tiles);
const boardOf = (items: readonly SocialItem[] | undefined) =>
  items &&
  toSocialBoard({
    items,
    live: playing.map(({ watch }) => watch),
    view,
    windows: circle.windowsOf(period),
    now: circle.now,
    datePreferences,
  });
</script>

<!--
  The dashboard's Social Feed: a period (today, yesterday, the week) and a view
  (by title, person or time) to pick, and a poster grid of the period with the viewer's own quick icons, so each title
  shows where they stand and can be marked or listed from here. By title, members take turns, and past two a
  member's other titles fold into one poster that opens their history. A Most Active panel follows with a band of who
  did the most. It reads from the page's `SocialCircle`: its feed brings today, and the other periods load when
  they're picked. Until a period lands, shimmering cards hold its place. Who's watching now joins the counts and the
  band for a period that runs up to now.
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
      {#if item.details}<SocialDetails card={item} now={circle.now} />{/if}
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
    {@const board = boardOf(period === 'today' ? social.items : circle.loaded[period])}
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
      {#if board}<PanelCounts counts={[{ svg: posterStack, count: board.total, ...counted }]} />{/if}
    {/snippet}
    {@render panel(fetching !== null, body, board && board.cards.length > 0 ? navigator : undefined, count)}

    {#if board && board.bars.length > 0}
      {@const { activities, people } = board.stats}
      <DashboardPanel --panel-bg="var(--color-watchlist-bg)" title="Most Active" icon={fire}>
        {#snippet aside()}
          <PanelCounts counts={[
            { svg: userGroup, count: people, one: 'person', many: 'people' },
            { svg: chartSimple, count: activities, one: 'activity', many: 'activities' },
          ]} />
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

  /* Under its heading, like the panel's own content under "Social Feed". */
  .band {
    padding-block: var(--space-social-band);
  }

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
