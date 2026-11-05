<!--
  The taste match pill on someone else's profile cover (MatchBadge as a button). It opens the breakdown dialog, which
  mounts on the first click.
    <MatchPill {match} owner={user} />
-->
<script lang="ts">
import type { UserMatch } from '#lib/users/match/UserMatch.ts';
import type { FavoriteCard } from '#lib/users/profile/toProfileSummary.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import MatchBadge from './MatchBadge.svelte';
import MatchDialog from './MatchDialog.svelte';

interface Props {
  match: UserMatch;
  owner: Pick<ProfileUser, 'slug' | 'firstName' | 'avatarUrl' | 'coverUrl'>;
  /** Sample posters for a demo. Left out, the dialog reads the owner's favorites. */
  loadFavorites?: () => Promise<readonly FavoriteCard[]>;
}

const { match, owner, loadFavorites }: Props = $props();
let open = $state(false);
let opened = $state(false);
</script>

<MatchBadge
  {match}
  onclick={() => {
    opened = true;
    open = true;
  }}
/>

{#if opened}<MatchDialog bind:open {match} {owner} {loadFavorites} />{/if}
