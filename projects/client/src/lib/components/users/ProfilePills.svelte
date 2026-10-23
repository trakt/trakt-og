<!--
  A user's glass pills, as the profile header lines them up under the name: private status first in amber, then
  location, and the year they joined.
    <ProfilePills {user} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import lock from '$lib/icons/regular/lock.svg?raw';
import locationPin from '$lib/icons/solid/location-pin.svg?raw';
import type { ProfileUser } from '$lib/users/ProfileUser';
import CoverPill from './CoverPill.svelte';

interface Props {
  user: ProfileUser;
}

const { user }: Props = $props();
</script>

<div class="pills">
  {#if user.isPrivate}<CoverPill tone="private"><Icon svg={lock} />Private</CoverPill>{/if}
  <CoverPill><Icon svg={locationPin} /><b>{user.location}</b></CoverPill>
  {#if user.joinedAt}
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
