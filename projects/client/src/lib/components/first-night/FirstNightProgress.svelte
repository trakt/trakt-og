<!--
  A new member's first reel: ten frames of film that fill with the posters of what they track, sticking under the
  header while they scroll the whole dashboard. The next empty frame waits with a pulse, each unlock is marked under
  its frame, and a line beside the reel says where they're at. Titles tracked away from the starter picks fill
  plain frames. Done saves the choice and reloads the dashboard, so the panels fill in with what was just tracked.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import Container from '$lib/components/container/Container.svelte';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import { FIRST_NIGHT_GOAL, firstNightUnlocks, trackedTitles } from '$lib/firstNight/firstNight';
import { trackedPosters } from '$lib/firstNight/trackedPosters.svelte';
import { wallClosed } from '$lib/firstNight/wallClosed.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import sliders from '$lib/icons/solid/sliders.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import TasteSetup from './TasteSetup.svelte';
import { confetti } from './confetti.svelte.ts';

interface Props {
  slug: string;
  /** Titles watched when the page loaded, until the overlay counts everything. */
  watched: number;
  /** The watch-now settings and favorite genres, for Tune your picks. */
  taste: { country: string; services: readonly string[]; genres: readonly string[] };
}

const { slug, watched, taste }: Props = $props();
let tuning = $state(false);
const tracked = $derived(Math.min(trackedTitles(overlay.slices()) ?? watched, FIRST_NIGHT_GOAL));
const done = $derived(tracked >= FIRST_NIGHT_GOAL);
const posters = $derived(trackedPosters.list.slice(-FIRST_NIGHT_GOAL));
const frames = $derived(
  Array.from({ length: FIRST_NIGHT_GOAL }, (_, i) => ({
    n: i + 1,
    poster: i < tracked ? posters[i] : undefined,
    filled: i < tracked,
    next: i === tracked,
    unlock: firstNightUnlocks.find(({ at }) => at === i + 1),
  })),
);
// Where they're at: a short cheer, then what it means.
const line = $derived(
  done
    ? { title: "That's a wrap!", text: 'Your dashboard is lit.' }
    : tracked >= 5
    ? { title: 'Picks unlocked.', text: 'Recommendations are waking up.' }
    : tracked >= 3
    ? { title: 'Calendar on.', text: 'New episodes land the day they air.' }
    : tracked >= 1
    ? { title: 'Rolling!', text: 'Up Next is tracking.' }
    : { title: 'Your reel is empty.', text: "Tap a few you've seen." },
);
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

async function close() {
  dashboardPrefs.save(slug, { ...dashboardPrefs.load(slug), hide_first_night: true });
  wallClosed.set(true);
  await invalidateAll();
}
</script>

