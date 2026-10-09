<script lang="ts">
import { page } from '$app/state';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { login } from '$lib/auth/login';
import { userManager } from '$lib/auth/userManager';
import { overlay } from '$lib/overlay/overlay';
import { checkin } from '$lib/components/checkin/checkin.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import lightBackward from '$lib/icons/light/backward.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import historyIcon from '$lib/icons/light/clock-rotate-left.svg?raw';
import BulkWatchConfirm from '$lib/components/history/BulkWatchConfirm.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import { loadWatchEpisodes } from '$lib/components/history/loadWatchEpisodes';
import { watchMedia } from '$lib/components/history/watchMedia';
import { watchAction } from '$lib/components/history/watchAction';
import type { HistoryPlay } from '$lib/components/history/HistoryPlay';
import type { WatchTarget } from '$lib/components/history/WatchTarget';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import backward from '$lib/icons/solid/backward.svg?raw';
import { countLabel } from '$lib/utils/countLabel';
import { formatDate } from '$lib/utils/formatDate';
import { formatRuntime } from '$lib/utils/formatRuntime';

interface Props {
  target: WatchTarget;
  variant?: 'summary' | 'card';
  small?: boolean;
  play?: HistoryPlay;
  onremove?: (play?: HistoryPlay) => void;
  onsave?: (watchedAt: string | null) => void;
}
const { target, variant = 'card', small = false, play, onremove, onsave }: Props = $props();
let busy = $state(false);
let bulkConfirm = $state<BulkWatchConfirm>();
const viewerState = $derived(overlay.state(target.type, target.id, target.season));
const dates = $derived(page.data.datePreferences);
const rewatching = $derived(
  viewerState.rewatching && page.data.settings?.browsing?.rewatching?.adjust_percentage !== false,
);
const completed = $derived(
  rewatching ? viewerState.rewatchedEpisodes ?? viewerState.watchedEpisodes : viewerState.watchedEpisodes,
);
const plays = $derived(rewatching ? viewerState.rewatchedPlays ?? viewerState.watchedPlays : viewerState.watchedPlays);
const fill = $derived(
  quickIconFill({
    state: viewerState,
    adjustRewatching: page.data.settings?.browsing?.rewatching?.adjust_percentage,
    airedEpisodes: target.airedEpisodes,
    runtime: target.runtime,
    datePreferences: dates,
  }),
);
const plural = $derived(target.type === 'show' || target.type === 'season');
const ticks = $derived(
  Array.from(
    { length: target.airedEpisodes ?? 0 },
    (_, index) => target.episodeIds?.length === target.airedEpisodes ? target.episodeIds?.at(index) : undefined,
  ),
);
const defaultAt = $derived(page.data.settings?.browsing?.watch_popup_action);
const { type, id } = $derived(target);
const oncheckin = $derived(
  variant === 'card' && (type === 'movie' || type === 'episode') && !page.data.settings?.browsing?.hide_watching_now
    ? () => void checkin.open({ type, id })
    : undefined,
);
const historyHref = $derived(
  `/users/me/history${
    target.type === 'movie'
      ? `?movie=${target.id}`
      : target.type === 'episode'
      ? `?episode=${target.id}`
      : target.type === 'season'
      ? `/episodes?season=${target.id}`
      : `/episodes?show=${target.id}`
  }`,
);
const label = $derived(
  (fill.watched > 0 || rewatching)
    ? plural
      ? `${Math.floor(fill.watched * 100)}% ${rewatching ? 'rewatched' : 'watched'}`
      : countLabel(viewerState.plays ?? 1, 'play')
    : 'Add to history',
);
const started = $derived(fill.watched > 0 || Boolean(rewatching));
const percent = $derived(plural && started ? `${Math.floor(fill.watched * 100)}%` : undefined);
const hasHistory = $derived((viewerState.watchedEpisodes ?? 0) > 0 || fill.watched > 0);
const showActions = $derived(
  target.type === 'show' && (viewerState.watchedEpisodes ?? 0) > 0 && Boolean(page.data.user),
);
const dropped = $derived(target.type === 'show' && Boolean(viewerState.dropped));
const request = (path: string, body?: unknown) =>
  rawApiFetch({
    fetch: path.startsWith('/search/') ? globalThis.fetch : authenticatedFetch({ manager: userManager() }),
    path,
    init: body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });
