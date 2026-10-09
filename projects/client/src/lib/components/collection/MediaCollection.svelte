<script lang="ts">
import { episodeBatchState } from '$lib/components/history/episodeBatchState';
import { page } from '$app/state';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { login } from '$lib/auth/login';
import { userManager } from '$lib/auth/userManager';
import { overlay } from '$lib/overlay/overlay';
import { toast } from '$lib/components/toast/toast.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import { loadWatchEpisodes } from '$lib/components/history/loadWatchEpisodes';
import type { WatchTarget } from '$lib/components/history/WatchTarget';
import CollectionLogos from '$lib/components/collection/CollectionLogos.svelte';
import { collectionBadges } from '$lib/components/collection/collectionBadges';
import CollectionMetadataFields from '$lib/components/collection/CollectionMetadataFields.svelte';
import type { CollectionMetadata } from '$lib/components/collection/CollectionMetadata';
import { collectMedia } from '$lib/components/collection/collectMedia';
import { collectionMetadataLabel } from '$lib/components/collection/collectionMetadataLabel';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import collection from '$lib/icons/trakt/collection.svg?raw';
import collectionThick from '$lib/icons/trakt/collection-thick.svg?raw';
import { formatDate } from '$lib/utils/formatDate';

interface Props {
  target: WatchTarget;
  variant?: 'summary' | 'card';
  small?: boolean;
  onremove?: () => void;
  /** After a save goes through, with its date (`null` for a removal, left out for metadata only). */
  onsave?: (collectedAt: string | null | undefined) => void;
}
const { target, variant = 'card', small = false, onremove, onsave }: Props = $props();
let busy = $state(false);
let draft = $state<CollectionMetadata | undefined>();
// A grouped calendar card counts just its own episodes.
const viewerState = $derived(
  target.onlyEpisodeIds && target.season
    ? episodeBatchState(target.onlyEpisodeIds.map((id) => overlay.state('episode', id, target.season)))
    : overlay.state(target.type, target.id, target.season),
);
const dates = $derived(page.data.datePreferences);
const fill = $derived(
  quickIconFill({
    state: viewerState,
    airedEpisodes: target.airedEpisodes,
    season: target.type === 'season',
    datePreferences: dates,
  }),
);
const plural = $derived(target.type === 'show' || target.type === 'season');
const label = $derived(
  fill.collected > 0 ? plural ? `${Math.floor(fill.collected * 100)}% in library` : 'In Library' : 'Add to library',
);
const percent = $derived(plural && fill.collected > 0 ? `${Math.floor(fill.collected * 100)}%` : undefined);
const metadataText = $derived(collectionMetadataLabel(viewerState.collectionMetadata));
const collectedDate = $derived(
  viewerState.collectedAt?.startsWith('1970-01-01')
    ? 'Unknown date'
    : viewerState.collectedAt && formatDate(viewerState.collectedAt, { ...dates, time: true }),
);
const detail = $derived(plural ? `${viewerState.collectedEpisodes}/${target.airedEpisodes} episodes` : collectedDate);
const badges = $derived(collectionBadges(viewerState.collectionMetadata));
const request = (path: string, body?: unknown) =>
  rawApiFetch({
    fetch: path.startsWith('/search/') ? globalThis.fetch : authenticatedFetch({ manager: userManager() }),
    path,
    init: body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });
async function collect(collectedAt: string | null | undefined, force = false) {
  if (busy) return;
  busy = true;
  try {
    const saved = await collectMedia({
      target,
      collectedAt,
      metadata: draft,
      force,
      overlay,
      request,
      notify: toast,
      episodes: () =>
        loadWatchEpisodes({ target, fetch: authenticatedFetch({ manager: userManager() }), progress: 'collection' }),
    });
    if (saved && collectedAt === null) onremove?.();
    if (saved) onsave?.(collectedAt);
  } finally {
    busy = false;
  }
}
async function open(force: boolean): Promise<'date' | 'remove' | 'partial' | null> {
  if (!(await userManager().getUser())?.access_token) {
    await login();
    return null;
  }
  draft = viewerState.collectionMetadata;
  return onremove && !force
    ? 'remove'
    : force || fill.collected === 0
    ? 'date'
    : fill.collected >= 1
    ? 'remove'
    : 'partial';
}
</script>

<!-- Library routes use the same viewer alias as history. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<WatchPopover collection hasMetadata={Object.values(draft ?? {}).some(Boolean)} {variant} {small} {busy} {plural}
  label={onremove ? 'Remove from library' : label} fill={onremove ? 1 : fill.collected} datePreferences={dates}
  tooltip={onremove ? 'Remove from library' : variant === 'card' ? fill.titles.collected ?? 'Add to library' : undefined}
  onopen={open} onwatch={collect} onremaining={() => Promise.resolve(false)}
  oninvalid={() => toast.error('Invalid date format, please use the date picker.')}
  summary={{ icon: collection, text: percent ? 'in library' : label, percent, detail: fill.collected > 0 ? detail : undefined, aside: badges && fill.collected > 0 ? logos : undefined, tooltip: fill.collected > 0 ? metadataText || undefined : undefined }}>
  {#snippet trigger()}<span class="trakt-glyph"><Icon svg={collectionThick} /></span>{/snippet}
  {#snippet metadata(done, saving)}
    <CollectionMetadataFields value={draft ?? {}} {saving} onsave={(value) => { draft = value; done(); if (saving) void collect(undefined); }} />
  {/snippet}
</WatchPopover>
{#snippet logos()}{#if badges}<CollectionLogos {badges} />{/if}{/snippet}
{#if variant === 'summary' && plural && fill.collected > 0 && target.airedEpisodes}
  <Tooltip text={fill.titles.collected} placement="bottom">
    {#snippet trigger(tip)}
      <a class="collection-progress" href="/users/me/library" aria-label={fill.titles.collected} {...tip}>
        {#each Array.from({ length: target.airedEpisodes ?? 0 }) as _, index (index)}<span class:done={index < (viewerState.collectedEpisodes ?? 0)}></span>{/each}
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
.collection-progress {
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
    background: var(--brand-quaternary);
  }
}
</style>
