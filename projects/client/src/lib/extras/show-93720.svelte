<!--
  The page glitches and tears, then a black terminal takes over the window and types commands about you: who you are,
  how far into the show you've got, and a fake delete of your watchlist it takes back. It signs off with "hello,
  friend.", glitches again and hands the page back. A second click or Esc closes it early. Decorative: it never
  takes the pointer, and with reduced motion there's no glitch and the lines appear whole.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import { overlay } from '$lib/overlay/overlay';
import type { ExtraProps } from './extras.ts';
import { type Line, terminalLines } from './show-93720.lines.ts';

const { ondone, viewer, stop = false }: ExtraProps = $props();

const SHOW_ID = 93720;
const EPISODES = 45; // the whole show, four seasons
const SIGN_OFF = 'hello, friend.';
const GLITCH_MS = 1100;
// Distinct frames a glitch jumps between, about ten a second.
const FRAMES = 11;
const TYPE_MS = 34;
const ANSWER_MS = 12;
const LINE_PAUSE_MS = 240;
const HOLD_MS = 1600;
const CLOSE_MS = 300;
const TEARS = Array.from({ length: 10 }, (_, index) => ({
  height: 3 + Math.random() * 18,
  kind: ['red', 'cyan', 'light', 'dropout'][index % 4],
}));

type Frame = { offset: number; easing?: string; [property: string]: string | number | undefined };

const jump = (index: number) => ({ offset: index / FRAMES, easing: 'steps(1)' });
const fringe = (shift: number) =>
  `drop-shadow(${shift}px 0 rgb(255 0 60 / 75%)) drop-shadow(${-shift}px 0 rgb(0 255 240 / 75%))`;

// The page torn into one band of the window at a time, thrown sideways with red and cyan fringes, and now and then
// whole again, so the tear reads as flicker.
function tornFrames(element: Element): Frame[] {
  const box = element.getBoundingClientRect();
  const windowTop = Math.max(0, -box.top);
  const frames = Array.from({ length: FRAMES }, (_, index) => {
    const shift = (Math.random() - 0.5) * 90;
    const top = windowTop + Math.random() * innerHeight * 0.7;
    const band = 60 + Math.random() * innerHeight * 0.45;
    const whole = index % 4 === 3;
    return {
      ...jump(index),
      transform: `translateX(${shift}px) skewX(${(Math.random() - 0.5) * 6}deg)`,
      clipPath: whole ? 'inset(0 0 0 0)' : `inset(${top}px 0 ${Math.max(0, box.height - top - band)}px 0)`,
      filter: fringe(shift / 5),
    };
  });
  return [...frames, { offset: 1, transform: 'none', clipPath: 'inset(0 0 0 0)', filter: 'none' }];
}

function shakenFrames(): Frame[] {
  const frames = Array.from({ length: FRAMES }, (_, index) => {
    const shift = (Math.random() - 0.5) * 40;
    return { ...jump(index), transform: `translateX(${shift}px)`, filter: fringe(shift / 4) };
  });
  return [...frames, { offset: 1, transform: 'none', filter: 'none' }];
}

// A bar of bad signal, jumping to a new height on each frame, or gone.
function barFrames(): Frame[] {
  const frames = Array.from({ length: FRAMES }, (_, index) => ({
    ...jump(index),
    opacity: Math.random() < 0.65 ? 1 : 0,
    transform: `translateY(${Math.random() * innerHeight}px) scaleY(${0.5 + Math.random() * 2.5})`,
  }));
  return [...frames, { offset: 1, opacity: 0 }];
}

let shown = $state<Line[]>([]);
let signOff = $state('');
let open = $state(false);
let root: HTMLElement | undefined;
let over = false;
const timers: number[] = [];
const animations: Animation[] = [];

const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));

async function glitch() {
  if (prefersReducedMotion.current) return;
  const run = (element: Element | null | undefined, frames: Frame[]) => {
    const animation = element?.animate(frames, { duration: GLITCH_MS });
    if (animation) animations.push(animation);
  };
  const page = document.querySelector('main');
  if (page) run(page, tornFrames(page));
  run(document.querySelector('header.top-nav'), shakenFrames());
  run(root?.querySelector('.scanlines'), [{ offset: 0, opacity: 1 }, { offset: 0.92, opacity: 1 }, { offset: 1, opacity: 0 }]);
  for (const bar of root?.querySelectorAll('.tear') ?? []) run(bar, barFrames());
  await wait(GLITCH_MS);
}

