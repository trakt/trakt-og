<!--
  A string of Christmas lights drops in under the header, with the alphabet painted under the bulbs. The letters that
  woke it, and every letter typed after, light their bulbs for a moment. Spelling "run" makes every bulb flicker,
  then the page flips over into a dim world with drifting spores. Something lunges up from the bottom of the window
  as red lightning flashes, hangs there a moment, and drops away again, and the page flips back. It packs up after a few quiet seconds. Decorative: it never takes the pointer, and with
  reduced motion things fade instead of moving.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import visitor from './assets/show-104439.svg';
import type { ExtraProps } from './extras.ts';
import { pageKey } from './pageKey.ts';
import { typedSequence } from './typedSequence.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;

const { ondone, woke }: ExtraProps = $props();

const LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];
const BULBS = ['#ff3b2f', '#3ddc5f', '#ffc21f', '#3b8bff', '#ff8a1f'];
const WORD = 'run';
const WORD_GAP_MS = 2500; // spelled out one light at a time, so slower than a typed code
const SAGS = 3;
const SAG = 34; // how far the wire droops between its nails, in px
const LIT_MS = 1100;
const IDLE_MS = 6000;
const FLICKER_MS = 1100;
const FLIP_MS = 900;
const OTHER_SIDE_MS = 5200;
const SPORES = 40;
// The visitor, from the moment the page has turned over: up from below, a hold, and back down.
const RISE_MS = 380;
const HOLD_MS = 2200;
const SINK_MS = 450;

const droop = (x: number) => {
  const t = (x * SAGS) % 1;
  return SAG * 4 * t * (1 - t);
};
const along = (index: number) => (index + 0.5) / LETTERS.length;
const wire = Array.from({ length: 121 }, (_, step) => `${step ? 'L' : 'M'}${step * (1000 / 120)} ${droop(step / 120) + 2}`)
  .join(' ');
const spores = Array.from({ length: SPORES }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  rise: 40 + Math.random() * 90,
  drift: (Math.random() - 0.5) * 70,
  seconds: 4 + Math.random() * 4,
  delay: -Math.random() * 4,
}));

const lit = $state(LETTERS.map(() => false));
let phase = $state<'strung' | 'flicker' | 'flipped' | 'leaving'>('strung');

let root: HTMLElement | undefined;
let typed = { keys: '', at: 0 };
let idle = 0;
let flicker = 0;
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- timer bookkeeping, never read reactively
const timers = new Set<number>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- timer bookkeeping, never read reactively
const bulbTimers = new Map<number, number>();
const animations: Animation[] = [];

const after = (ms: number, then: () => void) => {
  const timer = window.setTimeout(() => {
    timers.delete(timer);
    then();
  }, ms);
  timers.add(timer);
};
const animate = (selector: string | Element | null, keyframes: Frames, options: Timing) => {
  const element = typeof selector === 'string' ? root?.querySelector(selector) : selector;
  const animation = element?.animate(keyframes, options);
  if (animation) animations.push(animation);
  return animation;
};

function light(letter: string) {
  const index = LETTERS.indexOf(letter);
  if (index < 0) return;
  lit[index] = true;
  clearTimeout(bulbTimers.get(index));
  bulbTimers.set(index, window.setTimeout(() => (lit[index] = false), LIT_MS));
}

function rest() {
  clearTimeout(idle);
  idle = window.setTimeout(leave, IDLE_MS);
}

function leave() {
  phase = 'leaving';
  const out = animate('.wall', [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40px)', opacity: 0 }], {
    duration: 400,
    easing: 'ease-in',
    fill: 'forwards',
  });
  out?.finished.then(ondone, () => {});
}

function visit(reduced: boolean) {
  const start = reduced ? 300 : FLIP_MS + 150;
  const below = { transform: 'translate(-50%, 100%)', opacity: 1 };
  const up = { transform: 'translate(-50%, 0)', opacity: 1 };
  const unseen = { transform: 'translate(-50%, 0)', opacity: 0 };
  animate('.visitor', reduced ? [unseen, up] : [below, { transform: 'translate(-50%, -4%)', offset: 0.75 }, up], {
    duration: reduced ? 400 : RISE_MS,
    delay: start,
    easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    fill: 'forwards',
  });
  if (!reduced) {
    animate('.lightning', [{ opacity: 0 }, { opacity: 0.85, offset: 0.15 }, { opacity: 0 }], {
      duration: 420,
      delay: start + RISE_MS * 0.6,
    });
  }
  after(start + RISE_MS + HOLD_MS, () => {
    animate('.visitor', [up, reduced ? unseen : below], { duration: SINK_MS, easing: 'ease-in', fill: 'forwards' });
  });
}

