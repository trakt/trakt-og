<!--
  The page goes dark and a round hatch rises in the middle of the window: a rusted copper double door in an iron
  rim, an octagon of trigrams raised on it around a swirling swan and a name. The swan turns like a lock, the two
  halves slide apart into the rim and light pours out. Inside, an old green terminal echoes the numbers that were typed, and the
  countdown under it clacks from 004:00 back to 108:00. Then the doors slide shut and the page comes back.
  Decorative: it never takes the pointer, and with reduced motion the hatch simply fades in already open.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;
type Point = readonly [number, number];

const { ondone }: ExtraProps = $props();

const ENTERED = '>: 4 8 15 16 23 42';
const BEFORE = ['0', '0', '4', ':', '0', '0'];
const AFTER = ['1', '0', '8', ':', '0', '0'];
const RISE_MS = 500;
const UNLOCK_MS = 900;
const OPEN_MS = 900;
const TYPE_MS = 40;
const FLIP_MS = 150;
const HOLD_MS = 2400;
const CLOSE_MS = 600;
const FADE_MS = 400;

// The door is drawn on a 200 by 200 grid around its middle.
const TAN = Math.tan(Math.PI / 8);
const round = (value: number) => Math.round(value * 10) / 10;
const turn = ([x, y]: Point, degrees: number): Point => {
  const angle = (degrees * Math.PI) / 180;
  return [100 + x * Math.cos(angle) - y * Math.sin(angle), 100 + x * Math.sin(angle) + y * Math.cos(angle)];
};
const shape = (points: readonly Point[], degrees: number) =>
  `M${points.map((point) => turn(point, degrees).map(round).join(' ')).join('L')}Z`;
// A regular octagon, flat side up, `apothem` from the middle to each side.
const octagon = (apothem: number) => {
  const corner = apothem / Math.cos(Math.PI / 8);
  const corners = Array.from({ length: 8 }, (_, index) => turn([0, -corner], index * 45 - 22.5).map(round).join(' '));
  return `M${corners.join('L')}Z`;
};

// Eight trigrams, top first and clockwise: each bar, inner to outer, whole (1) or split (0).
const TRIGRAMS = ['101', '011', '000', '110', '010', '100', '111', '001'];
const BAR = 6;
const SPLIT = 4;
const MARGIN = 2.6;
function bars(): string {
  return TRIGRAMS.flatMap((trigram, side) =>
    [...trigram].map((whole, index) => {
      const inner = 33 + index * 10;
      const outer = inner + BAR;
      const [a, b] = [inner * TAN - MARGIN, outer * TAN - MARGIN];
      if (whole === '1') return shape([[-a, -inner], [a, -inner], [b, -outer], [-b, -outer]], side * 45);
      const left = shape([[-a, -inner], [-SPLIT / 2, -inner], [-SPLIT / 2, -outer], [-b, -outer]], side * 45);
      const right = shape([[SPLIT / 2, -inner], [a, -inner], [b, -outer], [SPLIT / 2, -outer]], side * 45);
      return left + right;
    }),
  ).join('');
}
const BARS = bars();
const FRAME = `${octagon(70)}${octagon(64)}`;
const FIELD = octagon(64);
// The swan: seven crescent horns swirling around the middle, each sweeping out and around to a point.
const HORNS = 7;
const horn = (t: number, sweep: number, reach: number): Point => {
  const angle = (sweep * t * Math.PI) / 180;
  const radius = 6 + reach * t;
  return [radius * Math.sin(angle), -radius * Math.cos(angle)];
};
const SWAN = Array.from({ length: HORNS }, (_, index) => {
  const steps = Array.from({ length: 9 }, (_, step) => step / 8);
  const outer = steps.map((t) => horn(t, 70, 20));
  const inner = steps.map((t) => horn(t, 70 - 30 * (1 - t), 17)).reverse();
  return shape([...outer, ...inner], (index * 360) / HORNS);
}).join('');
const RIVETS = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2;
  return { x: round(100 + Math.cos(angle) * 91), y: round(100 + Math.sin(angle) * 91) };
});
// Scratches across the door, the same on every visit.
const SCRATCHES = Array.from({ length: 18 }, (_, index) => {
  const x = 30 + ((index * 53) % 140);
  const y = 30 + ((index * 97) % 140);
  const dx = ((index * 37) % 30) - 15;
  return `M${x} ${y}l${dx} ${8 + (index % 5) * 4}`;
}).join('');

