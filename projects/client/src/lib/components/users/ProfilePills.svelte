<!--
  A user's glass pills, as the profile header lines them up under the name: private status first in amber, then
  location, gender and age, and the year they joined. The header shows them on the cover, the network page's user cards
  under the name without the join year, and with the Private pill left to the card's cover.
    <ProfilePills {user} />
    <ProfilePills {user} withPrivate={false} withJoined={false} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import lock from '$lib/icons/regular/lock.svg?raw';
import genderless from '$lib/icons/solid/genderless.svg?raw';
import locationPin from '$lib/icons/solid/location-pin.svg?raw';
import mars from '$lib/icons/solid/mars.svg?raw';
import venus from '$lib/icons/solid/venus.svg?raw';
import type { ProfileUser } from '$lib/users/ProfileUser';
import CoverPill from './CoverPill.svelte';

interface Props {
  user: ProfileUser;
  withPrivate?: boolean;
  withJoined?: boolean;
}

const { user, withPrivate = true, withJoined = true }: Props = $props();
const genderIcons = { mars, venus, genderless };
</script>

<div class="pills">
  {#if withPrivate && user.isPrivate}<CoverPill tone="private"><Icon svg={lock} />Private</CoverPill>{/if}
  <CoverPill><Icon svg={locationPin} />{user.location}</CoverPill>
  <CoverPill title={user.gender.title}>
    <Icon svg={genderIcons[user.gender.icon]} label={user.gender.title} />
    {#if user.age !== null}<b title="Age">{user.age}</b>{/if}
  </CoverPill>
  {#if withJoined && user.joinedAt}
    <CoverPill>
      <Icon svg={calendar} />Joined <b>{new Date(user.joinedAt).getUTCFullYear()}</b>
    </CoverPill>
  {/if}
</div>

<style>
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--profile-pill-gap);
}
</style>
