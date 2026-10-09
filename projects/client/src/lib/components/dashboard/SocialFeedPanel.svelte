<!--
  The dashboard's Social Feed, under a single Following pill tab: four tiles (who's watching now, then the title
  everyone else watched last), the Earlier timeline of sittings by day, which keeps the rest of each tile's sitting, and
  a Comments column when there are any. Pass the
  unawaited `fetchSocialFeed` promise from the loader, so the page streams in and this panel spins until it lands.
  After it renders, the browser asks what the most recently active members are watching, every 2 minutes while the tab
  is visible. Narrow screens get the tiles as a sideways swipe row.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { apiQueue } from '$lib/api/apiQueue';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import NoData from '$lib/components/empty/NoData.svelte';
import PillTabs from '$lib/components/tabs/PillTabs.svelte';
import { arrangeSocialFeed } from '$lib/dashboard/arrangeSocialFeed';
import type { SocialFeed } from '$lib/dashboard/fetchSocialFeed';
import { fetchWatching, type LiveWatch } from '$lib/dashboard/fetchWatching';
import { pollWatching } from '$lib/dashboard/pollWatching';
import type { SocialMember } from '$lib/dashboard/toSocialItem';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import SocialComment from './SocialComment.svelte';
import SocialPill from './SocialPill.svelte';
import SocialRow from './SocialRow.svelte';
import SocialTile from './SocialTile.svelte';

interface Props {
  feed: Promise<SocialFeed>;
  /** Who of these members is watching now. Defaults to asking the API with the viewer's token. */
  watching?: (members: readonly SocialMember[]) => Promise<readonly LiveWatch[]>;
}

const fromApi = (members: readonly SocialMember[]) =>
  fetchWatching({
    get: (path) => apiQueue.run(() => rawApiFetch({ fetch: authenticatedFetch({ manager: userManager() }), path })),
    members,
  });

const { feed, watching = fromApi }: Props = $props();

const TABS = [{ id: 'following', label: 'Following' }] as const;
const id = $props.id();
const commentId = (comment: number) => `${id}-comment-${comment}`;
const CLOCK_MS = 30_000;

let live = $state<readonly LiveWatch[]>([]);
let now = $state(new Date());
let showOverflow = $state(false);

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
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet panel(loading: boolean, content: Snippet)}
  <DashboardPanel
  --panel-bg="var(--color-social-feed-bg)"
  --panel-padding-end="var(--gutter)"
  title="Social Feed"
  icon={userGroup}
  {loading}
