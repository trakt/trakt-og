<!--
  A Cylon scan on each visit: the fanart washes red and a scanner light sweeps it three times while a readout counts
  subjects. Then the light rises into the site bar and locks onto the visitor's avatar, "CYLON DETECTED" with their
  name, and a few seconds later the readout says "So say we all." and everything fades but a faint red ring on the
  avatar. Signed out, there is no avatar to flag, so nobody is. Reduced motion skips the light and its rise.
-->
<script lang="ts">
import { page } from '$app/state';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';

const SUBJECTS = 12;
const PASSES = 3;
const PASS_MS = 1700;
const STEPS = { scan: 400, rise: 5500, lock: 6400, done: 9400, gone: 12_400 };
const STILL_STEPS = { scan: 400, rise: 400, lock: 1200, done: 4200, gone: 7200 };

const pad = (count: number) => String(count).padStart(2, '0');

let step = $state(0);
let scanned = $state(0);
let target = $state<DOMRect>();
let eye: HTMLElement | undefined = $state();
let back = $state(false);
const still = prefersReducedMotion.current;
const name = $derived((page.data.user?.firstName || page.data.user?.slug)?.toUpperCase());
const lines = $derived.by(() => {
  if (step >= 4) return ['So say we all.'];
  if (step >= 3) return ['SCAN COMPLETE', `${target ? 1 : 0} OF ${SUBJECTS} FLAGGED`];
  if (step >= 2) return ['TARGET ACQUIRED', `SUBJECTS SCANNED ${SUBJECTS} / ${SUBJECTS}`];
  return ['SCANNING FOR CYLONS', `SUBJECTS SCANNED ${pad(scanned)} / ${SUBJECTS}`];
});

const avatar = () => document.querySelector('.top-nav .profile .avatar')?.getBoundingClientRect();

const pin: Attachment<HTMLElement> = (layer) => {
  const shade = document.querySelector('.fanart-header .shadow-base');
  if (!shade) {
    layer.hidden = true;
    return;
  }
  shade.after(layer);
  const steps = still ? STILL_STEPS : STEPS;
  const start = performance.now();
  const timers = [
    window.setTimeout(() => (step = 1), steps.scan),
    window.setTimeout(rise, steps.rise),
    window.setTimeout(() => (step = 3), steps.lock),
    window.setTimeout(() => (step = 4), steps.done),
    window.setTimeout(() => (step = 5), steps.gone),
  ];
  let frame = 0;

  function rise() {
    target = avatar();
    step = 2;
    if (!eye || !target || still) return;
    const box = layer.getBoundingClientRect();
    back = false;
    eye.style.transform = `translateX(${target.left - box.left + target.width / 2}px)`;
  }

  function sweep(now: number) {
    const elapsed = now - start - steps.scan;
    if (step >= 2) return;
    if (elapsed >= 0) {
      const progress = elapsed / PASS_MS;
      const pass = Math.min(PASSES - 1, Math.floor(progress));
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, progress - pass));
      back = pass % 2 === 1;
      if (eye) eye.style.transform = `translateX(${(pass % 2 ? 1 - eased : eased) * layer.clientWidth}px)`;
      scanned = Math.min(SUBJECTS, Math.floor((progress / PASSES) * (SUBJECTS + 1)));
    }
    frame = requestAnimationFrame(sweep);
  }

  const onresize = () => {
    if (step >= 2) target = avatar();
  };
  window.addEventListener('resize', onresize);
  if (still) scanned = SUBJECTS;
  else frame = requestAnimationFrame(sweep);
  return () => {
    timers.forEach(clearTimeout);
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onresize);
    layer.remove();
  };
};

const lift: Attachment<HTMLElement> = (node) => {
  document.body.append(node);
  return () => node.remove();
};
</script>