async function type(line: Line) {
  const index = shown.length;
  shown.push({ ...line, text: '' });
  if (prefersReducedMotion.current) {
    shown[index] = line;
    return;
  }
  for (const letter of line.text) {
    if (over) return;
    shown[index] = { ...line, text: (shown[index]?.text ?? '') + letter };
    await wait(line.typed ? TYPE_MS : ANSWER_MS);
  }
}

async function close() {
  const fade = root?.querySelector('.terminal')?.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: CLOSE_MS,
    fill: 'forwards',
  });
  if (fade) animations.push(fade);
  await wait(CLOSE_MS);
  ondone();
}

async function play() {
  const watched = untrack(() => overlay.state('show', SHOW_ID).watchedEpisodes ?? 0);
  await glitch();
  open = true;
  for (const line of terminalLines({ viewer, watched, total: EPISODES })) {
    if (over) return;
    await type(line);
    await wait(LINE_PAUSE_MS);
  }
  for (const letter of SIGN_OFF) {
    if (over) return;
    signOff += letter;
    await wait(prefersReducedMotion.current ? 0 : 70);
  }
  await wait(HOLD_MS);
  if (over) return;
  over = true;
  open = false;
  await glitch();
  ondone();
}

$effect(() => {
  if (!stop || over) return;
  over = true;
  untrack(close);
});

// Runs once: it starts the whole sequence when it mounts.
const start: Attachment<HTMLElement> = (element) =>
  untrack(() => {
    root = element;
    document.body.append(element);
    play();
    return () => {
      over = true;
      for (const timer of timers) clearTimeout(timer);
      for (const animation of animations) animation.cancel();
      element.remove();
    };
  });
</script>

<div class="extra" aria-hidden="true" {@attach start}>
  <div class="scanlines"></div>
  {#each TEARS as tear, index (index)}
    <span class={['tear', tear.kind]} style:height="{tear.height}px"></span>
  {/each}
  {#if open}
    <div class="terminal">
      {#each shown as line, index (index)}
        <p>{#if line.typed}<span class="prompt">$</span>{/if}{line.text}</p>
      {/each}
      {#if signOff}
        <p class="sign-off">{signOff}<span class="cursor"></span></p>
      {/if}
    </div>
  {/if}
</div>

<style>
.extra {
  --extra-black: #050505;
  --extra-text: #e8e8e8;
  --extra-prompt: #e8343a;
  --extra-tear-red: rgb(255 30 60 / 80%);
  --extra-tear-cyan: rgb(0 240 255 / 70%);
  --extra-tear-light: rgb(255 255 255 / 45%);
  --extra-dropout: rgb(0 0 0 / 85%);
  --extra-scanline: rgb(0 0 0 / 35%);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

/* While it glitches: scanlines over everything, and bars of bad signal jumping up and down the window. */
.scanlines {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: repeating-linear-gradient(transparent 0 2px, var(--extra-scanline) 2px 4px);
}

.tear {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  opacity: 0;
  transform-origin: top;
  mix-blend-mode: screen;

  &.red {
    background: var(--extra-tear-red);
  }

  &.cyan {
    background: var(--extra-tear-cyan);
  }

  &.light {
    background: var(--extra-tear-light);
  }

  &.dropout {
    background: var(--extra-dropout);
    mix-blend-mode: normal;
  }
}

.terminal {
  position: absolute;
  inset: 0;
  padding-block: calc(var(--header-height) + 32px) 32px;
  padding-inline: 48px;
  background: var(--extra-black);
  color: var(--extra-text);
  font-family: var(--font-mono);
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;

  p {
    margin: 0;
  }
}

.prompt {
  margin-inline-end: 1ch;
  color: var(--extra-prompt);
}

.sign-off {
  margin-block-start: 24px;
  font-size: 40px;
  font-weight: var(--font-weight-headings-heavy);
}

.cursor {
  display: inline-block;
  inline-size: 0.5em;
  block-size: 0.9em;
  margin-inline-start: 4px;
  vertical-align: -0.1em;
  background: var(--extra-text);
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
</style>
