<!--
  A user's glass pills, as the profile header lines them up under the name: private status first in amber, then
  location, the year they joined, and the viewer's taste match once it streams in (nothing holds its place, since
  most reasons to skip it, like too little history, only show once it loads).
    <ProfilePills {user} {match} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import lock from '$lib/icons/regular/lock.svg?raw';
import locationPin from '$lib/icons/solid/location-pin.svg?raw';
import type { UserMatch } from '$lib/users/match/UserMatch';
import type { ProfileUser } from '$lib/users/ProfileUser';
import CoverPill from './CoverPill.svelte';
import MatchPill from './MatchPill.svelte';

interface Props {
  user: ProfileUser;
  /** The viewer's taste match with someone else. Null for yourself, signed out, or a Standard app. */
  match?: Promise<UserMatch | null> | null;
}

const { user, match = null }: Props = $props();
</script>

<div class="pills">
  {#if user.isPrivate}<CoverPill tone="private"><Icon svg={lock} />Private</CoverPill>{/if}
  <CoverPill><Icon svg={locationPin} /><b>{user.location}</b></CoverPill>
  {#if user.joinedAt}
    <CoverPill>
      <Icon svg={calendar} />Joined <b>{new Date(user.joinedAt).getUTCFullYear()}</b>
    </CoverPill>
  {/if}
  {#if match}
    {#await match then value}
      {#if value}<MatchPill match={value} owner={user} />{/if}
    {/await}
  {/if}
</div>

<style>
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--profile-pill-gap);
}
</style>