<div class={['cylon', { scan: step >= 1, rise: step >= 2, done: step >= 4, gone: step >= 5 }]} {@attach pin}>
  <div class="wash"></div>
  {#if !still}
    <div class={['eye', { back }]} bind:this={eye}><span class="trail"></span><span class="core"></span><span class="slot"></span></div>
  {/if}
  <p class={['readout', { say: step >= 4 }]} aria-hidden="true">
    {#each lines as line (line)}<span>{line}</span>{/each}
  </p>
</div>

{#if target && step >= 3}
  <div
    class={['lock', { done: step >= 4 }]}
    style:inset-block-start="{target.top}px"
    style:inset-inline-start="{target.left}px"
    style:inline-size="{target.width}px"
    style:block-size="{target.height}px"
    aria-hidden="true"
    {@attach lift}
  >
    <span class="ring"></span>
    <span class="brackets"><i></i><i></i><i></i><i></i></span>
    <span class="label">CYLON DETECTED{#if name}&nbsp;· {name}{/if}</span>
  </div>
{/if}

<style>
.cylon,
.lock {
  --cylon-red: #ff2a1a;
  --cylon-hot: #ff7a60;
  --cylon-text: #ff7058;
  --cylon-soft: #ffb0a4;
  --cylon-glow: rgb(255 30 20 / 80%);
  --cylon-trail: rgb(255 30 20 / 38%);
  --cylon-wash: rgb(60 0 0 / 38%);
  --cylon-panel: rgb(0 0 0 / 68%);
  --cylon-ring: rgb(255 60 40 / 40%);
  --cylon-white: #fff;
}

.cylon {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wash {
  position: absolute;
  inset: 0;
  background: var(--cylon-wash);
  opacity: 0;
  transition: opacity 0.6s;

  .scan & {
    opacity: 1;
  }

  .gone & {
    opacity: 0;
    transition-duration: 1.2s;
  }
}

/* Over the site bar, so it can rise into it. */
.eye {
  position: absolute;
  inset-block: var(--header-height) var(--stats-height);
  inset-inline-start: 0;
  z-index: calc(var(--z-header) + 1);
  opacity: 0;

  .scan & {
    opacity: 1;
  }

  .rise & {
    inset-block: 0 calc(100% - var(--header-height));
    transition: transform 0.9s cubic-bezier(0.6, 0, 0.3, 1), inset-block 0.9s;
  }

  .done & {
    opacity: 0;
    transition: opacity 0.9s;
  }
}

.core {
  position: absolute;
  inset-block: 0;
  inset-inline-start: -3px;
  inline-size: 6px;
  background: linear-gradient(to bottom, transparent, var(--cylon-red) 15%, var(--cylon-hot) 50%, var(--cylon-red) 85%, transparent);
  box-shadow: 0 0 17px 4px var(--cylon-glow);
}

.trail {
  position: absolute;
  inset-block: 0;
  inset-inline-start: -230px;
  inline-size: 230px;
  background: linear-gradient(to right, transparent, var(--cylon-trail));

  .back & {
    inset-inline-start: 0;
    background: linear-gradient(to left, transparent, var(--cylon-trail));
  }
}

.slot {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: -49px;
  inline-size: 98px;
  block-size: 17px;
  translate: 0 -50%;
  background: radial-gradient(ellipse at center, var(--cylon-white) 0, var(--cylon-hot) 22%, transparent 70%);
  filter: blur(2px);
}

.readout {
  position: absolute;
  inset-block-start: calc(var(--header-height) + 30px);
  inset-inline-start: 30px;
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 10px 16px;
  border-inline-start: 3px solid var(--cylon-red);
  background: var(--cylon-panel);
  color: var(--cylon-text);
  font: 16px/1.35 var(--font-mono);
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.4s;

  span + span {
    color: var(--cylon-soft);
  }

  .scan & {
    opacity: 1;
  }

  .gone & {
    opacity: 0;
    transition-duration: 1.2s;
  }

  &.say {
    color: var(--cylon-white);
    font: var(--font-weight-headings-heavy) 28px/1.2 var(--font-headings);
    letter-spacing: 0;
  }
}

.lock {
  position: fixed;
  z-index: calc(var(--z-header) + 1);
  pointer-events: none;
}

.ring {
  position: absolute;
  inset: 0;
  border: 2px solid var(--cylon-red);
  border-radius: 50%;
  box-shadow: 0 0 16px var(--cylon-glow);
  transition: border-color 0.9s, box-shadow 0.9s;

  .done & {
    border-color: transparent;
    box-shadow: 0 0 0 3px var(--cylon-ring);
  }
}

.brackets {
  position: absolute;
  inset: -8px;
  animation: close 0.6s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  transition: opacity 0.6s;

  .done & {
    opacity: 0;
  }

  i {
    position: absolute;
    inline-size: 13px;
    block-size: 13px;
    border: 0 solid var(--cylon-red);
    filter: drop-shadow(0 0 4px var(--cylon-glow));
  }

  i:nth-child(1) {
    inset-block-start: 0;
    inset-inline-start: 0;
    border-width: 3px 0 0 3px;
  }

  i:nth-child(2) {
    inset-block-start: 0;
    inset-inline-end: 0;
    border-width: 3px 3px 0 0;
  }

  i:nth-child(3) {
    inset-block-end: 0;
    inset-inline-start: 0;
    border-width: 0 0 3px 3px;
  }

  i:nth-child(4) {
    inset-block-end: 0;
    inset-inline-end: 0;
    border-width: 0 3px 3px 0;
  }
}

.label {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: calc(100% + 20px);
  translate: 0 -50%;
  padding: 4px 10px;
  border-radius: 3px;
  background: var(--cylon-panel);
  color: var(--cylon-text);
  font: 15px var(--font-mono);
  letter-spacing: 0.08em;
  white-space: nowrap;
  animation: show 0.4s both;
  transition: opacity 0.6s;

  .done & {
    opacity: 0;
  }
}

@keyframes close {
  from {
    inset: -40px;
    opacity: 0;
  }
}

@keyframes show {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cylon *,
  .lock * {
    transition: none;
    animation: none;
  }
}
</style>
