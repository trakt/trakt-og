<!--
  The lights go out, and the whole site comes back as a dark, cyan-lit grid: the header, the page and the footer,
  with every picture, button and panel traced in glowing light and a neon floor rolling away under the window. Two
  light cycles race across the floor in opposite directions, leaving walls of light, and race again every few
  seconds. It stays until it's switched off: then the lights go out again and the site comes back as it was.
  Decorative: it never takes the pointer, and with reduced motion the floor holds still and the walls simply glow.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;

const { ondone, stop = false }: ExtraProps = $props();

const DARK_MS = 350;
const REVEAL_MS = 500;
// One race: the cycles cross in the first part, their walls hang in the air, then fade.
const RACE_MS = 3200;
const CROSSED = 0.42;
const STAGGER_MS = 250;
const RACE_EVERY_MS = 7000;

let on = $state(false);
let root: HTMLElement | undefined;
let leaving = false;
let racing = 0;
const timers: number[] = [];

const after = (ms: number, then: () => void) => timers.push(window.setTimeout(then, ms));
const animate = (selector: string, keyframes: Frames, options: Timing) =>
  root?.querySelector(selector)?.animate(keyframes, options);
const dim = (then: () => void) => {
  animate('.dark', [{ opacity: 0 }, { opacity: 1 }], { duration: DARK_MS, fill: 'forwards' });
  after(DARK_MS, () => {
    then();
    animate('.dark', [{ opacity: 1 }, { opacity: 0 }], { duration: REVEAL_MS, fill: 'forwards' });
  });
};

function ride(cycle: string, from: string, to: string, delay: number) {
  const timing = { duration: RACE_MS, delay, easing: 'linear' };
  if (prefersReducedMotion.current) {
    const glow = [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: 'none', offset: 0.2 }, { opacity: 1, transform: 'none', offset: 0.8 }, { opacity: 0, transform: 'none' }];
    animate(`${cycle} .wall`, glow, timing);
    return;
  }
  const dash = 'cubic-bezier(0.5, 0, 0.2, 1)';
  animate(
    `${cycle} .wall`,
    [
      { transform: 'scaleX(0)', opacity: 1, easing: dash },
      { transform: 'scaleX(1)', opacity: 1, offset: CROSSED },
      { transform: 'scaleX(1)', opacity: 1, offset: 0.75 },
      { transform: 'scaleX(1)', opacity: 0 },
    ],
    timing,
  );
  animate(
    `${cycle} .head`,
    [
      { transform: from, opacity: 1, easing: dash },
      { transform: to, opacity: 1, offset: CROSSED },
      { transform: to, opacity: 0, offset: CROSSED + 0.04 },
      { transform: to, opacity: 0 },
    ],
    timing,
  );
}

function race() {
  ride('.blue', 'translateX(0)', 'translateX(calc(100vw - 100%))', 0);
  ride('.orange', 'translateX(0)', 'translateX(calc(100% - 100vw))', STAGGER_MS);
}

function leave() {
  if (leaving) return;
  leaving = true;
  clearInterval(racing);
  dim(() => {
    on = false;
    document.documentElement.removeAttribute('data-grid');
  });
  after(DARK_MS + REVEAL_MS, ondone);
}

$effect(() => {
  if (stop) untrack(leave);
});

// Runs once: it puts the lights out and switches the site onto the grid when it mounts.
const enter: Attachment<HTMLElement> = (element) =>
  untrack(() => {
    root = element;
    // It's rendered inside the page it restyles, so it moves out first.
    document.body.append(element);
    dim(() => {
      on = true;
      document.documentElement.setAttribute('data-grid', '');
    });
    after(DARK_MS + REVEAL_MS, race);
    racing = window.setInterval(race, RACE_EVERY_MS);

    return () => {
      clearInterval(racing);
      for (const timer of timers) clearTimeout(timer);
      for (const animation of element.getAnimations({ subtree: true })) animation.cancel();
      document.documentElement.removeAttribute('data-grid');
      element.remove();
    };
  });
</script>

