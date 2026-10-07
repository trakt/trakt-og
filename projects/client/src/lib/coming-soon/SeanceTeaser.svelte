<!--
  "Séance of the Watch": a Ouija board between two candles. The planchette follows the pointer, and resting it on a
  letter spells it. Spell a word the spirits know (see spellOuija) and they take over: the room goes dark, the candles
  gutter, the board shudders and the planchette tears loose to spell their answer on its own (toPossession). Then a
  ghost rises out of the board, their reply appears and the candles flare back.
-->
<script lang="ts">
import { fitToParent } from './fitToParent.ts';
import { spellOuija, type SpiritReply } from './spellOuija.ts';
import { toArcLetters } from './toArcLetters.ts';
import { toPossession } from './toPossession.ts';
import TraktMark from './TraktMark.svelte';

const DWELL_MS = 450;
const DARK_MS = 900;
const STEP_MS = 850;
const REVEAL_MS = 4800;
const HINT = 'Rest the planchette on a letter to spell. Rest it on Goodbye to start over.';
const REST = { x: 500, y: 150 };
const YES = { x: 255, y: 94 };

const letters = [
  ...toArcLetters({
    letters: 'ABCDEFGHIJKLM',
    from: { x: 150, y: 296 },
    control: { x: 500, y: 40 },
    to: { x: 850, y: 296 },
  }),
  ...toArcLetters({
    letters: 'NOPQRSTUVWXYZ',
    from: { x: 140, y: 392 },
    control: { x: 500, y: 160 },
    to: { x: 860, y: 392 },
  }),
];

let phase = $state<'idle' | 'possessed' | 'revealed'>('idle');
let pointer = $state<{ x: number; y: number } | null>(null);
let guided = $state<{ x: number; y: number } | null>(null);
let hovered = $state<string | null>(null);
let spelled = $state('');
let spirit = $state('');
let current = $state<string | null>(null);
let message = $state<string | null>(null);
let dwell: ReturnType<typeof setTimeout> | undefined;
let timers: ReadonlyArray<ReturnType<typeof setTimeout>> = [];

const later = (ms: number, run: () => void) => {
  timers = [...timers, setTimeout(run, ms)];
};

$effect(() => () => {
  clearTimeout(dwell);
  timers.forEach(clearTimeout);
});

const possess = (reply: SpiritReply) => {
  const steps = toPossession({ answer: reply.answer, letters, yes: YES });
  const revealAt = DARK_MS + steps.length * STEP_MS;

  phase = 'possessed';
  guided = pointer ?? REST;
  hovered = null;
  spelled = '';
  spirit = '';
  steps.forEach((step, index) =>
    later(DARK_MS + index * STEP_MS, () => {
      guided = { x: step.x, y: step.y };
      current = step.letter;
      if (step.letter) spirit = `${spirit}${step.letter}`;
    })
  );
  later(revealAt, () => {
    phase = 'revealed';
    current = null;
    message = reply.text;
  });
  later(revealAt + REVEAL_MS, () => {
    phase = 'idle';
    guided = null;
    spirit = '';
  });
};

const commit = (letter: string) => {
  const result = spellOuija({ spelled, letter });
  spelled = result.spelled;
  if (result.reply) possess(result.reply);
};

const follow = (event: PointerEvent & { currentTarget: SVGSVGElement }) => {
  const matrix = event.currentTarget.getScreenCTM()?.inverse();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
  pointer = { x: point.x, y: point.y };
};

const release = () => {
  pointer = null;
  hovered = null;
  clearTimeout(dwell);
};

const enter = (letter: string) => {
  if (phase !== 'idle') return;
  hovered = letter;
  clearTimeout(dwell);
  dwell = setTimeout(() => commit(letter), DWELL_MS);
};

const leave = () => {
  hovered = null;
  clearTimeout(dwell);
};

/** Ends the session, like resting on GOODBYE: stops the spirits mid-sentence and clears the board. */
const reset = () => {
  timers.forEach(clearTimeout);
  timers = [];
  clearTimeout(dwell);
  phase = 'idle';
  guided = null;
  hovered = null;
  current = null;
  spelled = '';
  spirit = '';
  message = null;
};