>
  <div class="tabs">
    <PillTabs label="Social Feed" tabs={TABS}>
        {#snippet panel()}
          <div class="body">{@render content()}</div>
        {/snippet}
      </PillTabs>
  </div>
</DashboardPanel>
{/snippet}

{#await feed}
  {@render panel(true, pending)}
{:then social}
  {#snippet body()}
    {#if social.sittings.length === 0}
      <div class="notice">
  <NoData>Follow some Trakt members to see what they're watching.</NoData>
</div>
    {:else}
      {@const layout = arrangeSocialFeed({ sittings: social.sittings, live, now })}
      <div class="feed">
        <div class="tiles">
          {#each layout.tiles as tile (tile.kind === 'live' ? `live:${tile.watch.member.key}` : tile.sitting.key)}
            <SocialTile {tile} />
          {/each}
          {#if layout.overflow.length > 0}
            <button type="button" class="more" aria-expanded={showOverflow} aria-controls="{id}-watching"
              aria-label="{layout.overflow.length} more watching now" onclick={() => (showOverflow = !showOverflow)}>
              <span class="stack">
                {#each layout.overflow.slice(0, 4) as { watch } (watch.member.key)}
                  <img src={watch.member.avatar} alt="" loading="lazy" decoding="async" />
                {/each}
              </span>
              <SocialPill dot="live">+{layout.overflow.length} watching</SocialPill>
            </button>
          {/if}
        </div>
        {#if layout.overflow.length > 0}
          <ul class="watching" id="{id}-watching" hidden={!showOverflow}>
            {#each layout.overflow as { watch, minutesLeft } (watch.member.key)}
              <li>
                <a href={watch.member.href ?? watch.href}>
                  <img src={watch.member.avatar} alt="" loading="lazy" decoding="async" />
                  <span><b>{watch.label}</b> · {watch.member.name} <span class="left">· {minutesLeft}m left</span></span>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
        <div class={['columns', { wide: social.comments.length === 0 }]}>
          {#if layout.timeline.length > 0}
            <section class="column" aria-labelledby="{id}-earlier">
              <h3 id="{id}-earlier">Earlier</h3>
              {#each layout.timeline as sitting, i (sitting.key)}
                {#if sitting.summary.day !== layout.timeline[i - 1]?.summary.day}
                  <h4 class="day">{sitting.summary.day}</h4>
                {/if}
                <SocialRow {sitting} watching={layout.watchingNow.has(sitting.member.key)} {commentId} />
              {/each}
            </section>
          {/if}
          {#if social.comments.length > 0}
            <section class="column comments" aria-labelledby="{id}-comments">
              <h3 id="{id}-comments">Comments</h3>
              {#each social.comments as item (item.key)}
                {#if item.comment}<SocialComment {item} id={commentId(item.comment.id)} />{/if}
              {/each}
            </section>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}
  {@render panel(false, body)}
{:catch}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}{/snippet}

{#snippet failed()}
  <div class="notice">
  <NoData>The Social Feed didn't load. Refresh the page to try again.</NoData>
</div>
{/snippet}

<style>
.body {
  --color-no-data-bg: var(--color-social-feed-no-data-bg);
}

/* OG's alert sat in the posters row, which kept 20px above it and, like each card, 20px under it. With the row's own
   20px and the panel's, that leaves 40px under the cards and 60px under the alert. */
.notice {
  padding-block: var(--gutter);
}

/* the panel fades in when its data lands, as OG's lazy panels did. */
.feed {
  padding-block-start: var(--gutter);
  container-type: inline-size;
  animation: fade-in var(--transition-card) ease-out;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--social-tile-gap);
}

.more {
  display: grid;
  aspect-ratio: var(--social-tile-ratio);
  gap: var(--space-lg-block);
  place-content: center;
  justify-items: center;
  padding: var(--space-lg-inline);
  border: 0;
  border-radius: var(--social-still-radius);
  background-color: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.stack {
  display: flex;

  & img {
    inline-size: var(--social-avatar-stack);
    block-size: var(--social-avatar-stack);
    border: 2px solid var(--color-surface);
    border-radius: 50%;
    object-fit: cover;
  }

  & img + img {
    margin-inline-start: var(--social-avatar-stack-overlap);
  }
}

.watching {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-base-block);
  margin: var(--space-social-row) 0 0;
  padding: 0;
  list-style: none;

  &[hidden] {
    display: none;
  }

  & a {
    display: flex;
    gap: var(--space-base-block);
    align-items: center;
    padding: var(--space-sm-block) var(--space-base-inline) var(--space-sm-block) var(--space-sm-block);
    border-radius: var(--social-pill-radius);
    background-color: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-social-meta);
  }

  & img {
    inline-size: var(--social-avatar-chip);
    block-size: var(--social-avatar-chip);
    border-radius: 50%;
    object-fit: cover;
  }
}

.left {
  color: var(--color-social-faint);
}

.columns {
  display: grid;
  grid-template-columns: var(--social-columns);
  gap: var(--social-columns-gap);
  margin-block-start: var(--space-social-columns);

  &.wide {
    grid-template-columns: minmax(0, 1fr);
  }
}

h3 {
  margin: 0 0 var(--space-xs-inline);
  color: var(--color-social-muted);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  letter-spacing: var(--social-heading-tracking);
  text-transform: uppercase;
}

.day {
  margin: 0;
  padding-block: var(--space-lg-block) var(--space-xs-block);
  border-block-end: 1px solid var(--color-social-line);
  color: var(--color-social-faint);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
}

.column {
  min-inline-size: 0;
  background-color: transparent;
}

.comments {
  display: grid;
  gap: var(--space-lg-block);
  align-content: start;
}

@container (width < 1000px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (width < 860px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@container (width < 560px) {
  .tiles {
    display: flex;
    gap: var(--space-lg-block);
    padding-block-end: var(--space-base-block);
    overflow-x: auto;
    scroll-snap-type: x mandatory;

    & > :global(*) {
      flex: 0 0 var(--social-tile-swipe);
      scroll-snap-align: start;
    }
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
