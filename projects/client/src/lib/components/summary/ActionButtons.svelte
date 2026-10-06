<!--
  The button stack to the right of a summary's overview: check in, history, library, watchlist, favorites, comment,
  each a `SummaryAction`. History, library, lists and favorites use shared optimistic controls; the rest stay idle.
  The phone Watch Now button sits above them (`WatchNow` with `phone`).
-->
<script lang="ts">
import { page } from '$app/state';
import { checkin as checkinModal } from '$lib/components/checkin/checkin.svelte';
import type { CheckinTarget } from '$lib/components/checkin/CheckinTarget';
import { newComment } from '$lib/components/comments/newComment.svelte';
import MediaFavorite from '$lib/components/favorites/MediaFavorite.svelte';
import type { FavoriteTarget } from '$lib/favorites/FavoriteTarget';
import MediaCollection from '$lib/components/collection/MediaCollection.svelte';
import MediaWatch from '$lib/components/history/MediaWatch.svelte';
import type { WatchTarget } from '$lib/components/history/WatchTarget';
import MediaList from '$lib/components/lists/MediaList.svelte';
import type { ListTarget } from '$lib/components/lists/ListTarget';
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import SummaryActionTile from '$lib/components/summary/SummaryActionTile.svelte';
import circlePlus from '$lib/icons/light/circle-plus.svg?raw';
import star from '$lib/icons/thin/star.svg?raw';
import filledStar from '$lib/icons/solid/star.svg?raw';
import check from '$lib/icons/trakt/check.svg?raw';
import collection from '$lib/icons/trakt/collection.svg?raw';
import comment from '$lib/icons/trakt/comment.svg?raw';
import list from '$lib/icons/trakt/list.svg?raw';
import trakt from '$lib/icons/trakt/trakt-v2.svg?raw';

interface Props {
  /** Movies and episodes. */
  checkin?: Pick<CheckinTarget, 'type' | 'id'>;
  /** Movies and shows. */
  favorites?: boolean;
  favoriteTarget?: FavoriteTarget;
  comment?: boolean;
  /** Off on person pages, which had progress buttons in their place. */
  history?: boolean;
  historyTarget?: WatchTarget;
  library?: boolean;
  /** Read-only progress on person credits, counting complete visible items. */
  progress?: { watched: number; collected: number; visible: number; total: number };
  /** Off on person pages: people can't be added to lists. */
  list?: boolean;
  listTarget?: ListTarget;
}

const {
  checkin,
  favorites = false,
  favoriteTarget,
  comment: commentable = true,
  history = true,
  historyTarget,
  library = true,
  progress,
  list: listable = true,
  listTarget,
}: Props = $props();

let opening = $state(false);
async function openCheckin(item: Pick<CheckinTarget, 'type' | 'id'>) {
  if (opening) return;
  opening = true;
  await checkinModal.open(item).finally(() => (opening = false));
}

// Logged out, "Add comment" signs in and comes back. Banned from commenting, it's gone (the page has no form).
const signIn = $derived(`/auth/signin?${new URLSearchParams({ redirect_to: page.url.pathname })}`);

const buttons = $derived(
  [
    checkin !== undefined && { kind: 'checkin', icon: trakt, label: 'Check In', color: 'var(--brand-primary)' },
    history &&
    {
      kind: 'watch',
      icon: check,
      label: 'Add to history',
      color: 'var(--brand-tertiary)',
      side: 'Pick a watched date',
    },
    library &&
    {
      kind: 'collect',
      icon: collection,
      label: 'Add to library',
      color: 'var(--brand-quaternary)',
      side: 'Pick a library date',
    },
    listable &&
    { kind: 'list', icon: list, label: 'Add to watchlist', color: 'var(--brand-secondary)', side: 'Pick a list' },
    favorites && { kind: 'favorites', icon: star, label: 'Add to favorites', color: 'var(--brand-seventh)' },
    commentable && { kind: 'comment', icon: comment, label: 'Add comment', color: 'var(--brand-sixth)' },
  ].filter((button) => button !== false),
);
const percentOf = (count: number) => `${progress?.visible ? Math.trunc(count / progress.visible * 100) : 0}%`;
</script>

<div class="action-buttons">
  {#if progress}
    {#each [['watch', check, progress.watched, 'watched', 'var(--brand-tertiary)'], ['collect', collection, progress.collected, 'in library', 'var(--brand-quaternary)']] as const as [kind, icon, count, label, color] (kind)}
      <SummaryAction readonly {color} {icon} percent={percentOf(count)} text={label} selected={count > 0}
        detail="{count}/{progress.total} {progress.total === 1 ? 'item' : 'items'}" />
    {/each}
  {/if}
  {#each buttons as { kind, icon, label, color, side } (kind)}
    {#if kind === 'watch' && historyTarget}
      <div class="stacked"><MediaWatch target={historyTarget} variant="summary" /></div>
    {:else if kind === 'collect' && historyTarget}
      <div class="stacked"><MediaCollection target={historyTarget} variant="summary" /></div>
    {:else if kind === 'list' && listTarget}
      <MediaList target={listTarget} variant="summary" />
    {:else if kind === 'favorites' && favoriteTarget}
      <MediaFavorite target={favoriteTarget}>
        {#snippet trigger({ selected, date, busy, toggle })}
          <SummaryAction {color} icon={selected ? filledStar : icon} text={selected ? date ? 'Favorited on' : 'Favorited' : label}
            detail={selected ? date : undefined} {selected} busy={busy ? 'Saving favorite' : undefined} aria-pressed={selected}
            aria-label={selected ? 'Remove from favorites' : label} aria-busy={busy} aria-disabled={busy} onclick={toggle} />
        {/snippet}
      </MediaFavorite>
    {:else if kind === 'checkin' && checkin}
      <SummaryAction {color} {icon} text={label} selected busy={opening ? 'Opening check in' : undefined} aria-haspopup="dialog"
        aria-busy={opening} onclick={() => openCheckin(checkin)} />
    {:else if kind === 'comment'}
      {#if !page.data.settings}
        <SummaryAction {color} {icon} text={label} href={signIn} />
      {:else if page.data.settings.permissions?.commenting}
        <SummaryAction {color} {icon} text={label} aria-controls="new-comment" aria-expanded={newComment.visible}
          onclick={(event) => newComment.open(event.currentTarget)} />
      {/if}
    {:else}
      <SummaryAction {color} {icon} text={label} aria-disabled="true">
        {#snippet tiles()}{#if side}<SummaryActionTile icon={circlePlus} label={side} aria-disabled="true" />{/if}{/snippet}
      </SummaryAction>
    {/if}
  {/each}
</div>

<style>
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--summary-action-stack-gap);
}
</style>
