<!--
  Check In while you're watching this page's movie or episode, or an episode of this page's show: a selected summary
  button in Check In's red. The live dot, white, sits where Check In's mark does, then "Watching Now" in the buttons'
  title style over the time watched and left in bold (on a show's pages, the episode's number and the time left, linking to it). A white
  line with its knob runs along the bottom edge. A check-in splits off a ✕ tile like history's +; a scrobble ends when
  the player stops. Once the bar would go away, `ended` (Check In) takes its place.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { cancelViewerCheckin } from '#lib/components/checkin/cancelViewerCheckin.ts';
import StatusDot from '#lib/components/status/StatusDot.svelte';
import SummaryActionTile from '#lib/components/summary/SummaryActionTile.svelte';
import circleXmark from '#lib/icons/light/circle-xmark.svg?raw';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { watchingProgress } from '#lib/users/watchingProgress.ts';
import { holdFocus } from '#lib/utils/holdFocus.ts';

interface Props {
  watching: WatchingNow;
  /** A show's pages: the episode's number in the detail line, and the button links to it. */
  episodeLine?: boolean;
  ended?: Snippet;
}

const { watching, episodeLine = false, ended }: Props = $props();

let now = $state(Date.now());
const reducedMotion = $derived(prefersReducedMotion.current);
const progress = $derived(watchingProgress({ ...watching, now, reducedMotion }));

$effect(() => {
  if (progress.gone) return;
  now = Date.now();
  const timer = setInterval(() => (now = Date.now()), reducedMotion ? 60_000 : 1000);
  return () => clearInterval(timer);
});

const episode = $derived(episodeLine ? watching.episode : null);

let root = $state<HTMLElement>();
let cancelling = $state(false);
// Cancelled, Check In takes this button's place, so focus goes to it.
async function cancel() {
  if (cancelling || !root) return;
  cancelling = true;
  const refocus = holdFocus(root);
  await cancelViewerCheckin(watching);
  cancelling = false;
  await refocus();
}
</script>

<!-- An episode's link is a page another issue builds; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if progress.gone}
  {@render ended?.()}
{:else}
  <div bind:this={root} class="summary-watching" style:--progress="{progress.percent}%">
    <svelte:element this={episodeLine ? 'a' : 'div'} class="main" href={episodeLine ? watching.href : undefined}>
      <span class="icon"><StatusDot kind={progress.finished ? 'done' : 'live'} /></span>
      <span class="text">
        <span class="title">Watching Now</span>
        <span class="detail">
          {#if progress.finished}
            {progress.finished}
          {:else if episode}
            <b>{episode.number}</b> / <b>{progress.remaining}</b> left
          {:else}
            <b>{progress.elapsed}</b> watched / <b>{progress.remaining}</b> left
          {/if}
        </span>
      </span>
      <span
        class="rail"
        role="progressbar"
        aria-label="Watched so far"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(progress.percent)}
        aria-valuetext={progress.finished ?? `${progress.elapsed} watched, ${progress.remaining} left`}
      ><span class="knob"></span></span>
    </svelte:element>
    {#if watching.action === 'checkin'}
      <div class="tiles">
        <SummaryActionTile icon={circleXmark} label="Cancel check in" aria-busy={cancelling} onclick={cancel} />
      </div>
    {/if}
  </div>
{/if}

<style>
/* A selected `SummaryAction`'s layout and tiles. */
.summary-watching {
  --action-color: var(--color-summary-watching-bg);
  --tile-bg: color-mix(in srgb, var(--action-color) var(--summary-action-tile-shade), var(--color-summary-action-tile-shade));
  --tile-color: var(--color-text-inverse);
  --tile-hover-bg: var(--action-color);
  --tile-hover-filter: var(--summary-action-hover);
  --tile-inset: 0;
  display: flex;
  gap: var(--summary-action-gap);
  inline-size: 100%;
  block-size: var(--summary-action-height);
  color: var(--color-summary-watching-ink);

  /* The live dot in white on the red, ended or not, at the size of the other buttons' marks. */
  --social-dot: var(--summary-watching-dot);
  --color-social-live: var(--color-summary-watching-ink);
  --color-social-live-glow: var(--color-summary-watching-glow);
  --color-social-done: var(--color-summary-watching-ink);
}

.main {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  min-inline-size: 0;
  border-radius: var(--radius-summary-action);
  background: var(--action-color);
  color: inherit;
  text-decoration: none;
  transition: filter var(--transition-summary-action);

  &:is(a):is(:hover, :focus-visible) {
    filter: var(--summary-action-hover);
  }

  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }
}

.icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  align-self: stretch;
  inline-size: var(--action-icon-width);
}

.text {
  flex: 1;
  min-inline-size: 0;
  padding-inline-end: var(--space-summary-action-text-end);
  font-family: var(--font-headings);
}

.title,
.detail {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-size: var(--font-size-action);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--summary-action-tracking);
  line-height: var(--summary-action-title-line);
  text-transform: uppercase;
}

.detail {
  font-size: var(--font-size-small);
  font-variant-numeric: tabular-nums;
  line-height: var(--summary-action-detail-line);

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.tiles {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  inline-size: var(--summary-action-tile-width);
}

/* Along the bottom edge, trimmed to the rounded corners, with the knob centered on it and inside the button at either
   end. */
.rail {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  block-size: var(--watching-rail-hairline);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      var(--color-summary-watching-ink) var(--progress),
      var(--color-summary-watching-track) var(--progress)
    );
    clip-path: inset(calc(var(--watching-rail-hairline) - var(--radius-summary-action)) 0 0 round 0 0
      var(--radius-summary-action) var(--radius-summary-action));
  }
}

.knob {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: clamp(
    calc(var(--watching-knob-size) / 2),
    var(--progress),
    calc(100% - var(--watching-knob-size) / 2)
  );
  inline-size: var(--watching-knob-size);
  block-size: var(--watching-knob-size);
  border-radius: 50%;
  background-color: var(--color-summary-watching-ink);
  box-shadow: var(--shadow-watching-knob);
  translate: -50% -50%;
}

@media (prefers-reduced-motion: reduce) {
  .main {
    transition: none;
  }
}
</style>