async function watch(watchedAt: string | null, force: boolean, onlyPlay?: HistoryPlay) {
  if (busy) return;
  busy = true;
  try {
    const saved = await watchMedia({
      target,
      watchedAt,
      play: onlyPlay,
      force,
      overlay,
      request,
      notify: toast,
      episodes: () => loadWatchEpisodes({ target, fetch: authenticatedFetch({ manager: userManager() }) }),
      confirm: (count) => bulkConfirm?.ask({ count, title: target.title }) ?? Promise.resolve(false),
    });
    if (saved && watchedAt === null) onremove?.(onlyPlay);
    if (saved) onsave?.(watchedAt);
    if (saved) void overlay.refresh();
  } finally {
    busy = false;
  }
}
async function remaining() {
  if (!['now', 'released', 'unknown'].includes(defaultAt ?? '')) return false;
  await watch(defaultAt ?? 'now', false);
  return true;
}
async function open(force: boolean): Promise<'date' | 'remove' | 'partial' | null> {
  if (!(await userManager().getUser())?.access_token) {
    await login();
    return null;
  }
  const action = watchAction({ fill: onremove ? 1 : fill.watched, force, defaultAt });
  if (action === 'date' || action === 'remove' || action === 'partial') return action;
  await watch(action, false);
  return null;
}
</script>

<!-- Filtered history routes are built from media ids. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<WatchPopover label={onremove ? 'Remove from history' : variant === 'summary' ? label : 'Add to watched history'}
  {variant} {small} {busy} {plural}
  fill={onremove ? 1 : fill.watched} selected={Boolean(onremove) || started}
  datePreferences={dates}
  tooltip={onremove ? 'Remove from history' : variant === 'card' ? fill.titles.watched ?? 'Add to watched history' : undefined}
  summary={{ icon: check, text: percent ? rewatching ? 'rewatched' : 'watched' : label, percent, detail: started ? detail : undefined }}
  more={hasHistory || dropped ? more : undefined}
  onremovePlay={play && onremove ? () => void watch(null, false, play) : undefined}
  onopen={open} onwatch={watch} onremaining={remaining} {oncheckin}
  oninvalid={() => toast.error('Invalid date format, please use the date picker.')}>
  {#snippet trigger()}
    {#if viewerState.rewatching}<Icon svg={backward} />{:else}<span class="trakt-glyph"><Icon svg={checkThick} /></span>{/if}
  {/snippet}
</WatchPopover>
{#if plural}<BulkWatchConfirm bind:this={bulkConfirm} />{/if}
{#snippet detail()}
  {#if plural}{completed}/{target.airedEpisodes} eps &mdash; {countLabel(plays ?? 0, 'play')}{#if target.runtime} <em>({formatRuntime((plays ?? 0) * target.runtime)})</em>{/if}
  {:else if viewerState.lastWatchedAt}{viewerState.lastWatchedAt.startsWith('1970-01-01') ? 'Unknown date' : formatDate(viewerState.lastWatchedAt, { ...dates, time: true })}{/if}
{/snippet}
{#snippet more()}
  <SummaryActionMenu>
    {#snippet children(close)}
      {#if hasHistory}<a href={historyHref}><Icon svg={historyIcon} fixedWidth />View history</a>{/if}
      {#if (showActions || dropped) && hasHistory}<hr />{/if}
      {#if showActions}
        <VisibilityControl target={{ ...target, type: 'show' }} action="rewatch" variant="menu" onsaving={close}>
          <Icon svg={lightBackward} fixedWidth />Rewatch this show
        </VisibilityControl>
      {/if}
      {#if dropped}
        <VisibilityControl target={{ ...target, type: 'show' }} action="restore" variant="menu" onsaving={close}>
          <Icon svg={circleMinus} fixedWidth />Restore this show{#if viewerState.droppedAt}<em>, dropped {formatDate(viewerState.droppedAt, dates)}</em>{/if}
        </VisibilityControl>
      {:else if showActions}
        <VisibilityControl target={{ ...target, type: 'show' }} action="drop" variant="menu" onsaving={close}>
          <Icon svg={circleMinus} fixedWidth />Drop this show
        </VisibilityControl>
      {/if}
    {/snippet}
  </SummaryActionMenu>
{/snippet}
{#if variant === 'summary' && plural && started && target.airedEpisodes}
  <Tooltip text={fill.titles.watched} placement="bottom">
    {#snippet trigger(tip)}
      <a class="watch-progress" href={historyHref} aria-label={fill.titles.watched} {...tip}>
        {#each ticks as id, index (index)}<span class:done={id === undefined ? index < (completed ?? 0) : rewatching && viewerState.rewatchingAt ? (overlay.state('episode', id).lastWatchedAt ?? '') >= viewerState.rewatchingAt : overlay.state('episode', id).watched}></span>{/each}
      </a>
    {/snippet}
  </Tooltip>
{/if}

<style>
/* Centers the Trakt-font glyph in the quick-icon bar without adding a box around it. */
.trakt-glyph {
  display: contents;
  --icon-shift: var(--quick-icon-trakt-shift);
}
.watch-progress {
  display: flex;
  block-size: var(--watch-progress-height);
  margin-block-start: var(--watch-progress-gap);
  overflow: hidden;
  border-radius: var(--radius-watch-progress);
  background: var(--color-watch-progress-track);
  & span {
    flex: 1;
  }
  & .done {
    background: var(--brand-tertiary);
  }
}
</style>
