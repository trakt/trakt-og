<!--
  The watching-now bar: a now-playing bar along the bottom of the cover while someone is checked in or scrobbling.
  The cover blurs behind it. A badge on the left says which (an equaliser for playback, a check for a check-in), and a
  scrubber shows the time watched and the time left, ticking every second (once a minute under reduced motion). Over
  time it says "Finished" or "Wrapping up" for a few minutes, then fades out. Below 600px of its own width the scrubber
  becomes a hairline along the bottom. Put it inside a positioned cover.
-->
<script lang="ts">
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/solid/check.svg?raw';
import xmark from '$lib/icons/solid/xmark.svg?raw';
import type { WatchingNow } from '$lib/users/WatchingNow';
import { watchingProgress } from '$lib/users/watchingProgress';
import { prefersReducedMotion } from 'svelte/motion';

interface Props {
  watching: WatchingNow;
  /** Whose profile it is: "Sean is watching", or "You are watching" on your own. */
  owner: { readonly firstName: string; readonly href: string } | 'self';
}

const { watching, owner }: Props = $props();

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
let cancelled = $state(false);
let cancelling = false;
async function cancel() {
  if (cancelling) return;
  cancelling = true;
  const response = await rawApiFetch({
    fetch: authenticatedFetch({ manager: userManager() }),
    path: '/checkin',
    init: { method: 'DELETE' },
  }).catch(() => null);
  cancelling = false;
  if (response?.ok) {
    cancelled = true;
    const episode = watching.episode
      ? ` ${watching.episode.number}${watching.episode.title ? ` "${watching.episode.title}"` : ''}`
      : '';
    toast.success(`You cancelled your check in for ${watching.title}${episode}.`);
  } else if (response?.status !== 429) toast.error('Doh! We ran into some sort of error.');
}
</script>

<!-- Links point at media and profile pages other issues build; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class={['watching-now', { cancelled, gone: progress.gone }]} inert={cancelled || progress.gone}>
  <div class={['bar', { done: progress.finished }]} style:--progress="{progress.percent}%">
    <span class={['badge', watching.action]} aria-hidden="true">
      {#if watching.action === 'checkin'}
        <Icon svg={check} />
      {:else}
        <span class="equaliser"><i></i><i></i><i></i></span>
      {/if}
    </span>
    <div class="info">
      <p class="who">
        {#if owner === 'self'}
          You are watching
        {:else}
          <a href={owner.href}>{owner.firstName}</a> is watching
        {/if}
      </p>
      <p class="what">
        <a href={watching.href}>
          <strong>{watching.title}</strong>
          {#if watching.episode}
            <span class="sxe">{watching.episode.number}</span>
            {#if watching.episode.title}<span class="episode-title">"{watching.episode.title}"</span>{/if}
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
</div>

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
}

.bar {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: var(--watching-gap);
  padding-inline: var(--watching-padding-inline);
  border-block-start: 1px solid var(--color-watching-border);
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

.badge {
  flex: none;
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
    border-radius: 1px;
    background-color: currentcolor;
    animation: equaliser 1s ease-in-out infinite;

    &:nth-child(1) {
      block-size: 60%;
      animation-delay: -0.2s;
    }

    &:nth-child(2) {
      block-size: 100%;
      animation-delay: -0.5s;
    }

    &:nth-child(3) {
      block-size: 40%;
      animation-delay: -0.8s;
    }
  }

  .done & i {
    block-size: 30%;
    animation: none;
  }
}

@keyframes equaliser {
  50% {
    block-size: 20%;
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

.who {
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
  background-color: var(--color-text-inverse);
}

/* Decorative: nothing can be scrubbed. */
.knob {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: var(--progress);
  inline-size: var(--watching-knob-size);
  block-size: var(--watching-knob-size);
  border-radius: 50%;
  background-color: var(--color-text-inverse);
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
  .bar {
    gap: var(--watching-gap-phone);
    padding-inline: var(--watching-padding-inline-phone);
  }

  .badge {
    inline-size: var(--watching-badge-size-phone);
    block-size: var(--watching-badge-size-phone);
  }

  .info {
    flex: 1;
  }

  .what {
    font-size: var(--font-size-watching-title-phone);
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

@media (prefers-reduced-motion: reduce) {
  .watching-now {
    transition: none;
  }

  .equaliser i {
    animation: none;
  }
}
</style>