<div class={['extra', { on }]} aria-hidden="true" {@attach enter}>
  <div class="floor"><div class="plane"></div></div>
  <div class="cycle blue"><span class="wall"></span><span class="head"></span></div>
  <div class="cycle orange"><span class="wall"></span><span class="head"></span></div>
  <div class="dark"></div>
</div>

<style>
.extra {
  --extra-dark: #000;
  --extra-line: rgb(90 235 255 / 75%);
  --extra-horizon: rgb(110 243 255 / 90%);
  --extra-blue: #6ff3ff;
  --extra-blue-glow: rgb(80 230 255 / 80%);
  --extra-orange: #ff9a2e;
  --extra-orange-glow: rgb(255 140 30 / 80%);
  --extra-core: #fff;

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

.dark {
  position: absolute;
  inset: 0;
  background: var(--extra-dark);
  opacity: 0;
}

/* A grid plane tipped back toward the horizon, its lines sliding toward you. */
.floor {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: 40vh;
  overflow: hidden;
  visibility: hidden;
  perspective: 260px;
  perspective-origin: 50% 0;
  mask-image: linear-gradient(transparent, #000 35%);
  border-block-start: 1px solid var(--extra-horizon);
  box-shadow: 0 -6px 24px var(--extra-blue-glow);

  .on & {
    visibility: visible;
  }
}

.plane {
  position: absolute;
  inset-inline: -100%;
  inset-block-end: 0;
  block-size: 300%;
  transform-origin: 50% 100%;
  transform: rotateX(74deg);
  background:
    repeating-linear-gradient(90deg, var(--extra-line) 0 1px, transparent 1px 56px),
    repeating-linear-gradient(0deg, var(--extra-line) 0 1px, transparent 1px 56px);

  .on & {
    animation: roll 0.7s linear infinite;
  }
}

.cycle {
  position: absolute;
  inset-inline: 0;
  block-size: 6px;

  &.blue {
    inset-block-end: 13vh;
    --cycle: var(--extra-blue);
    --cycle-glow: var(--extra-blue-glow);
  }

  &.orange {
    inset-block-end: 22vh;
    --cycle: var(--extra-orange);
    --cycle-glow: var(--extra-orange-glow);
  }
}

/* The wall of light a cycle leaves behind, fading toward where it started. */
.wall {
  position: absolute;
  inset: 0;
  border-radius: 3px;
  transform: scaleX(0);
  box-shadow: 0 0 14px 3px var(--cycle-glow);

  .blue & {
    transform-origin: left;
    background: linear-gradient(90deg, transparent, var(--cycle));
  }

  .orange & {
    transform-origin: right;
    background: linear-gradient(270deg, transparent, var(--cycle));
  }
}

/* The cycle itself: a white-hot streak at the front of its wall. */
.head {
  position: absolute;
  inset-block: -4px;
  inline-size: 44px;
  border-radius: 7px;
  opacity: 0;
  background: linear-gradient(90deg, var(--cycle), var(--extra-core));
  box-shadow: 0 0 18px 6px var(--cycle-glow);

  .blue & {
    inset-inline-start: 0;
  }

  .orange & {
    inset-inline-end: 0;
    background: linear-gradient(270deg, var(--cycle), var(--extra-core));
  }
}

/* The site itself, while it's on the grid: header, page and footer go dark and cyan, every picture, button and panel
   traced in light. */
:global(html[data-grid] :is(header.top-nav, #content, #content ~ footer)) {
  filter: grayscale(1) sepia(1) hue-rotate(150deg) saturate(3) brightness(0.7) contrast(1.2);
}

:global(html[data-grid] :is(header.top-nav, #content, #content ~ footer) :is(img, button:not(.spot), input, section, article, li, figure)) {
  outline: 1px solid rgb(111 243 255 / 70%);
  outline-offset: -1px;
  box-shadow: 0 0 10px rgb(80 230 255 / 45%);
}

@keyframes roll {
  from {
    transform: rotateX(74deg) translateY(0);
  }

  to {
    transform: rotateX(74deg) translateY(56px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .on .plane {
    animation: none;
  }
}
</style>
