<!--
  The list's likes count doubles as OG's like toggle. Whether the viewer liked it comes from the overlay's liked lists;
  until that loads, a first click likes. `button` draws it as a list row's outlined button: a blue thumb and
  "123 likes", solid blue once liked. Its word is a `.count-text`, like ListCount's, so a tight row can hide both.
-->
<script lang="ts">
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { changeListLike } from '$lib/components/lists/changeListLike';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import { overlay } from '$lib/overlay/overlay';
import voteYes from '$lib/icons/regular/thumbs-up.svg?raw';
import voteYesThick from '$lib/icons/solid/thumbs-up.svg?raw';

interface Props {
  id: number;
  ownerSlug?: string;
  viewer: string | null;
  count: number;
  words?: boolean;
  button?: boolean;
}
const { id, ownerSlug, viewer, count, words = false, button = false }: Props = $props();
const liked = $derived(viewer ? overlay.slices().likedLists?.has(id) : undefined);
let delta = $state(0);
let busy = $state(false);
const scope = $derived(`${viewer}:${ownerSlug}:${id}:${count}`);
$effect(() => {
  void scope;
  delta = 0;
  busy = false;
});
const total = $derived(Math.max(0, count + delta));
const label = $derived(
  `${liked ? 'Unlike' : 'Like'} this list: ${total.toLocaleString('en-US')} ${total === 1 ? 'like' : 'likes'}`,
);
const withLike = (ids: ReadonlySet<number>, on: boolean): ReadonlySet<number> =>
  new Set(on ? [...ids, id] : [...ids].filter((value) => value !== id));
async function toggle() {
  if (busy) return;
  if (!viewer) {
    location.assign('/login');
    return;
  }
  const key = scope;
  busy = true;
  await changeListLike({
    fetch: authenticatedFetch({ manager: userManager() }),
    id,
    ownerSlug,
    liked: !liked,
    patch: () => {
      const next = !liked;
      const before = delta;
      delta += next ? 1 : -1;
      // An unknown slice starts from this like alone; the next activities check fetches the rest.
      const rollback = overlay.patch('likedLists', (ids) => withLike(ids, next), new Set());
      return () => {
        rollback();
        if (scope === key) delta = before;
      };
    },
    notify: (message) => {
      if (scope === key) toast.error(message);
    },
  });
  if (scope === key) busy = false;
}
</script>

{#if button}
  <Tooltip text={liked ? 'Unlike this list' : 'Like this list'}>
    {#snippet trigger(tooltip)}
      <GlassAction glass={!liked} card color={liked ? 'var(--color-list-card-like)' : undefined} selected={liked}
        iconColor={liked ? undefined : 'var(--color-list-card-like)'}
        icon={liked ? voteYesThick : voteYes} aria-label={label} aria-pressed={liked === undefined ? undefined : liked}
        aria-disabled={busy} onclick={toggle} {...tooltip}>
        <span><span class="number">{total.toLocaleString('en-US')}</span><span class="count-text">&nbsp;{total === 1 ? 'like' : 'likes'}</span></span>
      </GlassAction>
    {/snippet}
  </Tooltip>
{:else}
  <Tooltip text="Likes">
    {#snippet trigger(tooltip)}
      <button type="button" class="like" aria-label={label}
        aria-pressed={liked === undefined ? undefined : liked} aria-busy={busy} aria-disabled={busy} onclick={toggle} {...tooltip}>
        <span class="icon"><Icon svg={liked ? voteYesThick : voteYes} /></span><strong>{total.toLocaleString('en-US')}</strong>
        {#if words}<span class="words"> {total === 1 ? 'like' : 'likes'}</span>{/if}
      </button>
    {/snippet}
  </Tooltip>
{/if}

<style>
.like {
  display: inline-flex;
  align-items: center;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-stat-noun);
  font: inherit;
  text-transform: inherit;
  white-space: nowrap;

  &:is(:hover, :focus-visible) strong {
    color: var(--color-stat-count);
  }
}
strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}
.number {
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
}
.words {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.icon {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;
}
</style>