const farewell = () => {
  hovered = 'GOODBYE';
  clearTimeout(dwell);
  dwell = setTimeout(reset, DWELL_MS);
};

// The spirits steer while they're here; otherwise the pointer does. The window sits 28 units above the planchette's
// center, so the window is what lands on a letter.
const spot = $derived(phase === 'idle' ? (pointer ?? REST) : (guided ?? REST));
const resting = $derived(phase === 'idle' && !pointer);
const status = $derived(phase === 'possessed' ? 'The planchette moves on its own…' : (message ?? HINT));
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap"
  />
</svelte:head>

<main class={phase}>
  <div class="dark" aria-hidden="true"></div>

  <div class="column" {@attach fitToParent}>
    <p class="eyebrow">Trakt · a séance in progress</p>
    <h1>The spirits have spoken: <span class="og">O·G</span></h1>

    <div class="table">
      <div class="candle tall" aria-hidden="true">
        <div class="flame"></div>
        <div class="wick"></div>
        <div class="wax"></div>
      </div>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <svg
        class="board"
        role="img"
        aria-label="A Ouija board with a planchette stamped with the Trakt logo. Move it over the letters to spell a word."
        viewBox="0 0 1000 560"
        onpointermove={follow}
        onpointerleave={release}
      >
        <radialGradient id="seance-wood" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stop-color="#ecd7a8" />
          <stop offset="0.75" stop-color="#d9b77a" />
          <stop offset="1" stop-color="#a87c45" />
        </radialGradient>
        <rect x="8" y="8" width="984" height="544" rx="60" fill="url(#seance-wood)" stroke="#3d2512" stroke-width="6" />
        <rect x="30" y="30" width="940" height="500" rx="44" fill="none" stroke="#3d2512" stroke-width="2" />

        <circle cx="110" cy="96" r="30" fill="none" stroke="#c61017" stroke-width="4" />
        <path
          d="M110 50 v-10 M110 142 v10 M64 96 h-10 M156 96 h10 M78 64 l-7 -7 M142 128 l7 7 M78 128 l-7 7 M142 64 l7 -7"
          stroke="#c61017"
          stroke-width="4"
          stroke-linecap="round"
        />
        <text x="210" y="110" class="sc yes" class:lit={phase !== 'idle' && spirit === '' && guided !== null} font-size="48"
          >Yes</text
        >
        <path d="M904 70 a32 32 0 1 0 4 56 a26 26 0 1 1 -4 -56Z" fill="#3d2512" />
        <text x="790" y="110" text-anchor="end" class="sc" font-size="48" fill="#c61017">No</text>

        {#each letters as { letter, x, y, angle } (letter)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <text
            class="letter sc"
            class:hovered={hovered === letter}
            class:lit={current === letter}
            class:spoken={phase !== 'idle' && spirit.includes(letter)}
            {x}
            {y}
            transform="rotate({angle} {x} {y})"
            text-anchor="middle"
            dominant-baseline="central"
            font-size="62"
            onpointerenter={() => enter(letter)}
            onpointerleave={leave}>{letter}</text
          >
        {/each}
        <text x="500" y="462" text-anchor="middle" textLength="560" lengthAdjust="spacing" font-size="46" fill="#2a170a"
          >1234567890</text
        >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <text
          x="500"
          y="520"
          text-anchor="middle"
          class="sc goodbye"
          class:hovered={hovered === 'GOODBYE'}
          font-size="40"
          onpointerenter={farewell}
          onpointerleave={leave}>Goodbye? Never.</text
        >

        <g class="planchette-spot" style:transform="translate({spot.x}px, {spot.y + 28}px)">
          <g class="planchette" class:resting>
            <path
              fill-rule="evenodd"
              fill="#3d2512"
              fill-opacity="0.93"
              stroke="#111"
              stroke-width="3"
              d="M0 -118 C64 -118 116 -22 106 52 C98 108 -98 108 -106 52 C-116 -22 -64 -118 0 -118Z M36 -28 A36 36 0 1 0 -36 -28 A36 36 0 1 0 36 -28Z"
            />
            <circle cx="0" cy="-28" r="36" fill="rgb(255 255 255 / 0.1)" stroke="#f0ad4e" stroke-width="4" />
            <g transform="translate(-22 22) scale(0.45)"><TraktMark face="#fff" ink="#ed1c24" /></g>
            <circle cx="-70" cy="70" r="7" fill="#111" />
            <circle cx="70" cy="70" r="7" fill="#111" />
            <circle cx="0" cy="-104" r="7" fill="#111" />
          </g>
        </g>
      </svg>

      <div class="candle" aria-hidden="true">
        <div class="flame late"></div>
        <div class="wick"></div>
        <div class="wax"></div>
      </div>

      {#if phase === 'revealed'}
        <svg class="ghost" aria-hidden="true" viewBox="0 0 200 240">
          <path
            d="M20 230 L20 100 C20 40 60 8 100 8 C140 8 180 40 180 100 L180 230 L160 210 L140 232 L120 210 L100 232 L80 210 L60 232 L40 210Z"
            style:fill="var(--seance-ghost)"
          />
          <g transform="translate(60 62) scale(0.82)"><TraktMark ink="var(--seance-ghost-face)" /></g>
        </svg>
      {/if}
    </div>

    <p class="spelled" aria-hidden="true">{[...(phase === 'idle' ? spelled : spirit)].join(' ')}&#8203;</p>
    <p class="reply" aria-live="polite">{status}</p>
    <button type="button" class="reset" onclick={reset}>Close the séance</button>

    <div class="credits">
      <p class="title">OG Reanimated <span class="dot">·</span> <em>Séance of the Watch</em></p>
      <p>Summoning your watch history from the great beyond. Manifesting soon.</p>
    </div>
  </div>
</main>

<style>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background: var(--seance-ink);
}

main {
  position: relative;
  overflow: hidden;
  block-size: 100dvh;
  box-sizing: border-box;
  padding: var(--seance-padding);
  font-family: var(--font-body);
  color: var(--seance-text);
  background-color: var(--seance-table);
  background-image: var(--seance-candlelight), var(--seance-grain);

  & p {
    margin: 0;
  }
}

/* The room goes dark around the board while the spirits are in it. */
.dark {
  position: absolute;
  inset: 0;
  background: var(--seance-dark);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s;

  :is(.possessed, .revealed) & {
    opacity: 1;
  }
}

.column {
  position: relative;
  transform-origin: top center;
  max-inline-size: var(--seance-max);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--seance-gap);
  text-align: center;
}

