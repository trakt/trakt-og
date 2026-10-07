<!--
  "Séance of the Watch": a Ouija board between two candles. The planchette follows the pointer; resting it on a letter
  spells it, and spelling a word the spirits know (see spellOuija) gets an answer. The text field asks the same
  spirits without a pointer.
-->
<script lang="ts">
import { fitToParent } from './fitToParent.ts';
import { spellOuija } from './spellOuija.ts';
import { toArcLetters } from './toArcLetters.ts';
import TraktMark from './TraktMark.svelte';

const DWELL_MS = 450;
const GLOW_MS = 2400;
const HINT = 'Rest the planchette on a letter to spell. The spirits are listening.';

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

let planchette = $state<{ x: number; y: number } | null>(null);
let hovered = $state<string | null>(null);
let spelled = $state('');
let reply = $state<string | null>(null);
let glowing = $state(false);
let dwell: ReturnType<typeof setTimeout> | undefined;
let glow: ReturnType<typeof setTimeout> | undefined;

$effect(() => () => {
  clearTimeout(dwell);
  clearTimeout(glow);
});

const answer = (text: string) => {
  reply = text;
  glowing = true;
  clearTimeout(glow);
  glow = setTimeout(() => (glowing = false), GLOW_MS);
};

const commit = (letter: string) => {
  const result = spellOuija({ spelled, letter });
  spelled = result.spelled;
  if (result.reply) answer(result.reply);
};

const follow = (event: PointerEvent & { currentTarget: SVGSVGElement }) => {
  const matrix = event.currentTarget.getScreenCTM()?.inverse();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
  planchette = { x: point.x, y: point.y };
};

const release = () => {
  planchette = null;
  hovered = null;
  clearTimeout(dwell);
};

const enter = (letter: string) => {
  hovered = letter;
  clearTimeout(dwell);
  dwell = setTimeout(() => commit(letter), DWELL_MS);
};

const leave = () => {
  hovered = null;
  clearTimeout(dwell);
};

const ask = (event: Event & { currentTarget: HTMLInputElement }) => {
  const typed = [...event.currentTarget.value.replace(/[^a-z]/gi, '')];
  const result = typed.reduce(
    (state, letter) => (state.reply ? state : spellOuija({ spelled: state.spelled, letter })),
    { spelled: '', reply: null as string | null },
  );
  if (result.reply) answer(result.reply);
};

// The planchette's window sits 28 units above its center, so the window lands on the pointer.
const planchetteAt = $derived(planchette ? `translate(${planchette.x} ${planchette.y + 28})` : 'translate(500 178)');
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap"
  />
</svelte:head>

<main class:glowing>
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
        <text x="210" y="110" class="sc" font-size="48" fill="#c61017">Yes</text>
        <path d="M904 70 a32 32 0 1 0 4 56 a26 26 0 1 1 -4 -56Z" fill="#3d2512" />
        <text x="790" y="110" text-anchor="end" class="sc" font-size="48" fill="#c61017">No</text>

        {#each letters as { letter, x, y, angle } (letter)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <text
            class="letter sc"
            class:hovered={hovered === letter}
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
        <text x="500" y="520" text-anchor="middle" class="sc" font-size="40" fill="#3d2512">Goodbye? Never.</text>

        <g transform={planchetteAt} class="planchette-spot">
          <g class="planchette" class:idle={!planchette}>
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
    </div>

    <p class="spelled" aria-hidden="true">{[...spelled].join(' ')}&#8203;</p>
    <p class="reply" aria-live="polite">{reply ?? HINT}</p>

    <label class="ask">
      Too shy to touch the board? Ask the spirits:
      <input type="text" autocomplete="off" spellcheck="false" oninput={ask} />
    </label>

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

.column {
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
  inline-size: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--seance-candle-gap);
}

.board {
  flex: 0 1 var(--seance-board);
  min-inline-size: 0;
  inline-size: 100%;
  font-family: var(--font-seance);
  cursor: none;
  touch-action: none;
  transition: filter 0.4s;
}

.glowing .board {
  filter: var(--seance-glow);
}

.sc {
  font-family: var(--font-seance-caps);
}

.letter {
  fill: var(--seance-letter);
  transition: fill 0.2s;

  &.hovered {
    fill: var(--brand-primary-darken);
  }
}

.planchette-spot {
  pointer-events: none;
}

.planchette.idle {
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
  transition: transform 0.4s;

  &.late {
    animation-delay: -0.6s;
  }
}

.glowing .flame {
  scale: 1.6;
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

.spelled {
  min-block-size: 1lh;
  font-family: var(--font-seance-caps);
  font-size: var(--font-size-seance-spelled);
  letter-spacing: 0.2em;
  color: var(--seance-accent);
}

.reply {
  font-family: var(--font-seance);
  font-style: italic;
  font-size: var(--font-size-seance-reply);
}

.ask {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--seance-ask-gap);
  font-size: var(--font-size-seance-ask);
  color: var(--seance-muted);

  & input {
    padding: var(--seance-input-padding);
    border: 1px solid var(--seance-accent);
    border-radius: var(--seance-input-radius);
    background: var(--seance-input);
    color: var(--seance-text);
    font: inherit;
    text-transform: uppercase;

    &:focus-visible {
      outline: 2px solid var(--seance-accent);
      outline-offset: 2px;
    }
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

@media (prefers-reduced-motion: reduce) {
  .flame,
  .planchette.idle {
    animation: none;
  }

  .board,
  .flame,
  .letter {
    transition: none;
  }
}
</style>