let typed = $state('');
let counter = $state([...BEFORE]);
let root: HTMLElement | undefined;
const timers: number[] = [];
const animations: Animation[] = [];

const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
const animate = (selector: string, keyframes: Frames, options: Timing) => {
  const animation = root?.querySelector(selector)?.animate(keyframes, options);
  if (animation) animations.push(animation);
  return animation;
};

async function flip(index: number) {
  const card = root?.querySelectorAll('.card')[index];
  if (!card || counter[index] === AFTER[index]) return;
  if (prefersReducedMotion.current) {
    counter[index] = AFTER[index] ?? '';
    return;
  }
  const down = card.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], {
    duration: FLIP_MS,
    easing: 'ease-in',
  });
  animations.push(down);
  await wait(FLIP_MS);
  counter[index] = AFTER[index] ?? '';
  animations.push(
    card.animate([{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0)' }], { duration: FLIP_MS, easing: 'ease-out' }),
  );
}

async function play() {
  const reduced = prefersReducedMotion.current;
  const shown = [{ opacity: 0 }, { opacity: 1 }];
  const hidden = [{ opacity: 1 }, { opacity: 0 }];
  const apart = { duration: reduced ? 1 : OPEN_MS, easing: 'cubic-bezier(0.6, 0, 0.2, 1)', fill: 'forwards' } as const;
  animate('.dark', shown, { duration: FADE_MS, fill: 'forwards' });
  animate('.hatch', reduced ? shown : [{ opacity: 0, transform: 'translateY(30%) scale(0.9)' }, { opacity: 1, transform: 'none' }], {
    duration: RISE_MS,
    easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    fill: 'forwards',
  });
  await wait(RISE_MS + 100);

  if (!reduced) {
    animate('.lock .spin', [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], {
      duration: UNLOCK_MS,
      easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
    });
    await wait(UNLOCK_MS);
  }
  animate('.lock', hidden, { duration: 1, fill: 'forwards' });
  animate('.half.left', [{ transform: 'translateX(0)' }, { transform: 'translateX(-52%)' }], apart);
  animate('.half.right', [{ transform: 'translateX(0)' }, { transform: 'translateX(52%)' }], apart);
  animate('.light', shown, { duration: OPEN_MS, delay: reduced ? 0 : OPEN_MS / 3, fill: 'forwards' });
  await wait(reduced ? 300 : OPEN_MS);

  for (const letter of ENTERED) {
    typed += letter;
    if (!reduced) await wait(TYPE_MS);
  }
  await wait(400);
  for (const index of AFTER.keys()) {
    flip(index);
    if (!reduced) await wait(80);
  }
  await wait(HOLD_MS);

  if (!reduced) {
    const shut = { duration: CLOSE_MS, easing: 'cubic-bezier(0.6, 0, 1, 1)', fill: 'forwards' } as const;
    animate('.half.left', [{ transform: 'translateX(-52%)' }, { transform: 'translateX(0)' }], shut);
    animate('.half.right', [{ transform: 'translateX(52%)' }, { transform: 'translateX(0)' }], shut);
    animate('.light', hidden, { duration: CLOSE_MS, fill: 'forwards' });
    await wait(CLOSE_MS);
  }
  animate('.hatch', hidden, { duration: FADE_MS, fill: 'forwards' });
  animate('.dark', hidden, { duration: FADE_MS, fill: 'forwards' });
  await wait(FADE_MS);
  ondone();
}

// Runs once: it plays the whole sequence when it mounts.
const start: Attachment<HTMLElement> = (element) =>
  untrack(() => {
    root = element;
    document.body.append(element);
    play();
    return () => {
      for (const timer of timers) clearTimeout(timer);
      for (const animation of animations) animation.cancel();
      element.remove();
    };
  });
</script>

{#snippet face()}
  <svg viewBox="0 0 200 200">
    <circle class="plate" cx="100" cy="100" r="86" />
    <path class="scratches" d={SCRATCHES} />
    <path class="field" d={FIELD} />
    <g class="raised">
      <path d={FRAME} fill-rule="evenodd" />
      <path d={BARS} />
      <circle class="ring" cx="100" cy="100" r="29.5" />
    </g>
    <circle class="core" cx="100" cy="100" r="28" />
    <path class="swan" d={SWAN} />
    <text class="word" x="100" y="104">DHARMA</text>
    <path class="seam" d="M100 14v172" />
  </svg>
{/snippet}

<div class="extra" aria-hidden="true" {@attach start}>
  <svg class="defs" aria-hidden="true">
    <defs>
      <radialGradient id="extra-copper" cx="0.4" cy="0.35" r="0.85">
        <stop class="copper-light" offset="0" />
        <stop class="copper" offset="0.55" />
        <stop class="copper-dark" offset="1" />
      </radialGradient>
      <radialGradient id="extra-iron" cx="0.4" cy="0.3" r="0.8">
        <stop class="iron-light" offset="0" />
        <stop class="iron" offset="0.7" />
        <stop class="iron-dark" offset="1" />
      </radialGradient>
      <radialGradient id="extra-recess" cx="0.5" cy="0.45" r="0.6">
        <stop class="recess-light" offset="0" />
        <stop class="recess-dark" offset="1" />
      </radialGradient>
      <filter id="extra-rust" x="0" y="0" width="1" height="1">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="8" result="blotches" />
        <feColorMatrix in="blotches" type="matrix" values="0 0 0 0 0.24 0 0 0 0 0.08 0 0 0 0 0.03 0 0 0 -2.6 1.5" result="stains" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="speckle" />
        <feColorMatrix in="speckle" type="matrix" values="0 0 0 0 0.08 0 0 0 0 0.04 0 0 0 0 0.02 0 0 0 -2 1.2" result="grain" />
        <feMerge result="marks">
          <feMergeNode in="stains" />
          <feMergeNode in="grain" />
        </feMerge>
        <feComposite in="marks" in2="SourceGraphic" operator="in" result="rust" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="rust" />
        </feMerge>
      </filter>
    </defs>
  </svg>
  <div class="dark"></div>
  <div class="hatch">
    <div class="hole">
      <div class="light"></div>
      <div class="console">
        <p class="screen">{typed}<span class="cursor"></span></p>
        <div class="counter">
          {#each counter as digit, index (index)}
            <span class={['card', { colon: digit === ':' }]}>{digit}</span>
          {/each}
        </div>
      </div>
    </div>
    <div class="doors">
      <div class="half left">{@render face()}</div>
      <div class="half right">{@render face()}</div>
    </div>
    <svg class="lock" viewBox="0 0 200 200">
      <g class="spin">
        <circle class="core" cx="100" cy="100" r="28" />
        <path class="swan" d={SWAN} />
      </g>
      <text class="word" x="100" y="104">DHARMA</text>
    </svg>
    <svg class="rim" viewBox="0 0 200 200">
      <path class="iron" d="M100 2a98 98 0 1 0 0.01 0ZM100 16a84 84 0 1 1-0.01 0Z" fill-rule="evenodd" />
      {#each RIVETS as rivet, index (index)}
        <circle class="rivet" cx={rivet.x} cy={rivet.y} r="2.6" />
      {/each}
    </svg>
  </div>
</div>

<style>
.extra {
  --extra-night: rgb(8 6 4 / 88%);
  --extra-hole: #050403;
  --extra-light: radial-gradient(circle at 50% 60%, rgb(255 226 160 / 55%), rgb(255 190 110 / 15%) 45%, transparent 70%);
  --extra-copper-light: #d9a061;
  --extra-copper: #a8642e;
  --extra-copper-dark: #4e2812;
  --extra-iron-light: #6b5546;
  --extra-iron: #3a2a20;
  --extra-iron-dark: #1c130e;
  --extra-recess-light: #5a160c;
  --extra-recess-dark: #170504;
  --extra-raised: #d4975a;
  --extra-raised-shadow: drop-shadow(1px 1.5px 0 rgb(0 0 0 / 75%)) drop-shadow(-0.5px -0.5px 0 rgb(255 220 170 / 35%));
  --extra-core: #140504;
  --extra-scratch: rgb(255 225 185 / 18%);
  --extra-seam: rgb(10 4 2 / 85%);
  --extra-rivet: #1b120c;
  --extra-screen: #39ff7a;
  --extra-screen-glow: 0 0 8px rgb(57 255 122 / 70%);
  --extra-screen-bg: #020a04;
  --extra-card: #111;
  --extra-card-text: #f2f2f2;
  --extra-card-seam: rgb(255 255 255 / 12%);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

.defs {
  position: absolute;
  inline-size: 0;
  block-size: 0;
}

.dark {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: var(--extra-night);
}

.hatch {
  --size: min(64vh, 64vw);

  position: absolute;
  inset-block-start: calc(50% + var(--header-height) / 2);
  inset-inline-start: 50%;
  inline-size: var(--size);
  block-size: var(--size);
  margin-block-start: calc(var(--size) / -2);
  margin-inline-start: calc(var(--size) / -2);
  opacity: 0;

  > svg,
  .half svg {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }
}

.hole {
  position: absolute;
  inset: 8%;
  overflow: hidden;
  border-radius: 50%;
  background: var(--extra-hole);
  box-shadow: inset 0 0 40px rgb(0 0 0 / 90%);
}

.light {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: var(--extra-light);
}

.console {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: calc(var(--size) * 0.05);
}

.screen {
  min-inline-size: 11ch;
  margin: 0;
  padding: 0.4em 0.7em;
  border-radius: 4px;
  background: var(--extra-screen-bg);
  color: var(--extra-screen);
  font-family: var(--font-mono);
  font-size: calc(var(--size) * 0.045);
  text-shadow: var(--extra-screen-glow);
  white-space: pre;
}

.cursor {
  display: inline-block;
  inline-size: 0.55em;
  block-size: 1em;
  margin-inline-start: 2px;
  vertical-align: -0.15em;
  background: var(--extra-screen);
  animation: blink 1s steps(1) infinite;
}

.counter {
  display: flex;
  gap: calc(var(--size) * 0.01);
  perspective: 400px;
}

.card {
  display: grid;
  place-items: center;
  inline-size: calc(var(--size) * 0.085);
  block-size: calc(var(--size) * 0.12);
  border-radius: 4px;
  background: linear-gradient(var(--extra-card) 49%, var(--extra-card-seam) 49% 51%, var(--extra-card) 51%);
  color: var(--extra-card-text);
  font-family: var(--font-headings);
  font-size: calc(var(--size) * 0.085);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;

  &.colon {
    inline-size: auto;
    background: none;
  }
}

/* Two halves of one door face, sliding apart under the rim. */
.doors {
  position: absolute;
  inset: 0;
  clip-path: circle(43% at 50% 50%);
}

.half {
  position: absolute;
  inset: 0;

  &.left {
    clip-path: inset(0 50% 0 0);
  }

  &.right {
    clip-path: inset(0 0 0 50%);
  }
}

.plate {
  fill: url(#extra-copper);
  filter: url(#extra-rust);
}

.scratches {
  fill: none;
  stroke: var(--extra-scratch);
  stroke-width: 0.5;
}

.field {
  fill: url(#extra-recess);
}

.raised {
  fill: var(--extra-raised);
  filter: var(--extra-raised-shadow);

  .ring {
    fill: none;
    stroke: var(--extra-raised);
    stroke-width: 3;
  }
}

.core {
  fill: var(--extra-core);
}

.swan {
  fill: var(--extra-raised);
  filter: var(--extra-raised-shadow);
}

/* The word across the middle, raised like the rest; it stays put while the swan turns. */
.word {
  fill: var(--extra-raised);
  filter: var(--extra-raised-shadow);
  font-family: var(--font-headings);
  font-size: 11.5px;
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.4px;
  text-anchor: middle;
}

.spin {
  transform-box: view-box;
  transform-origin: 100px 100px;
}

.seam {
  fill: none;
  stroke: var(--extra-seam);
  stroke-width: 1.2;
}

.rim {
  .iron {
    fill: url(#extra-iron);
    filter: url(#extra-rust);
  }

  .rivet {
    fill: var(--extra-rivet);
  }
}

.copper-light {
  stop-color: var(--extra-copper-light);
}

.copper {
  stop-color: var(--extra-copper);
}

.copper-dark {
  stop-color: var(--extra-copper-dark);
}

.iron-light {
  stop-color: var(--extra-iron-light);
}

.iron {
  stop-color: var(--extra-iron);
}

.iron-dark {
  stop-color: var(--extra-iron-dark);
}

.recess-light {
  stop-color: var(--extra-recess-light);
}

.recess-dark {
  stop-color: var(--extra-recess-dark);
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