.eyebrow {
  font-size: var(--font-size-seance-eyebrow);
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--seance-accent);
}

h1 {
  margin: 0;
  font-family: var(--font-seance);
  font-weight: 400;
  font-size: var(--font-size-seance-title);
  line-height: 1;
}

.og {
  color: var(--brand-primary);
}

.table {
  position: relative;
  inline-size: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--seance-candle-gap);

  .possessed & {
    animation: shudder 0.18s linear infinite;
  }
}

.board {
  flex: 0 1 var(--seance-board);
  min-inline-size: 0;
  inline-size: 100%;
  font-family: var(--font-seance);
  cursor: none;
  touch-action: none;
  transition: filter 0.8s;

  :is(.possessed, .revealed) & {
    filter: var(--seance-glow);
  }
}

.sc {
  font-family: var(--font-seance-caps);
}

.yes {
  fill: var(--brand-primary-darken);
}

.letter {
  fill: var(--seance-letter);
  transition: fill 0.3s;

  &.hovered {
    fill: var(--brand-primary-darken);
  }

  &.spoken {
    fill: var(--brand-primary-darken);
  }
}

.goodbye {
  fill: var(--seance-wood-ink);
  transition: fill 0.3s;

  &.hovered {
    fill: var(--brand-primary-darken);
  }
}

.reset {
  padding: var(--seance-button-padding);
  border: 1px solid var(--seance-accent);
  border-radius: var(--seance-button-radius);
  background: transparent;
  color: var(--seance-accent);
  font-family: var(--font-seance-caps);
  font-size: var(--font-size-seance-button);
  letter-spacing: 0.08em;
  cursor: pointer;

  &:hover {
    background: var(--seance-button-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--seance-accent);
    outline-offset: 2px;
  }
}

