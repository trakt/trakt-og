<!--
  The watching-now player: a now-playing bar along the bottom of a cover while someone is checked in or scrobbling,
  on the profile (over the tabs) and the dashboard greeting. Red-tinted glass blurs the cover behind it. A thumbnail
  leads (the episode's screenshot or the fanart; without either, a badge says which: an equaliser for playback, a check
  for a check-in), then a live dot with who is watching what (a show's episode on its own line, each line clipped), and a scrubber with a red fill and knob, the time watched
  and the time left, ticking every second (once a minute under reduced motion). Over time it says
  "Finished" or "Wrapping up" with a still green dot for a few minutes, then fades out. Below 600px of its own width
  the scrubber becomes a hairline along the bottom. The bar spans the cover; its content lines up with the page
  column. Put it inside a positioned cover.
  `card` is the header's hover card instead: a rounded panel of its own width in the phone layout, with the episode
  title, a bigger thumbnail and the knob centered on a line across its whole bottom edge.
  Cancelling your own check-in clears it everywhere (the header's dot, the dashboard, your profile).
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import Container from '#lib/components/container/Container.svelte';
import StatusDot from '#lib/components/status/StatusDot.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';
import check from '#lib/icons/solid/check.svg?raw';
import xmark from '#lib/icons/solid/xmark.svg?raw';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { cancelViewerCheckin } from '#lib/components/checkin/cancelViewerCheckin.ts';
import { watchingProgress } from '#lib/users/watchingProgress.ts';
import { holdFocus } from '#lib/utils/holdFocus.ts';
import { prefersReducedMotion } from 'svelte/motion';

interface Props {
  watching: WatchingNow;
  /** Whose profile it is: "Sean is watching", or "Watching Now" on your own. */
  owner: { readonly firstName: string; readonly href: string } | 'self';
  /** The header's hover card rather than a cover's bar. */
  card?: boolean;
}

const { watching, owner, card = false }: Props = $props();

let now = $state(Date.now());
const reducedMotion = $derived(prefersReducedMotion.current);
const progress = $derived(watchingProgress({ ...watching, now, reducedMotion }));

$effect(() => {
  if (progress.gone) return;
  now = Date.now();
  const timer = setInterval(() => (now = Date.now()), reducedMotion ? 60_000 : 1000);
  return () => clearInterval(timer);
});

// Only your own check-in can be cancelled; a scrobble ends when the player stops.
const cancellable = $derived(owner === 'self' && watching.action === 'checkin');
let root = $state<HTMLElement>();
let cancelled = $state(false);
let cancelling = false;
// Cancelled, the bar goes away, so focus moves to what's left around it.
async function cancel() {
  if (cancelling || watching.action !== 'checkin' || !root) return;
  cancelling = true;
  const refocus = holdFocus(root);
  cancelled = await cancelViewerCheckin(watching);
  cancelling = false;
  await refocus();
}
</script>

<!-- Links point at media and profile pages other issues build; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div bind:this={root} class={['watching-now', { card, cancelled, gone: progress.gone }]} inert={cancelled || progress.gone}
  {@attach trackDrilldowns({ source: 'watching-now' })}>
  <div class={['bar', { done: progress.finished }]} style:--progress="{progress.percent}%">
    {#if card}
      {@render row()}
    {:else}
      <Container>{@render row()}</Container>
    {/if}
  </div>
</div>

{#snippet row()}
      <div class="row">
        <a class="thumb" href={watching.href} tabindex="-1" aria-hidden="true">
          {#if watching.stillUrl}
            <img src={watching.stillUrl} alt="" width="96" height="54" />
          {:else}
            <span class={['badge', watching.action]}>
              {#if watching.action === 'checkin'}
                <Icon svg={check} />
              {:else}
                <span class="equaliser"><i></i><i></i><i></i></span>
              {/if}
            </span>
          {/if}
        </a>
        <div class="info">
          <p class="who">
            <StatusDot kind={progress.finished ? 'done' : 'live'} />
            <span class="who-text">
              {#if owner === 'self'}
                Watching Now
              {:else}
                <a href={owner.href}>{owner.firstName}</a> is watching
              {/if}
            </span>
          </p>
          <p class="what">
            <a href={watching.href}>
              <strong>{watching.title}</strong>
              {#if watching.episode}
                <span class="episode">
                  <span class="sxe">{watching.episode.number}</span>
                  {#if watching.episode.title}<span class="episode-title">"{watching.episode.title}"</span>{/if}
                </span>
              {/if}
            </a>
          </p>
        </div>
        <div class="scrubber">
          <span class="elapsed" aria-hidden="true">{progress.elapsed}</span>
          <div
            class="rail"
            role="progressbar"
            aria-label="Watched so far"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(progress.percent)}
            aria-valuetext={progress.finished ?? `${progress.elapsed} watched, ${progress.remaining} left`}
          >
            <span class="fill"></span>
            <span class="knob"></span>
          </div>
          <span class="remaining" aria-hidden="true">{progress.finished ?? `−${progress.remaining}`}</span>
        </div>
        {#if cancellable}
          <Tooltip text="Cancel" placement="bottom">
            {#snippet trigger(tip)}
              <button type="button" class="cancel" aria-label="Cancel check in" onclick={cancel} {...tip}>
                <Icon svg={xmark} />
              </button>
            {/snippet}
          </Tooltip>
        {/if}
      </div>
{/snippet}

<style>
.watching-now {
  position: absolute;
  inset-block-end: 0;
  inline-size: 100%;
  block-size: var(--profile-watching-height);
  overflow: hidden;
  container-type: inline-size;
  transition: block-size var(--watching-fade), opacity var(--watching-fade);

  &.gone {
    opacity: 0;
  }

  &.cancelled {
    block-size: 0;
    opacity: 0;
  }

  &.card {
    position: relative;
    inline-size: var(--header-watching-width);
    block-size: var(--header-watching-height);
    overflow: visible;
    border-radius: var(--radius-menu);
    box-shadow: var(--shadow-menu);
  }
}

.card .bar {
  border: 1px solid var(--color-watching-border);
  border-radius: inherit;
}

.card .row {
  padding-inline: var(--header-watching-pad);
}

.bar {
  position: absolute;
  inset: 0;
  display: grid;
  align-items: center;
  background-color: var(--color-watching-bg-solid);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);

  @supports (backdrop-filter: blur(1px)) {
    background-color: var(--color-watching-bg);
    backdrop-filter: var(--filter-watching-backdrop);
  }

  & a {
    color: inherit;
  }
}

.row {
  display: flex;
  align-items: center;
  gap: var(--watching-gap);
}

.thumb {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  inline-size: var(--watching-thumb-width);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-watching-thumb);
  background-color: var(--color-watching-thumb-bg);

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.badge {
  display: grid;
  place-items: center;
  inline-size: var(--watching-badge-size);
  block-size: var(--watching-badge-size);
  border-radius: 50%;
  background-color: var(--color-watching-badge);
  color: var(--color-watching-badge-ink);
  font-size: var(--watching-badge-icon);

  &.checkin {
    border: 2px solid var(--color-watching-check);
    background: none;
    color: var(--color-watching-check);
  }
}

.equaliser {
  display: flex;
  align-items: flex-end;
  gap: var(--watching-eq-gap);
  block-size: var(--watching-eq-height);

  & i {
    inline-size: var(--watching-eq-bar);
    block-size: 100%;
    border-radius: 1px;
    background-color: currentcolor;
    transform: scaleY(var(--level));
    transform-origin: bottom;
    animation: equaliser 1s ease-in-out infinite;

    &:nth-child(1) {
      --level: 0.6;
      animation-delay: -0.2s;
    }

    &:nth-child(2) {
      --level: 1;
      animation-delay: -0.5s;
    }

    &:nth-child(3) {
      --level: 0.4;
      animation-delay: -0.8s;
    }
  }

  .done & i {
    --level: 0.3;
    animation: none;
  }
}

@keyframes equaliser {
  50% {
    transform: scaleY(0.2);
  }
}

.info {
  flex: 0 1 var(--watching-text-share);
  min-inline-size: 0;

  & p {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.who-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The live dot's pulse spills past the line; the text clips itself. */
.info .who {
  overflow: visible;
}

.who {
  display: flex;
  align-items: center;
  gap: var(--watching-kicker-gap);
  color: var(--color-watching-muted);
  font-size: var(--font-size-watching-kicker);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--watching-kicker-tracking);
  text-transform: uppercase;

  & a {
    color: var(--color-text-inverse);
  }
}

.what {
  font-size: var(--font-size-watching-title);
  line-height: var(--line-height-headings);

  & :is(strong, .sxe) {
    font-weight: var(--font-weight-headings-heavy);
  }

  & .episode {
    font-size: var(--font-size-watching-episode);
  }

  /* A show on one line, its episode on the next, each clipped on its own. */
  & a {
    display: grid;

    & > * {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.scrubber {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--watching-gap);
  min-inline-size: 0;
  font-size: var(--font-size-watching-time);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;

  & > span {
    flex: none;
    min-inline-size: var(--watching-time-width);
  }
}

.remaining {
  color: var(--color-watching-muted);
  text-align: end;
}

.rail {
  position: relative;
  flex: 1;
  block-size: var(--watching-rail-height);
  border-radius: calc(var(--watching-rail-height) / 2);
  background-color: var(--color-watching-faint);
}

.fill {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: var(--progress);
  border-radius: inherit;
  background-color: var(--color-watching-fill);
}

/* Decorative: nothing can be scrubbed. */
.knob {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: var(--progress);
  inline-size: var(--watching-knob-size);
  block-size: var(--watching-knob-size);
  border-radius: 50%;
  background-color: var(--color-watching-fill);
  box-shadow: var(--shadow-watching-knob);
  translate: -50% -50%;
}

.cancel {
  flex: none;
  display: grid;
  place-items: center;
  inline-size: var(--watching-cancel-size);
  block-size: var(--watching-cancel-size);
  min-block-size: 0;
  padding: 0;
  border: 1px solid var(--color-watching-faint);
  border-radius: 50%;
  background-color: var(--color-watching-cancel-bg);
  color: var(--color-watching-muted);
  font-size: var(--watching-cancel-icon);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-text-inverse);
    color: var(--color-text-inverse);
  }
}

/* Phones: the rail becomes a hairline along the bottom edge, with the time left on the right. */
@container (width < 600px) {
  .row {
    gap: var(--watching-gap-phone);
  }

  .thumb {
    inline-size: var(--watching-thumb-width-phone);
  }

  .info {
    flex: 1;
  }

  .what {
    font-size: var(--font-size-watching-title-phone);
  }

  .what .episode {
    font-size: var(--font-size-watching-episode-phone);
  }

  .scrubber {
    display: contents;
  }

  .elapsed,
  .episode-title,
  .knob {
    display: none;
  }

  .rail {
    position: absolute;
    inset-block-end: 0;
    inset-inline: 0;
    block-size: var(--watching-rail-hairline);
    border-radius: 0;
  }
}

/* The header's card keeps the narrow layout's line along the full bottom edge, trimmed to the card's rounded corners,
   with the knob centered on it (inside the card at either end) and free to hang past the edge. Also the episode title
   and a bigger thumbnail. Its row never grows past the card, so the title clips. */
.card {
  .row {
    min-inline-size: 0;
  }

  .thumb {
    inline-size: var(--header-watching-thumb-width);
  }

  .episode-title {
    display: inline;
  }

  .rail {
    background: none;

    /* The line in one layer, so its ends follow the corners inside the card's border without clipping the knob. */
    &::before {
      --corner: calc(var(--radius-menu) - 1px);

      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to right,
        var(--color-watching-fill) var(--progress),
        var(--color-watching-faint) var(--progress)
      );
      clip-path: inset(calc(var(--watching-rail-hairline) - var(--corner)) 0 0 round 0 0 var(--corner) var(--corner));
    }
  }

  .fill {
    display: none;
  }

  .knob {
    display: block;
    inset-inline-start: clamp(
      calc(var(--watching-knob-size) / 2),
      var(--progress),
      calc(100% - var(--watching-knob-size) / 2)
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  .watching-now {
    transition: none;
  }

  .equaliser i {
    animation: none;
  }
}
</style>
