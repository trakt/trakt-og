<!--
  The site glitches through other dimensions, a beat each, torn between them: noir (black and white, in the rain),
  anime (hot pinks and blues, speed lines) and comic. It lands on the comic and stays: punched-up colors printed a
  little off register, halftone dots, white gutters cutting the window into panels, caption boxes and sound effects
  popping in. Then web lines shoot from the switch to the corners and edges of the window, and inked webs spin out
  from each one. A few seconds later, or when it's switched off, the webs drop away, it tears once more and the site
  comes back. Decorative: it never
  takes the pointer, and with reduced motion it skips the glitches and simply fades to the comic with its webs.
-->
<script lang="ts">
import { tick, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';
import { type Frame, shakenFrames, tornFrames } from './glitchFrames.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;
type Dimension = 'noir' | 'anime' | 'comic';
type Strand = { readonly d: string; readonly delay: number; readonly draw: number; readonly kind: 'shot' | 'spoke' | 'ring' };
type Thwip = { readonly x: number; readonly y: number; readonly delay: number };

const { ondone, stop = false }: ExtraProps = $props();

const HOPS: readonly (readonly [Dimension, string])[] = [
  ['noir', 'Earth-90214'],
  ['anime', 'Earth-14512'],
  ['comic', 'Earth-65'],
];
const TEAR_MS = 260;
const TEAR_FRAMES = 3;
const STAY_MS = 560;
const SHOT_STAGGER_MS = 140;
// From the first web line to the last ring spun.
const WEBS_MS = 2000;
const DROP_MS = 450;
// How long it holds, comic and webbed, once the last web is spun, before it lets go by itself.
const HOLD_MS = 3500;

let dimension = $state<Dimension | null>(null);
let earth = $state('');
let strands = $state<Strand[]>([]);
let thwips = $state<Thwip[]>([]);
let size = $state({ width: 1000, height: 1000 });
let root: HTMLElement | undefined;
let leaving = false;
const timers: number[] = [];
const animations: Animation[] = [];

const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
const play = (element: Element | null | undefined, keyframes: Frames, options: Timing) => {
  const animation = element?.animate(keyframes, options);
  if (animation) animations.push(animation);
};
const pop: Frame[] = [
  { offset: 0, opacity: 0, transform: 'scale(0.2) rotate(-12deg)' },
  { offset: 0.7, opacity: 1, transform: 'scale(1.15) rotate(4deg)' },
  { offset: 1, opacity: 1, transform: 'none' },
];

function enter(next: Dimension | null) {
  dimension = next;
  if (next) document.documentElement.setAttribute('data-verse', next);
  else document.documentElement.removeAttribute('data-verse');
}

async function tear() {
  if (prefersReducedMotion.current) return;
  const page = document.querySelector('main');
  if (page) play(page, tornFrames(page, TEAR_FRAMES), { duration: TEAR_MS });
  play(document.querySelector('header.top-nav'), shakenFrames(TEAR_FRAMES), { duration: TEAR_MS });
  await wait(TEAR_MS);
}

// A slightly hand-drawn point: its distance from the anchor wavers a little, like an inked line.
const waver = () => 1 + (Math.random() - 0.5) * 0.08;
const tenth = (value: number) => Math.round(value * 10) / 10;
const point = (x: number, y: number, angle: number, radius: number): readonly [number, number] => [
  tenth(x + Math.cos(angle) * radius),
  tenth(y + Math.sin(angle) * radius),
];

// One web: spokes fanning out from an anchor across an arc, then rings of sagging silk between them.
function web(x: number, y: number, from: number, to: number, reach: number, delay: number): Strand[] {
  const spokes = 9;
  const angles = Array.from({ length: spokes }, (_, index) => ((from + ((to - from) * index) / (spokes - 1)) * Math.PI) / 180);
  const out: Strand[] = angles.map((angle, index) => {
    const [ex, ey] = point(x, y, angle, reach * waver());
    return { d: `M${x} ${y}L${ex} ${ey}`, delay: delay + index * 25, draw: 260, kind: 'spoke' };
  });
  const gap = reach / 8;
  for (let radius = gap; radius < reach * 0.96; radius += gap * waver()) {
    const corners = angles.map((angle) => point(x, y, angle, radius * waver()));
    const [first, ...rest] = corners;
    if (!first) continue;
    let d = `M${first[0]} ${first[1]}`;
    let previous = first;
    for (const corner of rest) {
      const [mx, my] = [(previous[0] + corner[0]) / 2, (previous[1] + corner[1]) / 2];
      d += `Q${Math.round(mx + (x - mx) * 0.12)} ${Math.round(my + (y - my) * 0.12)} ${corner[0]} ${corner[1]}`;
      previous = corner;
    }
    out.push({ d, delay: delay + 220 + (radius / gap) * 45, draw: 380, kind: 'ring' });
  }
  return out;
}

async function spin() {
  const { innerWidth: width, innerHeight: height } = window;
  size = { width, height };
  const badge = document.querySelector('.spot.badge')?.getBoundingClientRect();
  const [sx, sy] = badge ? [badge.left + badge.width / 2, badge.top + badge.height / 2] : [width / 2, height / 3];
  const reach = Math.min(width, height) * 0.38;
  const anchors: readonly (readonly [number, number, number, number, number])[] = [
    [0, 0, 0, 90, reach],
    [width, 0, 90, 180, reach],
    [0, height, 270, 360, reach],
    [width, height, 180, 270, reach],
    [width * 0.56, 0, 0, 180, reach * 0.7],
    [0, height * 0.55, 270, 450, reach * 0.7],
  ];
  const next: Strand[] = [];
  const pops: Thwip[] = [];
  anchors.forEach(([x, y, from, to, span], index) => {
    const delay = index * SHOT_STAGGER_MS;
    const bend = (Math.random() - 0.5) * 80;
    next.push({ d: `M${sx} ${sy}Q${(sx + x) / 2 + bend} ${(sy + y) / 2 - Math.abs(bend)} ${x} ${y}`, delay, draw: 220, kind: 'shot' });
    next.push(...web(x, y, from, to, span, delay + 260));
    pops.push({ x: Math.min(width - 90, Math.max(90, x)), y: Math.min(height - 60, Math.max(110, y)), delay: delay + 180 });
  });
  strands = next;
  thwips = pops;
  await tick();
  const reduced = prefersReducedMotion.current;
  root?.querySelectorAll<SVGPathElement>('.webs path').forEach((path) => {
    const strand = next[Number(path.dataset.index)];
    if (!strand) return;
    play(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: reduced ? 1 : strand.draw,
      delay: reduced ? 0 : strand.delay,
      easing: 'ease-out',
      fill: 'forwards',
    });
  });
  root?.querySelectorAll('.thwip').forEach((word, index) => {
    play(
      word,
      [
        { offset: 0, opacity: 0, transform: 'scale(0.3)' },
        { offset: 0.3, opacity: 1, transform: 'scale(1.2)' },
        { offset: 0.7, opacity: 1, transform: 'scale(1)' },
        { offset: 1, opacity: 0, transform: 'scale(1)' },
      ],
      { duration: reduced ? 1 : 900, delay: reduced ? 0 : (pops[index]?.delay ?? 0), fill: 'forwards' },
    );
  });
}

