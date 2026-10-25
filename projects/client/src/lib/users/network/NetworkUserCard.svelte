<!--
  A network page user card that fills itself in once it's on screen. The list leaves out VIP covers and the OG and
  years on the VIP label, so a VIP's card asks their profile for them, once. It also asks what they're watching, then
  again every 2 minutes while the card is on screen and the tab is visible, and turns live in place when they are.
  Scrolling back to a card checked in the last 2 minutes asks nothing.
    <NetworkUserCard {user} {relation} canFollow={data.canFollow} />
-->
<script lang="ts">
import { untrack } from 'svelte';
import { apiQueue } from '$lib/api/apiQueue';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import UserCard from '$lib/components/users/UserCard.svelte';
import { fetchWatching, type LiveWatch } from '$lib/dashboard/fetchWatching';
import { liveTiles } from '$lib/dashboard/liveTiles';
import { pollWatching } from '$lib/dashboard/pollWatching';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import { inViewport } from '$lib/utils/inViewport';
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
}

const { user, extra, relation = null, pending = false, canFollow = true }: Props = $props();

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
const watch = $derived(liveTiles(live, now).at(0) ?? null);

$effect(() => {
  if (!visible) return;

  if (!profileAsked && user.vip) {
    profileAsked = true;
    void fetchNetworkProfile({ get, slug: user.slug }).then((found) => (profile = found)).catch(() => {});
  }

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
  const clock = setInterval(() => (now = new Date()), CLOCK_MS);

  return () => {
    stop();
    clearInterval(clock);
  };
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