.lit {
  fill: var(--brand-primary);
  filter: var(--seance-letter-glow);
}

.planchette-spot {
  pointer-events: none;

  :is(.possessed, .revealed) & {
    transition: transform 0.7s cubic-bezier(0.6, 0, 0.3, 1);
  }
}

.planchette.resting {
  animation: drift 9s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.candle {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;

  &.tall .wax {
    block-size: var(--seance-candle-tall);
  }
}

.flame {
  inline-size: var(--seance-flame-width);
  block-size: var(--seance-flame-height);
  border-radius: 50% 50% 50% 50% / 64% 64% 36% 36%;
  background: var(--seance-flame);
  box-shadow: var(--seance-flame-glow);
  transform-origin: 50% 90%;
  animation: flicker 1.4s ease-in-out infinite;
  transition:
    scale 0.6s,
    opacity 0.6s,
    filter 0.6s;

  &.late {
    animation-delay: -0.6s;
  }

  /* The spirits snuff the candles to a blue gutter, then they flare back when the ghost appears. */
  .possessed & {
    scale: 0.35;
    opacity: 0.6;
    filter: var(--seance-flame-gutter);
  }

  .revealed & {
    scale: 1.8;
  }
}

.wick {
  inline-size: 2px;
  block-size: var(--seance-wick);
  background: var(--seance-ink);
}

.wax {
  inline-size: var(--seance-candle-width);
  block-size: var(--seance-candle-short);
  border-radius: 8px 8px 2px 2px;
  background: var(--seance-wax);
}

/* A ghost wearing the Trakt mark rises out of the board. */
.ghost {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: 10%;
  inline-size: var(--seance-ghost-size);
  translate: -50% 0;
  filter: var(--seance-ghost-glow);
  pointer-events: none;
  animation: rise 4.8s ease-out forwards;
}

.spelled {
  min-block-size: 1lh;
  font-family: var(--font-seance-caps);
  font-size: var(--font-size-seance-spelled);
  letter-spacing: 0.2em;
  color: var(--seance-accent);

  :is(.possessed, .revealed) & {
    font-size: var(--font-size-seance-spirit);
    color: var(--brand-primary);
    text-shadow: var(--seance-spirit-glow);
  }
}

.reply {
  font-family: var(--font-seance);
  font-style: italic;
  font-size: var(--font-size-seance-reply);

  .revealed & {
    color: var(--seance-accent);
  }
}

.credits {
  display: flex;
  flex-direction: column;
  gap: var(--seance-credits-gap);

  & p:last-child {
    font-size: var(--font-size-seance-body);
    color: var(--seance-muted);
  }
}

.title {
  font-family: var(--font-seance);
  font-size: var(--font-size-seance-credits);
}

.dot {
  color: var(--seance-accent);
}

@keyframes flicker {
  0%,
  100% {
    transform: scale(1, 1) rotate(-2deg);
  }
  30% {
    transform: scale(0.92, 1.08) rotate(2deg);
  }
  60% {
    transform: scale(1.05, 0.94) rotate(-1deg);
  }
}

@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0) rotate(-8deg);
  }
  25% {
    transform: translate(-6px, 3px) rotate(-11deg);
  }
  50% {
    transform: translate(4px, -2px) rotate(-6deg);
  }
  75% {
    transform: translate(-2px, -4px) rotate(-9deg);
  }
}

@keyframes shudder {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, -1px);
  }
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translateY(30%) scale(0.5);
  }
  25% {
    opacity: 0.95;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(-120%) scale(1.15) rotate(-6deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flame,
  .planchette.resting,
  .table {
    animation: none;
  }

  .ghost {
    animation: fade 4.8s ease-out forwards;
  }

  .board,
  .flame,
  .letter,
  .dark,
  .planchette-spot {
    transition: none;
  }
}

@keyframes fade {
  0%,
  100% {
    opacity: 0;
  }
  20%,
  80% {
    opacity: 0.9;
  }
}
</style>