<div class={['bar', { done }]} role="region" aria-label="Your first ten titles" {@attach confetti(() => done)}>
  <Container>
    <div class="row">
      <div class="ring" aria-live="polite">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle class="track" cx="24" cy="24" r={RADIUS}></circle>
          <circle class="value" cx="24" cy="24" r={RADIUS} stroke-dasharray={CIRCUMFERENCE}
            stroke-dashoffset={CIRCUMFERENCE * (1 - tracked / FIRST_NIGHT_GOAL)}></circle>
        </svg>
        <span class="figure" aria-label="{tracked} of {FIRST_NIGHT_GOAL}"><b>{tracked}</b></span>
      </div>
      <p class="status">
        <span class="label">Your first reel</span>
        <span class="title">{line.title}</span>
        <span class="text">{line.text}</span>
      </p>
      <ol class="reel" aria-label="{tracked} of {FIRST_NIGHT_GOAL} titles tracked">
        {#each frames as frame (frame.n)}
          <li class={['frame', { filled: frame.filled, next: frame.next }]}>
            <span class="art">
              {#if frame.poster?.image}
                <img src={frame.poster.image} alt={frame.poster.title} />
              {:else if frame.filled}
                <Icon svg={check} />
              {:else}
                <span class="n" aria-hidden="true">{frame.n}</span>
              {/if}
            </span>
            {#if frame.unlock}
              <span class={['unlock', { open: frame.filled }]} title={frame.unlock.text}>{frame.unlock.short}</span>
            {/if}
          </li>
        {/each}
      </ol>
      <div class="actions">
        <button type="button" class="tune"
          onclick={() => (tuning = true)}><Icon svg={sliders} />Tune your picks</button>
        <GlassAction card glass icon={done ? check : ban}
          onclick={close}>{done ? 'Show my dashboard' : 'Skip this'}</GlassAction>
      </div>
    </div>
  </Container>
</div>

<TasteSetup bind:open={tuning} country={taste.country} services={taste.services} genres={taste.genres} />

<style>
/* Dark glass like the header, which it sits under. */
.bar {
  color-scheme: dark;
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: var(--z-first-night-bar);
  margin-block-start: var(--header-height);
  padding-block: var(--first-night-bar-padding);
  border-block-end: 1px solid var(--color-first-night-bar-line);
  background: var(--color-first-night-bar);
  backdrop-filter: var(--blur-header-glass);
  color: var(--color-first-night-text);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--first-night-bar-gap);
}

/* The count inside a ring that fills toward ten. */
.ring {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: var(--first-night-ring);
  block-size: var(--first-night-ring);

  svg {
    position: absolute;
    inset: 0;
    rotate: -90deg;
  }

  circle {
    fill: none;
    stroke-width: 4;
  }

  .track {
    stroke: var(--color-first-night-track);
  }

  .value {
    stroke: var(--brand-primary);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.4s ease;

    .done & {
      stroke: var(--color-first-night-done);
    }
  }
}

.figure {
  position: relative;
  font-variant-numeric: tabular-nums;
  line-height: 1;

  b {
    font-size: var(--font-size-first-night-bar-count);
    font-weight: 800;
  }
}

/* The reel's name, a short cheer, then what it means. */
.status {
  display: grid;
  margin: 0;
  min-inline-size: var(--first-night-status-width);
  line-height: 1.25;
}

.label {
  color: var(--color-first-night-gold);
  font-size: var(--font-size-first-night-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
}

.title {
  font-size: var(--font-size-large);
  font-weight: 800;

  .done & {
    color: var(--color-first-night-done);
  }
}

.text {
  color: var(--color-first-night-muted);
  font-size: var(--font-size-small);
}

/* The strip: frames between two rows of sprocket holes. Its margin holds the unlock labels under it, so the row
   (and everything centred in it) spans strip and labels alike. */
.reel {
  display: flex;
  gap: var(--first-night-frame-gap);
  margin: 0 0 var(--first-night-unlock-room);
  padding: var(--first-night-reel-padding);
  border-radius: var(--first-night-reel-radius);
  background: var(--first-night-sprockets), var(--color-first-night-reel);
  list-style: none;
}

.frame {
  position: relative;
}

.art {
  display: grid;
  place-items: center;
  inline-size: var(--first-night-frame-width);
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--first-night-frame-radius);
  background: var(--color-first-night-frame);
  color: var(--color-first-night-dim);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);

  img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .filled & {
    background: var(--color-first-night-done);
    color: var(--color-first-night-text);
    animation: land 0.35s cubic-bezier(0.3, 1.6, 0.6, 1);
  }

  .next & {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 2px var(--brand-primary);
      pointer-events: none;
      animation: wait 1.6s ease-in-out infinite;
    }
  }
}

/* An unlock's name under its frame, lit once the frame fills. */
.unlock {
  position: absolute;
  inset-block-start: calc(100% + var(--first-night-reel-padding-block) + 2px);
  inset-inline-start: 50%;
  translate: -50% 0;
  color: var(--color-first-night-dim);
  font-size: var(--font-size-first-night-unlock);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
  white-space: nowrap;

  &.open {
    color: var(--color-first-night-done);
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin-inline-start: auto;
}

/* Tune your picks in the Trakt violet, washed like the summary's glass actions. */
.tune {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--first-night-button-small-height);
  padding-inline: var(--first-night-button-small-inline);
  border: 1px solid color-mix(in srgb, var(--brand-violet) 70%, transparent);
  border-radius: var(--radius-object);
  background: color-mix(in srgb, var(--brand-violet) 28%, transparent);
  color: var(--color-first-night-text);
  font: inherit;
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--brand-violet);
  }
}

@keyframes land {
  from {
    scale: 0.4;
    opacity: 0;
  }
}

@keyframes wait {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .art,
  .art::after {
    animation: none !important;
  }

  .ring .value {
    transition: none;
  }
}
</style>
