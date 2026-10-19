<!--
  Trending's People you follow: who the viewer follows is watching this chart's type now. Each row is the member's
  avatar beside a condensed fanart title (the show small over the episode's number and title), the dashboard's red
  progress bar, then who on the left and the time left ticking down on the right. Like the Social Feed, the browser asks the members active in the last
  24 hours, now and every 2 minutes while the tab is visible.
-->
<script lang="ts">
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import { untrack } from 'svelte';
import { apiQueue } from '$lib/api/apiQueue';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import Countdown from '$lib/components/status/Countdown.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import { fetchRecentMembers, type SocialGet } from '$lib/dashboard/fetchSocialFeed';
import { fetchWatching, type LiveWatch } from '$lib/dashboard/fetchWatching';
import { pollWatching } from '$lib/dashboard/pollWatching';
import type { SocialMember } from '$lib/dashboard/toSocialItem';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { followingWatching } from './followingWatching';
import type { MediaType } from './loadChart';

interface Props {
  type: MediaType;
  open: boolean;
  datePreferences: DatePreferences;
  /** Who the viewer follows is watching now. Defaults to asking the API with the viewer's token. */
  watching?: () => Promise<readonly LiveWatch[]>;
}

const get: SocialGet = (path) =>
  apiQueue.run(() => rawApiFetch({ fetch: authenticatedFetch({ manager: userManager() }), path }));

// Who to ask stays put for the visit; what they're watching is asked again each time.
let members: Promise<readonly SocialMember[]> | undefined;
function fromApi() {
  members ??= fetchRecentMembers({ get, now: new Date(), datePreferences: untrack(() => datePreferences) })
    .catch((error: unknown) => {
      members = undefined;
      throw error;
    });
  return members.then((recent) => fetchWatching({ get, members: recent }));
}

const { type, open, datePreferences, watching = fromApi }: Props = $props();

const CLOCK_MS = 30_000;
let live = $state<readonly LiveWatch[] | null>(null);
let now = $state(new Date());

$effect(() => {
  const stop = pollWatching({
    // A failed ask settles the first one empty, rather than checking forever.
    load: () => watching().catch(() => live ?? []),
    onupdate: (value) => {
      live = value;
      now = new Date();
    },
  });
  const clock = setInterval(() => (now = new Date()), CLOCK_MS);
  return () => {
    stop();
    clearInterval(clock);
  };
});

const tiles = $derived(live && followingWatching(live, type, now));
const noun = $derived(type === 'shows' ? 'show' : 'movie');
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="following" title="People you follow" {open} remember>
  {#if tiles === null}
    <p class="note">Checking who's watching…</p>
  {:else if tiles.length === 0}
    <EmptyState compact>No one is watching a {noun} right now.</EmptyState>
  {:else}
    <ul class="members">
      {#each tiles as { watch, progress, minutesLeft } (watch.member.key)}
        <li>
          <img class="avatar" src={watch.member.avatar} alt="" loading="lazy" decoding="async" />
          <div class="what">
            {#if watch.episode}
              <a class="show" href={watch.title.href}>{watch.title.name}</a>
              <a class="title" href={watch.href}><span class="number">{watch.code}</span>
                {watch.episode.title ?? ''}</a>
            {:else}
              <a class="title" href={watch.href}>{watch.title.name}</a>
            {/if}
            <UnderProgress live href={watch.href} percent={progress}
              lines={[[{ text: `${progress}% watched` }, { text: `${minutesLeft}m left` }]]} />
            <p class="who">
              {#if watch.member.href}<a href={watch.member.href}>{watch.member.name}</a>{:else}{watch.member.name}{/if}
              <span class="left"><Countdown startedAt={watch.startedAt} endsAt={watch.expiresAt} /></span>
            </p>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</SidebarSection>

<style>
.note {
  margin: 0;
  color: var(--color-sidebar-note);
  font-size: var(--font-size-control);
}

.members {
  display: grid;
  gap: var(--following-watching-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: var(--following-watching-avatar) minmax(0, 1fr);
    gap: var(--space-base-inline);
    align-items: start;
  }
}

.avatar {
  inline-size: var(--following-watching-avatar);
  block-size: var(--following-watching-avatar);
  border-radius: 50%;
  object-fit: cover;
}

.what {
  display: grid;
  min-inline-size: 0;

  & :global(.under-progress) {
    margin-block: var(--following-watching-bar-gap);
  }
}

/* A fanart card's titles, condensed: the show small over the episode's number and title. */
.show,
.title {
  overflow: hidden;
  color: var(--color-frame-ink);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.show {
  color: var(--color-frame-ink-muted);
  font-size: var(--font-size-small);
}

.title {
  font-size: var(--font-size-base);
}

.number {
  font-weight: var(--font-weight-headings-heavy);
}

.who {
  display: flex;
  gap: var(--space-sm-inline);
  align-items: center;
  justify-content: space-between;
  min-inline-size: 0;
  margin: 0;
  color: var(--color-sidebar-note);
  font-size: var(--font-size-small);

  & > a {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-sidebar-note);
    font-weight: var(--font-weight-headings);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}
/* The dashboard tile's countdown: the card subtitle's gray, bold. */
.left {
  flex: none;
  color: var(--color-card-subtitle);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
