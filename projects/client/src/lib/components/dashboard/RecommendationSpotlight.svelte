<!--
  The dashboard recommendation in the spotlight: its fanart (or, without one, its poster's two API colors), the
  counter, previous, next and a "Not interested" hide over it, then the title, tag pills (the type in the
  mix, the certificate, runtime and episodes joined, two genres joined, the network), two lines of overview and
  labelled glass actions: Add to Watchlist, Watch Now and Why this?, with the Trakt rating at the end.
-->
<script lang="ts">
import { isStandardApi } from '$lib/api/isStandardApi';
import { page } from '$app/state';
import TagPills from '$lib/components/labels/TagPills.svelte';
import { mediaTags } from '$lib/components/labels/mediaTags';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import WatchlistButton from '$lib/components/lists/WatchlistButton.svelte';
import MediaRating from '$lib/components/rating/MediaRating.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import { loadWatchNow } from '$lib/components/watchnow/loadWatchNow';
import type { WatchNowButton } from '$lib/components/watchnow/watchNow';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import type { Recommendation } from '$lib/dashboard/Recommendation';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import chevronLeft from '$lib/icons/regular/chevron-left.svg?raw';
import chevronRight from '$lib/icons/regular/chevron-right.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import RecommendationWhy from './RecommendationWhy.svelte';
import { watchNowCountry } from '../../settings/watchNowCountry.ts';
import { ratingPercent } from '../../utils/ratingPercent.ts';

interface Props {
  item: Recommendation;
  /** Zero-based, for the "1 of 20" counter. */
  index: number;
  total: number;
  /** Shows and movies together: the type leads the pills. */
  mixed: boolean;
  onstep: (by: -1 | 1) => void;
}

const { item, index, total, mixed, onstep }: Props = $props();

const target = $derived({ type: item.type, id: item.id, title: item.title });
const ratingLevel = $derived(Math.min(Math.max(Math.trunc(item.rating ?? 1), 1), 10));
// The year sits by the title instead.
const tags = $derived(mediaTags({ ...item, year: undefined, mixed }));

// A plain crossfade: the new fanart fades in once it has loaded, over the last one, which only gives way to it
// once the fade is done. The card never goes blank and never shows two pictures out of line.
let ready = $state<string>();
let backdrop = $state<string>();

// A preloaded fanart can be ready before its load listener.
const whenCached = (fanart: string) => (image: HTMLImageElement) => {
  if (image.complete && image.naturalWidth > 0) ready = fanart;
};

let watchNow = $state<WatchNowButton>();
let watchNowOpen = $state(false);
let loadingWatchNow = $state(false);

// Offers load when asked for, rather than for every title up front.
async function openWatchNow() {
  if (loadingWatchNow) return;
  loadingWatchNow = true;
  const settings = page.data.settings ?? null;
  const country = watchNowCountry(settings);
  try {
    const { button } = await loadWatchNow({
      fetch,
      path: item.path,
      fallback: item.type === 'show' ? `${item.path}/seasons/1/episodes/1` : undefined,
      country,
      settings,
    });
    if (button.unavailable) {
      toast.error("Where to Watch isn't available with this API key.");
      return;
    }
    if (button.count === 0 || button.hidden) {
      toast.error(`${item.title} isn't streaming anywhere in your country yet.`);
      return;
    }
    watchNow = button;
    watchNowOpen = true;
  } catch {
    toast.error("Couldn't load where to watch. Please try again.");
  } finally {
    loadingWatchNow = false;
  }
}
</script>

<!-- Media pages are linked by slug paths built in the mapper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<article
  class={['spotlight', { 'no-art': !item.fanart }]}
  style:--recommendations-tint={item.colors?.[0]}
  style:--recommendations-tint-2={item.colors?.[1]}
  style:background-image={item.fanart && backdrop ? `url("${backdrop}")` : undefined}
  aria-labelledby="spotlight-{item.id}"
>
  {#key item.id}
    {#if item.fanart}
      {@const fanart = item.fanart}
      <img class={['art', { loaded: ready === fanart }]} src={fanart} alt="" decoding="async"
        {@attach whenCached(fanart)} onload={() => (ready = fanart)} ontransitionend={() => (backdrop = fanart)} />
    {/if}
  {/key}
  <div class="controls">
    <span class="counter"><b>{index + 1}</b> of {total}</span>
    <span class="grow"></span>
    {#if total > 1}
      <button type="button" class="round" aria-label="Previous recommendation" onclick={() => onstep(-1)}><Icon
          svg={chevronLeft}
        /></button>
      <button type="button" class="round" aria-label="Next recommendation" onclick={() => onstep(1)}><Icon
          svg={chevronRight}
        /></button>
    {/if}
    <VisibilityControl {target} action="hide" section="recommendations" variant="badge" label="Not interested"><span
        class="round"><Icon svg={ban} /></span></VisibilityControl>
  </div>
  {#key item.id}
  <div class="body">
    <h3 id="spotlight-{item.id}"><a href={item.href}>{item.title}</a>{#if item.year}<span class="year"
        >{item.year}</span>{/if}</h3>
    {#if tags.length > 0}<div class="tags"><TagPills {tags} /></div>{/if}
    {#if item.overview}<p class="overview">{item.overview}</p>{/if}
    <div class="actions">
      <WatchlistButton {target} />
      {#if item.released && !isStandardApi()}
        <GlassAction icon={play} aria-haspopup="dialog" busy={loadingWatchNow ? 'Loading where to watch' : undefined}
          onclick={openWatchNow}>Watch now</GlassAction>
      {/if}
      <RecommendationWhy why={item.why} title={item.title} poster={item.poster} />
      {#if item.released && item.rating !== undefined}
        <span class="rating">
          <MediaRating {target}>
            {#snippet trigger()}
              <span class="percent"><span class="heart" style:color="var(--rating-{ratingLevel})"><Icon
                    svg={heart}
                  /></span>{ratingPercent(item.rating ?? 0)}%</span>
            {/snippet}
          </MediaRating>
        </span>
      {/if}
    </div>
  </div>
  {/key}
</article>

{#if watchNow}
  {#key watchNow}
    <WatchNowDialog bind:open={watchNowOpen} button={watchNow} title={item.title} year={item.year}
  fanart={item.fanart} />
  {/key}
{/if}

<style>
.spotlight {
  position: relative;
  isolation: isolate;
  display: grid;
  align-content: end;
  min-block-size: var(--recommendations-spotlight-min-height);
  overflow: hidden;
  border-radius: var(--radius-recommendations-spotlight);
  background: var(--color-recommendations-spotlight-bg);
  color: var(--color-recommendations-text);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--gradient-recommendations-spotlight);
  }

  &.no-art {
    background: var(--gradient-recommendations-no-art);
  }
}

.spotlight {
  background-position: center;
  background-size: cover;
}

.art {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--transition-recommendations-art);

  &.loaded {
    opacity: 1;
  }
}

.body {
  animation: body-in var(--transition-recommendations-body) ease-out;
}

@keyframes body-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .art {
    transition: none;
  }

  .body {
    animation: none;
  }
}

.controls {
  position: absolute;
  inset: var(--space-recommendations-controls) var(--space-recommendations-controls) auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
}

.grow {
  flex: 1;
}

/* In the previous and next buttons' glass. */
.counter {
  padding: var(--search-pill-padding);
  border: 1px solid var(--color-profile-pill-border);
  border-radius: var(--radius-search-pill);
  background: var(--color-profile-pill-bg);
  backdrop-filter: var(--blur-header-glass);
  font-size: var(--font-size-search-pill);
  line-height: var(--line-height-search-pill);
  font-variant-numeric: tabular-nums;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.round {
  display: grid;
  place-items: center;
  inline-size: var(--recommendations-round);
  block-size: var(--recommendations-round);
  padding: 0;
  border: 1px solid var(--color-profile-pill-border);
  border-radius: 50%;
  background: var(--color-profile-pill-bg);
  color: var(--color-recommendations-text);
  backdrop-filter: var(--blur-header-glass);
  cursor: pointer;

  &:hover {
    background: var(--color-glass-action-bg);
  }
}

.body {
  display: grid;
  gap: var(--recommendations-spotlight-gap);
  padding: var(--recommendations-spotlight-padding);
}

h3 {
  margin: 0;
  font-size: var(--font-size-recommendations-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-recommendations-title);
  text-wrap: balance;

  & a {
    color: inherit;
  }

  & a:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}

.year {
  margin-inline-start: var(--space-sm-inline);
  color: var(--color-recommendations-faint);
  font-size: var(--font-size-recommendations-year);
  font-weight: var(--font-weight-control);
}

/* Always over art, so the tags take their dark look in either theme. */
.tags {
  --color-tag-pill-bg: var(--color-recommendations-tag-bg);
  --color-tag-pill-line: var(--color-recommendations-tag-line);
  --color-tag-pill-text: var(--color-recommendations-tag-text);
  --color-tag-badge-line: var(--color-recommendations-tag-badge-line);
  --color-frame-ink: var(--color-recommendations-text);
}

.overview {
  display: -webkit-box;
  max-inline-size: var(--recommendations-overview-width);
  margin: 0;
  overflow: hidden;
  color: var(--color-recommendations-overview);
  font-size: var(--font-size-recommendations-overview);
  line-height: var(--line-height-recommendations-overview);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm-inline);
}

.rating {
  margin-inline-start: auto;
}

.percent {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  color: var(--color-recommendations-text);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
}
</style>
