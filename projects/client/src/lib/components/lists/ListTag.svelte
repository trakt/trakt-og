<!--
  A list's tag, tinted in its color with its icon. `tag` is the list's status: Private, Following (friends only),
  Official List, Smart, the blue Link of a list shared by link, and Me on the viewer's own list away from their lists
  page. `relation` is how the viewer knows its owner, as on comments: Friend, or Following one way. A list row shows
  them across from its name, and a list page beside its title.
    <ListTag tag="Private" />
    <ListTag relation="friend" />
-->
<script lang="ts">
import CommentTag from '#lib/components/comments/CommentTag.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import link from '#lib/icons/solid/link.svg?raw';
import listIcon from '#lib/icons/regular/list.svg?raw';
import lock from '#lib/icons/regular/lock.svg?raw';
import user from '#lib/icons/regular/user.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import sparkles from '#lib/icons/solid/sparkles.svg?raw';
import traktIcon from '#lib/icons/trakt/trakt-v2.svg?raw';

type Props = { tag: string; relation?: never } | { relation: 'friend' | 'following'; tag?: never };

const { tag, relation }: Props = $props();

const TAGS: Record<string, { color: string; svg: string; tip?: string }> = {
  Private: { color: 'var(--color-list-chip-private)', svg: lock },
  'Official List': { color: 'var(--color-list-chip-official)', svg: traktIcon },
  Following: { color: 'var(--color-list-chip-following)', svg: userGroup },
  Smart: { color: 'var(--color-list-chip-smart)', svg: sparkles },
  Link: { color: 'var(--color-list-chip-link)', svg: link, tip: 'Anyone with this link can view the list' },
  Me: { color: 'var(--color-list-chip-mine)', svg: user, tip: 'Your list' },
};
const shown = $derived(TAGS[tag ?? ''] ?? { color: 'var(--color-list-chip-following)', svg: listIcon });
</script>

{#if relation}
  <CommentTag svg={relation === 'friend' ? userGroup : user} tone={relation} tint>
    {relation === 'friend' ? 'Friend' : 'Following'}
  </CommentTag>
{:else}
  <Tooltip text={shown.tip}>
    {#snippet trigger(tooltip)}<CommentTag svg={shown.svg} color={shown.color} tint {...tooltip}>{tag}</CommentTag>{/snippet}
  </Tooltip>
{/if}
