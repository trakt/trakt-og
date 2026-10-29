<!--
  OG's on-deck card: a show's next episode as a poster card with the progress bar under its quick icons, the episode
  as the title, then the show's title. The dashboard's Up Next panel and the progress page's grid view both use it.
  The quick icons' ••• holds Watch Now, and for a show still in progress Rewatch and Drop through the shared prompts.
  Dashboard callbacks refresh the card after saves. While `loading`, the Trakt loader covers the poster.
-->
<script lang="ts">
import { page } from '$app/state';
import { overlay } from '$lib/overlay/overlay';
import type { OverlayState } from '$lib/overlay/createOverlay.svelte';
import { formatDate } from '$lib/utils/formatDate';
import type { OnDeckItem } from '$lib/components/media/OnDeckItem';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import RefreshCover from '$lib/components/media/RefreshCover.svelte';
import TraktLoader from '$lib/components/loading/TraktLoader.svelte';
import { progressPercent } from '$lib/components/media/progressPercent';
import { progressTooltip } from '$lib/components/media/progressTooltip';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import UnderProgress from '$lib/components/media/UnderProgress.svelte';
import type { QuickIconMore } from '$lib/components/media/QuickIconMore';

interface Props {
  item: OnDeckItem;
  /** The viewer's overlay state for the episode. */
  state?: OverlayState;
  onRewatch?: () => void;
  onWatchSave?: (watchedAt: string | null) => void;
  onRefresh?: () => void;
  needsRefresh?: boolean;
  refreshing?: boolean;
  /** The next episode is on its way: an opaque cover with the loader over the poster. */
  loading?: boolean;
  /** PosterCard's `framed`: rounded, with the quick icons on their own panel. On unless set to false. */
  framed?: boolean;
}

const {
  item,
  state = {},
  onRewatch,
  onWatchSave,
  onRefresh,
  needsRefresh = false,
  refreshing = false,
  loading = false,
  framed = true,
}: Props = $props();
const target = $derived({
  type: 'episode' as const,
  id: item.episodeId,
  title: item.showTitle + ' ' + item.episodeNumber,
  season: item.seasonNumber === undefined || item.episode === undefined
    ? undefined
    : { show: item.showId, number: item.seasonNumber, episode: item.episode },
  runtime: item.runtime,
});
const showTarget = $derived({
  type: 'show' as const,
  id: item.showId,
  title: item.showTitle,
  airedEpisodes: item.progress.aired,
  runtime: item.runtime,
});

const more = $derived<QuickIconMore[]>(
  item.complete ? [{ kind: 'watch-now' }] : [
    { kind: 'watch-now' },
    { kind: 'rewatch', target: showTarget, onsave: onRewatch },
    { kind: 'drop', target: showTarget },
  ],
);

// The card's own state is the episode's; the rewatch date is the show's, from the overlay's cached slice.
const rewatchingAt = $derived(overlay.state('show', item.showId).rewatchingAt);
const title = $derived(item.episodeTitle ? `${item.episodeNumber} ${item.episodeTitle}` : item.episodeNumber);
const tip = $derived(
  progressTooltip({ progress: item.progress, fullProgress: item.fullProgress, runtime: item.runtime }),
);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="on-deck-card" aria-busy={refreshing || loading}>
  <PosterCard
    {framed}
    href={item.complete ? item.showHref : item.episodeHref}
    title={item.complete ? item.showTitle : title}
    fullTitle={item.complete ? item.showTitle : `${item.showTitle} ${item.episodeNumber}`}
    image={item.poster}
    episodeBadge={item.complete ? undefined : item.episodeBadge}
    rewatching={item.rewatching}
    rewatchingSince={rewatchingAt ? formatDate(rewatchingAt, page.data.datePreferences) : undefined}
    userRating={state.rating}
    icons={{ listTarget: item.complete ? showTarget : target, watchTarget: item.complete ? showTarget : target, collectionTarget: item.complete ? showTarget : target, ratingTarget: item.complete ? showTarget : target, onWatchSave, fill: quickIconFill({ state, runtime: item.runtime }), rating: item.complete ? undefined : item.rating, listLabel: item.complete ? 'Add to watchlist' : 'Add to list', more }}
  >
    {#snippet progress()}
      <UnderProgress href={item.progressHref} percent={progressPercent(item.progress)} ticks={item.ticks} {tip} />
    {/snippet}
    {#snippet posterOverlay()}
      {#if loading}<div class="loading"><TraktLoader size={48} label="Loading {item.showTitle}'s next episode" /></div>
      {:else if refreshing || needsRefresh}<RefreshCover title={item.showTitle} {refreshing} onrefresh={onRefresh} />
      {:else if item.complete && item.completionLabel}<div class="completion">{item.completionLabel}</div>{/if}
    {/snippet}
    {#if item.complete}<div class="show-line"><b>100% watched!</b></div>{:else}
    <div class="show-line"><a class="show-link" href={item.showHref}>{item.showTitle}</a></div>
    {/if}
  </PosterCard>
</div>

<style>
.loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--on-deck-loading-bg);
}

.completion {
  position: absolute;
  inset-inline-start: var(--space-lg-inline);
  inset-block-end: var(--on-deck-completion-bottom);
  margin-block-end: var(--space-sm-block);
  padding: var(--on-deck-completion-padding);
  background: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--on-deck-completion-size);
  font-weight: var(--font-weight-headings-light);
  line-height: var(--line-height-headings);
  pointer-events: none;
}

.on-deck-card {
  /* Dark knight drew on-deck cards without borders, on a darker bar. */
  --color-card-border: var(--color-on-deck-border);
  --color-card-bg: var(--color-on-deck-quick-icons);
}

/* OG's h4 under the title: 12px, 5px down, clipped to one line. */
.show-line {
  margin: var(--space-sm-block) 0 0;
  overflow: hidden;
  font-family: var(--font-headings);
  font-size: var(--font-size-card-subtitle);
  line-height: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show-link {
  color: var(--color-text);
  vertical-align: middle;

  &:is(:hover, :focus-visible) {
    color: var(--color-text);
  }
}
</style>