function flip() {
  phase = 'flipped';
  const reduced = prefersReducedMotion.current;
  const page = document.querySelector('main');
  // Turn the page over around the middle of the window, not the middle of the whole page.
  const origin = page ? `50% ${innerHeight / 2 - page.getBoundingClientRect().top}px` : 'center';
  const level = { transformOrigin: origin, transform: 'perspective(1600px) rotateX(0deg)' };
  const over = { transformOrigin: origin, transform: 'perspective(1600px) rotateX(180deg)' };
  const turn = { duration: FLIP_MS, easing: 'cubic-bezier(0.6, 0, 0.3, 1)', fill: 'forwards' } as const;

  const there = reduced ? undefined : animate(page, [level, over], turn);
  animate('.wall', [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
  animate('.other-side', [{ opacity: 0 }, { opacity: 1 }], {
    duration: 600,
    delay: reduced ? 0 : FLIP_MS * 0.4,
    fill: 'forwards',
  });
  visit(reduced);

  after(OTHER_SIDE_MS, () => {
    const back = reduced ? undefined : animate(page, [over, level], turn);
    animate('.other-side', [{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' });
    after(reduced ? 600 : FLIP_MS, () => {
      there?.cancel();
      back?.cancel();
      ondone();
    });
  });
}

function run() {
  phase = 'flicker';
  clearTimeout(idle);
  if (prefersReducedMotion.current) {
    lit.fill(false);
    flip();
    return;
  }
  flicker = window.setInterval(() => {
    for (const index of lit.keys()) lit[index] = Math.random() < 0.5;
  }, 90);
  after(FLICKER_MS, () => {
    clearInterval(flicker);
    lit.fill(false);
    flip();
  });
}

function press(letter: string, at: number) {
  if (phase !== 'strung' || !LETTERS.includes(letter)) return;
  light(letter);
  rest();
  typed = typedSequence(typed, letter, at, WORD, WORD_GAP_MS);
  if (typed.keys === WORD) run();
}

// Runs once: it reads and writes the bulbs' state as it replays the keys that woke it.
const hang: Attachment<HTMLElement> = (element) => untrack(() => {
  root = element;
  // It's rendered inside the page it flips, so it moves out first.
  document.body.append(element);
  animate('.wall', [{ transform: 'translateY(-40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
    duration: prefersReducedMotion.current ? 1 : 450,
    easing: 'cubic-bezier(0.2, 1.2, 0.4, 1)',
  });
  for (const key of woke ?? '') press(key.toLowerCase(), performance.now());
  if (phase === 'strung') rest();

  return () => {
    clearTimeout(idle);
    clearInterval(flicker);
    for (const timer of [...timers, ...bulbTimers.values()]) clearTimeout(timer);
    for (const animation of animations) animation.cancel();
    element.remove();
  };
});

function onkeydown(event: KeyboardEvent) {
  const key = pageKey(event);
  if (key) press(key.toLowerCase(), event.timeStamp);
}
</script>

<svelte:window {onkeydown} />

<div class="extra" aria-hidden="true" {@attach hang}>
  <div class="wall">
    <svg class="wire" viewBox="0 0 1000 {SAG + 4}" preserveAspectRatio="none"><path d={wire} /></svg>
    {#each LETTERS as letter, index (letter)}
      <span
        class={['bulb', { lit: lit[index] }]}
        style:left="{along(index) * 100}%"
        style:top="{droop(along(index)) + 6}px"
        style:--bulb={BULBS[index % BULBS.length]}
        style:--tilt="{index % 2 ? 9 : -9}deg"
      ></span>
      <span class="letter" style:left="{along(index) * 100}%" style:--tilt="{((index * 37) % 7) - 3}deg">{letter}</span>
    {/each}
  </div>

  <div class={['other-side', { on: phase === 'flipped' }]}>
    {#each spores as spore, index (index)}
      <span
        class="spore"
        style:left="{spore.x}%"
        style:top="{spore.y}%"
        style:--size="{spore.size}px"
        style:--rise="{spore.rise}px"
        style:--drift="{spore.drift}px"
        style:--seconds="{spore.seconds}s"
        style:--delay="{spore.delay}s"
      ></span>
    {/each}
    <div class="lightning"></div>
  </div>

  <img class="visitor" src={visitor} alt="" />
</div>

<style>
.extra {
  --extra-wire: #46533a;
  --extra-wire-shadow: drop-shadow(0 1px 1px rgb(0 0 0 / 60%));
  --extra-backdrop: linear-gradient(rgb(0 0 0 / 78%), rgb(0 0 0 / 55%) 65%, transparent);
  --extra-socket: #2c3a24;
  --extra-bulb-core: #fff;
  --extra-paint: #f3ead6;
  --extra-paint-shadow: 0 2px 6px rgb(0 0 0 / 85%);
  --extra-dark-glass: rgb(30 30 30 / 55%);
  --extra-other-side: radial-gradient(ellipse at 50% 40%, rgb(40 55 80 / 40%), rgb(6 10 18 / 88%));
  --extra-spore: rgb(232 238 248 / 85%);
  --extra-spore-glow: 0 0 6px rgb(232 238 248 / 60%);
  --extra-lightning: radial-gradient(ellipse at 50% 0%, rgb(255 40 40 / 70%), transparent 65%);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

.wall {
  position: absolute;
  inset-inline: 0;
  inset-block-start: var(--header-height);
  block-size: 140px;
  background: var(--extra-backdrop);
}

.wire {
  position: absolute;
  inset-block-start: 6px;
  inset-inline: 0;
  inline-size: 100%;
  block-size: 38px;
  filter: var(--extra-wire-shadow);

  path {
    fill: none;
    stroke: var(--extra-wire);
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
  }
}

.bulb {
  position: absolute;
  inline-size: 12px;
  block-size: 20px;
  border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
  background: var(--extra-dark-glass);
  box-shadow: inset 0 0 0 20px color-mix(in srgb, var(--bulb) 35%, transparent);
  translate: -50% 4px;
  rotate: var(--tilt);
  transform-origin: 50% -4px;

  /* The socket on the wire. */
  &::before {
    content: '';
    position: absolute;
    inset-block-start: -6px;
    inset-inline-start: 2px;
    inline-size: 8px;
    block-size: 7px;
    border-radius: 2px;
    background: var(--extra-socket);
  }

  /* Lit: a hot white core in the bulb's color and a halo around it. */
  &::after {
    content: '';
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 58%, var(--extra-bulb-core) 0 8%, var(--bulb) 26%, transparent 70%);
    opacity: 0;
    transition: opacity 0.12s;
  }

  &.lit::after {
    opacity: 1;
  }
}

.letter {
  position: absolute;
  inset-block-start: 66px;
  color: var(--extra-paint);
  text-shadow: var(--extra-paint-shadow);
  font-family: var(--font-headings);
  font-size: clamp(16px, 1.8vw, 28px);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-transform: uppercase;
  translate: -50% 0;
  rotate: var(--tilt);
}

.other-side {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: var(--extra-other-side);
}

.spore {
  position: absolute;
  inline-size: var(--size);
  block-size: var(--size);
  border-radius: 50%;
  background: var(--extra-spore);
  box-shadow: var(--extra-spore-glow);

  .on & {
    animation: float var(--seconds) linear var(--delay) infinite;
  }
}

.lightning {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: var(--extra-lightning);
}

/* Hidden below the window, centered, until it lunges up. */
.visitor {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 50%;
  block-size: clamp(240px, 48vh, 460px);
  inline-size: auto;
  max-inline-size: none;
  transform: translate(-50%, 100%);
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }

  15%,
  85% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(var(--drift), calc(var(--rise) * -1));
  }
}

@media (prefers-reduced-motion: reduce) {
  .on .spore {
    animation: none;
  }
}
</style>
