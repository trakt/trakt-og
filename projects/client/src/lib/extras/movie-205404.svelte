<!--
  The site glitches through other dimensions, a beat each, torn between them: noir (black and white, in the rain),
  cartoon (loud colors, the page bouncing like rubber), anime (hot pinks and blues, speed lines) and comic
  (punched-up colors printed a little off register, halftone dots). Then the jumps speed up, flickering through all
  four faster and faster under one long tear, until it snaps
  back to the site and a tag names home, Earth-1610, for a beat before it fades. Switched off, it tears back at once.
  Decorative: it never takes the pointer, and with reduced motion it skips the glitches, holds the comic a moment and
  goes home.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';
import { shakenFrames, tornFrames } from './glitchFrames.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;
type Dimension = 'noir' | 'cartoon' | 'anime' | 'comic';

const { ondone, stop = false }: ExtraProps = $props();

const HOPS: readonly (readonly [Dimension, string])[] = [
  ['noir', 'Earth-90214'],
  ['cartoon', 'Earth-8311'],
  ['anime', 'Earth-14512'],
  ['comic', 'Earth-65'],
];
const HOME = 'Earth-1610';
const TEAR_MS = 260;
const TEAR_FRAMES = 3;
const STAY_MS = 560;
// Each flicker's stay as the jumps speed up, cycling through the dimensions.
const FLICKER_MS = [240, 180, 140, 110, 90, 75, 65, 60, 60];
// How long the home tag shows once the site is back; it fades over the end of it.
const HOME_MS = 1600;
// With reduced motion, how long it holds the comic before going home.
const STILL_MS = 2500;

let dimension = $state<Dimension | null>(null);
let earth = $state('');
let stay = STAY_MS;
let leaving = false;
const timers: number[] = [];
const animations: Animation[] = [];

const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
const play = (element: Element | null | undefined, keyframes: Frames, options: Timing) => {
  const animation = element?.animate(keyframes, options);
  if (animation) animations.push(animation);
};
// The cartoon's squash and stretch, settling over its stay.
const boing: Frames = [
  { transform: 'scale(1.05, 0.93)' },
  { transform: 'scale(0.97, 1.04)', offset: 0.35 },
  { transform: 'scale(1.01, 0.99)', offset: 0.7 },
  { transform: 'none' },
];

function enter(next: Dimension | null) {
  dimension = next;
  if (next === 'cartoon' && !prefersReducedMotion.current) {
    play(document.querySelector('main'), boing, { duration: stay, easing: 'ease-out' });
  }
  if (next) document.documentElement.setAttribute('data-verse', next);
  else document.documentElement.removeAttribute('data-verse');
}

/** Tears the page and shakes the header, over `frames` jumps in `duration`. */
function shake(frames: number, duration: number) {
  const page = document.querySelector('main');
  if (page) play(page, tornFrames(page, frames), { duration });
  play(document.querySelector('header.top-nav'), shakenFrames(frames), { duration });
}

async function tear() {
  if (prefersReducedMotion.current) return;
  shake(TEAR_FRAMES, TEAR_MS);
  await wait(TEAR_MS);
}

async function flicker() {
  shake(FLICKER_MS.length, FLICKER_MS.reduce((sum, ms) => sum + ms, 0));
  for (const [index, ms] of FLICKER_MS.entries()) {
    const hop = HOPS[index % HOPS.length];
    if (leaving || !hop) return;
    stay = ms;
    enter(hop[0]);
    earth = hop[1];
    await wait(ms);
  }
}

async function arrive() {
  if (prefersReducedMotion.current) {
    enter('comic');
    earth = 'Earth-65';
    await wait(STILL_MS);
  } else {
    for (const [hop, name] of HOPS) {
      await tear();
      if (leaving) return;
      enter(hop);
      earth = name;
      await wait(STAY_MS);
    }
    await flicker();
  }
  if (leaving) return;
  leaving = true;
  await tear();
  enter(null);
  earth = HOME;
  await wait(HOME_MS);
  ondone();
}