async function arrive() {
  const reduced = prefersReducedMotion.current;
  if (reduced) {
    enter('comic');
  } else {
    for (const [hop, name] of HOPS) {
      await tear();
      if (leaving) return;
      enter(hop);
      earth = name;
      await wait(STAY_MS);
    }
    await tear();
    earth = '';
  }
  if (leaving) return;
  play(root?.querySelector('.panels'), [{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
  root?.querySelectorAll('.pop').forEach((element, index) => {
    play(element, pop, { duration: reduced ? 1 : 420, delay: reduced ? 0 : 150 + index * 220, easing: 'ease-out', fill: 'forwards' });
  });
  await wait(reduced ? 0 : 500);
  if (leaving) return;
  await spin();
  await wait(reduced ? HOLD_MS : WEBS_MS + HOLD_MS);
  leave();
}

async function leave() {
  if (leaving) return;
  leaving = true;
  play(root?.querySelector('.webs'), [{ transform: 'none', opacity: 1 }, { transform: 'translateY(80px)', opacity: 0 }], {
    duration: prefersReducedMotion.current ? 1 : DROP_MS,
    easing: 'ease-in',
    fill: 'forwards',
  });
  await wait(DROP_MS);
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
    root = element;
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
  <svg class="panels" viewBox="0 0 1000 1000" preserveAspectRatio="none">
    <path class="gutter edge" d="M0 420 1000 360M560 0 520 410M640 380 700 1000" />
    <path class="gutter" d="M0 420 1000 360M560 0 520 410M640 380 700 1000" />
  </svg>
  <p class="caption pop first">Let's do this one last time.</p>
  <p class="caption pop second">Anyone can wear the mask.</p>
  <svg class="burst pop thwack" viewBox="0 0 160 110">
    <path d="M80 4 92 30 122 14 114 44 154 46 120 64 146 92 108 82 96 106 80 84 62 106 54 80 14 92 40 64 4 46 44 42 34 12 66 30Z" />
    <text x="80" y="58">Thwip!</text>
  </svg>
  <svg class="burst pop pow" viewBox="0 0 160 110">
    <path d="M80 4 92 30 122 14 114 44 154 46 120 64 146 92 108 82 96 106 80 84 62 106 54 80 14 92 40 64 4 46 44 42 34 12 66 30Z" />
    <text x="80" y="58">Pow!</text>
  </svg>
  {#if earth}<p class="earth">{earth}</p>{/if}
  <svg class="webs" viewBox="0 0 {size.width} {size.height}">
    {#each strands as strand, index (index)}
      <path class={['ink', strand.kind]} d={strand.d} data-index={index} pathLength="1" />
    {/each}
    {#each strands as strand, index (index)}
      <path class={['silk', strand.kind]} d={strand.d} data-index={index} pathLength="1" />
    {/each}
  </svg>
  {#each thwips as thwip, index (index)}
    <p class="thwip" style:left="{thwip.x}px" style:top="{thwip.y}px">Thwip!</p>
  {/each}
</div>

<style>
.extra {
  --extra-ink: #111;
  --extra-silk: #fffdf6;
  --extra-caption: #ffe14d;
  --extra-red: #e8132b;
  --extra-cyan: #00d2ff;
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
.halftone,
.panels,
.webs {
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

.webs {
  opacity: 1;
  overflow: visible;
}

.gutter {
  fill: none;
  stroke: var(--extra-white);
  stroke-width: 9;
  vector-effect: non-scaling-stroke;

  &.edge {
    stroke: var(--extra-ink);
    stroke-width: 15;
  }
}

/* Comic lettering: heavy, tilted capitals. */
.caption,
.burst text,
.earth,
.thwip {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;
}

.caption {
  position: absolute;
  max-inline-size: min(40vw, 420px);
  margin: 0;
  padding: 8px 14px;
  border: 3px solid var(--extra-ink);
  background: var(--extra-caption);
  box-shadow: 5px 5px 0 var(--extra-ink);
  color: var(--extra-ink);
  font-size: clamp(16px, 1.6vw, 24px);
  line-height: 1.1;
  opacity: 0;
  transform-origin: 0 0;
  rotate: -2deg;

  &.first {
    inset-block-start: calc(var(--header-height) + 3vh);
    inset-inline-start: 3vw;
  }

  &.second {
    inset-block-end: 24vh;
    inset-inline-end: 5vw;
    rotate: 1.5deg;
  }
}

.burst {
  position: absolute;
  inline-size: clamp(130px, 14vw, 200px);
  opacity: 0;

  path {
    stroke: var(--extra-ink);
    stroke-width: 4;
    stroke-linejoin: round;
  }

  text {
    font-size: 28px;
    letter-spacing: 1px;
    text-anchor: middle;
    dominant-baseline: middle;
    stroke: var(--extra-ink);
    stroke-width: 1.5;
  }

  &.thwack {
    inset-block-start: calc(var(--header-height) + 4vh);
    inset-inline-end: 22vw;

    path {
      fill: var(--extra-caption);
    }

    text {
      fill: var(--extra-red);
    }
  }

  &.pow {
    inset-block-end: 12vh;
    inset-inline-start: 26vw;

    path {
      fill: var(--extra-cyan);
    }

    text {
      fill: var(--extra-white);
    }
  }
}

.earth {
  position: absolute;
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
}

/* Inked webs: thick black line under white silk, drawn out along each strand. */
.ink,
.silk {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}

.ink {
  stroke: var(--extra-ink);

  &.shot {
    stroke-width: 6;
  }

  &.spoke {
    stroke-width: 4.4;
  }

  &.ring {
    stroke-width: 3.4;
  }
}

.silk {
  stroke: var(--extra-silk);

  &.shot {
    stroke-width: 2.6;
  }

  &.spoke {
    stroke-width: 1.9;
  }

  &.ring {
    stroke-width: 1.3;
  }
}

.thwip {
  position: absolute;
  margin: 0;
  color: var(--extra-white);
  font-size: clamp(24px, 2.6vw, 38px);
  letter-spacing: 0.05em;
  opacity: 0;
  translate: -50% -50%;
  rotate: -6deg;
  -webkit-text-stroke: 1.5px var(--extra-ink);
  text-shadow: 3px 3px 0 var(--extra-red);
}

/* The site in each dimension: header, page and footer together. */
:global(html[data-verse='noir'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: grayscale(1) contrast(1.9) brightness(0.85);
}

:global(html[data-verse='anime'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: hue-rotate(-40deg) saturate(2.2) brightness(1.1) contrast(0.95);
}

:global(html[data-verse='comic'] :is(header.top-nav, #content, #content ~ footer)) {
  filter: saturate(1.7) contrast(1.25) drop-shadow(3px 0 rgb(0 235 255 / 60%)) drop-shadow(-3px 0 rgb(255 0 140 / 60%));
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
