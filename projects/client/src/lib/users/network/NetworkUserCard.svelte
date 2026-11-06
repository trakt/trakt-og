<!--
  A network page user card that fills itself in once it's on screen. The list leaves out VIP covers and the OG and
  years on the VIP label, so a VIP's card asks their profile for them, once. Someone the viewer follows turns live from
  the page's one call for everyone they follow. Anyone else's card asks what they're watching once their follow state
  is in, then again every 2 minutes while the card is on screen and the tab is visible, and turns live in place when
  they are. Scrolling back to a card checked in the last 2 minutes asks nothing.
    <NetworkUserCard {user} {relation} canFollow={data.canFollow} />
-->
<script lang="ts">
import { untrack } from 'svelte';
import { apiQueue } from '#lib/api/apiQueue.ts';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import UserCard from '#lib/components/users/UserCard.svelte';
import { fetchWatching, type LiveWatch } from '#lib/dashboard/fetchWatching.ts';
import { liveTiles } from '#lib/dashboard/liveTiles.ts';
import { pollWatching } from '#lib/dashboard/pollWatching.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import type { ViewerRelation } from '#lib/users/ViewerRelation.ts';
import { inViewport } from '#lib/utils/inViewport.ts';
import { fetchNetworkProfile } from './fetchNetworkProfile.ts';
import type { NetworkExtra } from './NetworkExtra.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  user: ProfileUser;
  extra?: NetworkExtra;
  relation?: ViewerRelation | null;
  /** The viewer's follow state is still loading. */
  pending?: boolean;
  canFollow?: boolean;
  /**
   * What they're watching, from the page's one call for everyone the viewer follows, `null` when nothing. Left out
   * when the viewer doesn't follow them, so the card asks on its own.
   */
  followedWatch?: LiveWatch | null;
}

const { user, extra, relation = null, pending = false, canFollow = true, followedWatch }: Props = $props();

/** A little under the poll's 2 minutes, so each tick asks again but a quick scroll back doesn't. */
const RECHECK_MS = 110_000;
const CLOCK_MS = 30_000;
const get = (path: string) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path }));

let visible = $state(false);
let profile = $state<ProfileUser | null>(null);
let live = $state<readonly LiveWatch[]>([]);
let now = $state(new Date());
let profileAsked = false;
let checkedAt = 0;

const shown = $derived(
  profile ? { ...user, coverUrl: profile.coverUrl ?? user.coverUrl, vip: profile.vip ?? user.vip } : user,
);
const followed = $derived(followedWatch !== undefined);
const watches = $derived(followedWatch === undefined ? live : [followedWatch].filter((found) => found !== null));
const watch = $derived(liveTiles(watches, now).at(0) ?? null);

$effect(() => {
  if (!visible) return;

  if (!profileAsked && user.vip) {
    profileAsked = true;
    void fetchNetworkProfile({ get, slug: user.slug }).then((found) => (profile = found)).catch(() => {});
  }

  const clock = setInterval(() => (now = new Date()), CLOCK_MS);
  return () => clearInterval(clock);
});

$effect(() => {
  if (!visible || pending || followed) return;

  const member = {
    key: user.username,
    name: user.displayName,
    slug: user.slug,
    href: `/users/${user.slug}`,
    avatar: user.avatarUrl,
  };
  const stop = pollWatching({
    load: () => {
      if (Date.now() - checkedAt < RECHECK_MS) return Promise.resolve(untrack(() => live));
      checkedAt = Date.now();
      return fetchWatching({ get, members: [member] });
    },
    onupdate: (value) => {
      live = value;
      now = new Date();
    },
  });
  return stop;
});
</script>

<div class="network-card" {@attach inViewport((inView) => (visible = inView))}>
  <UserCard user={shown} veteran={extra?.veteran} since={extra?.since} {relation} {pending} {canFollow}
    {watch} />
</div>

<style>
.network-card {
  block-size: 100%;
}
</style>