async function leave() {
  if (leaving) return;
  leaving = true;
  earth = '';
  await tear();
  enter(null);
  ondone();
}

$effect(() => {
  if (stop) untrack(leave);
});

// Runs once: it sets the whole arrival going when it mounts, and puts the site back however it ends.
const start: Attachment<HTMLElement> = (element) =>
  untrack(() => {
    // It's rendered inside the page it restyles, so it moves out first.
    document.body.append(element);
    arrive();
    return () => {
      leaving = true;
      for (const timer of timers) clearTimeout(timer);
      for (const animation of animations) animation.cancel();
      document.documentElement.removeAttribute('data-verse');
      element.remove();
    };
  });
</script>

<div class={['extra', dimension]} aria-hidden="true" {@attach start}>
  <div class="rain"></div>
  <div class="speed"></div>
  <div class="halftone"></div>
  {#if earth}<p class={['earth', { home: earth === HOME }]} style:--home-ms="{HOME_MS}ms">{earth}</p>{/if}
</div>

<style>
.extra {
  --extra-ink: #111;
  --extra-white: #fff;
  --extra-rain: rgb(255 255 255 / 18%);
  --extra-speed: rgb(255 255 255 / 32%);
  --extra-dots:
    radial-gradient(circle, rgb(255 0 140 / 35%) 1.4px, transparent 1.9px) 0 0 / 7px 7px,
    radial-gradient(circle, rgb(0 200 255 / 30%) 1.4px, transparent 1.9px) 3px 3px / 7px 7px,
    radial-gradient(circle, rgb(0 0 0 / 35%) 1px, transparent 1.5px) 1px 2px / 5px 5px;

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

.rain,
.speed,
.halftone {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
}

.rain {
  background: repeating-linear-gradient(105deg, transparent 0 14px, var(--extra-rain) 14px 15px);
  background-size: 200% 200%;

  .noir & {
    opacity: 1;
    animation: rain 0.35s linear infinite;
  }
}

.speed {
  background: repeating-conic-gradient(from 0deg at 50% 50%, var(--extra-speed) 0 1.2deg, transparent 1.2deg 7deg);
  mask-image: radial-gradient(circle, transparent 28%, #000 70%);

  .anime & {
    opacity: 1;
  }
}

.halftone {
  background: var(--extra-dots);
  mix-blend-mode: multiply;

  .comic & {
    opacity: 1;
  }
}

/* Comic lettering: heavy capitals in a white box. */
.earth {
  position: absolute;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;
  inset-block-end: 4vh;
  inset-inline-start: 3vw;
  margin: 0;
  padding: 4px 12px;
  border: 3px solid var(--extra-ink);
  background: var(--extra-white);
  box-shadow: 4px 4px 0 var(--extra-ink);
  color: var(--extra-ink);
  font-size: clamp(18px, 2vw, 28px);
  letter-spacing: 0.04em;

  /* Home: it holds, then fades out as the extra ends. */
  &.home {
    animation: home var(--home-ms) ease-in both;
  }
}

/* The site in each dimension: header, page and footer together. */
:global(html[data-verse='noir'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: grayscale(1) contrast(1.9) brightness(0.85);
}

:global(html[data-verse='cartoon'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: saturate(2) contrast(1.4) brightness(1.1);
}

:global(html[data-verse='anime'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: hue-rotate(-40deg) saturate(2.2) brightness(1.1) contrast(0.95);
}

:global(html[data-verse='comic'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: saturate(1.7) contrast(1.25) drop-shadow(3px 0 rgb(0 235 255 / 60%)) drop-shadow(-3px 0 rgb(255 0 140 / 60%));
}

@keyframes home {
  70% {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes rain {
  to {
    background-position: -30px 60px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .noir .rain {
    animation: none;
  }
}
</style>
