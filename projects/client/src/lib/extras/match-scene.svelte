<!--
  A little 8-bit scene over the taste match header, one per level (matchScenes): two fighters in the level's colors
  hold hands under a heart, bow under a spotlight, high-five, part ways, drop in for a cameo, or meet by saucer. It
  covers the header it's placed in, starts once the "VS" has blown apart, is decorative, never takes the pointer, and
  calls `ondone` when it has faded out.
    <MatchScene level="soulmates" ondone={() => (playing = false)} />
-->
<script lang="ts">
import { untrack } from 'svelte';
import MatchBlast from './match-blast.svelte';
import { type FighterPose, type Scene, type SceneLevel, matchScenes } from './matchScenes.ts';
import { pixelSprite } from './pixelSprite.ts';
import { matchSprites } from './matchSprites.ts';

interface Props {
  level: SceneLevel;
  ondone: () => void;
}

const { level, ondone }: Props = $props();

// The "VS" blows apart first, then the scene plays; it fades out over FADE.
const START = 450;
const FADE = 600;
const STRIDE = 110;
const CONFETTI = Array.from({ length: 18 }, (_, n) => ({
  x: (n * 37 + 11) % 100,
  delay: -(n % 6) * 0.3,
  fall: 1.6 + (n % 4) * 0.3,
  tone: n % 3,
}));

type Art = keyof typeof matchSprites;
const ART = Object.fromEntries(
  Object.entries(matchSprites).map(([name, rows]) => [
    name,
    { runs: pixelSprite(rows), width: rows[0]?.length ?? 0, height: rows.length },
  ]),
) as Record<Art, { runs: ReturnType<typeof pixelSprite>; width: number; height: number }>;

// A scene plays one level start to finish.
const script = untrack(() => matchScenes[level]);
const scene = $state<Scene>(script.start());
let leaving = $state(false);

$effect(() => {
  const timers = script.beats.map(([ms, beat]) => setTimeout(() => beat(scene), START + ms));
  timers.push(setTimeout(() => (leaving = true), START + script.leaveAt));
  timers.push(setTimeout(ondone, START + script.leaveAt + FADE));
  // Feet move while walking.
  const strides = setInterval(() => {
    for (const who of [scene.you, scene.them]) {
      if (who.pose === 'walk' || who.pose === 'step') who.pose = who.pose === 'walk' ? 'step' : 'walk';
    }
  }, STRIDE);
  return () => {
    timers.forEach(clearTimeout);
    clearInterval(strides);
  };
});

const fighters = $derived([
  { key: 'you', who: scene.you },
  { key: 'them', who: scene.them },
] as const);
</script>

{#snippet pixels(name: Art | FighterPose)}
  {@const art = ART[name]}
  <svg viewBox="0 0 {art.width} {art.height}" shape-rendering="crispEdges">
    {#each art.runs as run (`${run.x}-${run.y}`)}
      <rect class="px-{run.key}" x={run.x} y={run.y} width={run.width} height="1" />
    {/each}
  </svg>
{/snippet}

<div class={['scene', level, { leaving }]} aria-hidden="true">
  {#if scene.spotlight}<div class="spotlight"></div>{/if}

  {#if scene.confetti}
    <div class="confetti">
      {#each CONFETTI as bit, n (n)}
        <i class="tone-{bit.tone}" style:--x="{bit.x}%" style:--delay="{bit.delay}s" style:--fall="{bit.fall}s"></i>
      {/each}
    </div>
  {/if}

  {#if level === 'different-universe'}
    {#if scene.beam}<div class="beam" style:--x="{scene.saucer.x}px"></div>{/if}
    <div class="saucer" style:--x="{scene.saucer.x}px" style:--glide="{scene.saucer.glide}ms">
      {@render pixels('saucer')}
    </div>
  {/if}

  {#each fighters as { key, who } (key)}
    <div
      class={['fighter', key, { shown: who.shown, sway: who.sway }]}
      style:--x="{who.x}px"
      style:--y="{who.y}px"
      style:--face={who.face}
      style:--glide="{who.glide}ms"
    >
      {@render pixels(who.pose)}
    </div>
    {#if scene.questions}<div class="question" style:--x="{who.x}px">{@render pixels('question')}</div>{/if}
  {/each}

  {#if scene.heart}<div class="heart">{@render pixels('heart')}</div>{/if}

  {#if scene.burst}
    <span class="burst" style:--x="{scene.burst.x}px" style:--y="{scene.burst.y}px"><MatchBlast /></span>
  {/if}

  {#if scene.banner}<p class="banner">{scene.banner}</p>{/if}
</div>

<style>
.scene {
  --scene-size: 70px;
  --scene-floor: 18px;
  --scene-fade: 0.6s;
  --scene-banner-size: 40px;
  --scene-banner-top: 18%;
  --scene-saucer-width: 80px;
  --scene-saucer-height: 40px;
  --scene-saucer-top: 12px;
  --scene-prop-size: 40px;
  --scene-question-size: 30px;
  --scene-light: rgb(255 255 255 / 0.22);
  --scene-beam: color-mix(in srgb, var(--match-text, #c9cfdb) 55%, transparent);
  --scene-white: #fff;

  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
  transition: opacity var(--scene-fade);

  &.leaving {
    opacity: 0;
  }
}

/* Centred on --x from the header's middle, feet on a floor near its bottom, moving in 8-bit steps. */
.fighter {
  position: absolute;
  inset-block-end: var(--scene-floor);
  inset-inline-start: 50%;
  inline-size: var(--scene-size);
  block-size: var(--scene-size);
  opacity: 0;
  translate: calc(var(--x) - var(--scene-size) / 2) var(--y);
  transition:
    translate var(--glide) steps(12, end),
    opacity 0.5s steps(5, end);

  &.shown {
    opacity: 1;
  }

  & svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
    scale: var(--face) 1;
    transform-origin: 50% 100%;
  }

  &.you {
    --hair: #3a2416;
    --skin: #f2c39b;
    --top: var(--match);
    --mitt: #d6332e;
    --trousers: #2b2f45;
  }

  &.them {
    --hair: #e8c547;
    --skin: #c98a5c;
    --top: var(--match-end);
    --mitt: #2b7bd6;
    --trousers: #3b2b2b;
  }

  &.sway svg {
    animation: sway 1.2s ease-in-out infinite alternate;
  }
}

@keyframes sway {
  from {
    rotate: -4deg;
  }

  to {
    rotate: 4deg;
  }
}

.px-H {
  fill: var(--hair);
}

.px-S {
  fill: var(--skin);
}

.px-E,
.px-B {
  fill: #111;
}

.px-T {
  fill: var(--top);
}

.px-G {
  fill: var(--mitt);
}

.px-P {
  fill: var(--trousers);
}

.px-F {
  fill: #0b0b0b;
}

.px-R {
  fill: var(--match);
}

.px-Q {
  fill: var(--scene-white);
}

.px-U {
  fill: #8a94a6;
}

.px-D {
  fill: var(--scene-beam);
}

.px-L {
  fill: #ffd76a;
}

.heart {
  position: absolute;
  inset-block-end: calc(var(--scene-floor) + var(--scene-size) + 6px);
  inset-inline-start: 50%;
  inline-size: var(--scene-prop-size);
  translate: -50% 0;
  animation: beat 0.9s steps(3, end) infinite alternate;

  & svg {
    display: block;
    inline-size: 100%;
  }
}

@keyframes beat {
  from {
    scale: 0.85;
  }

  to {
    scale: 1.15;
  }
}

.question {
  position: absolute;
  inset-block-end: calc(var(--scene-floor) + var(--scene-size) + 8px);
  inset-inline-start: 50%;
  inline-size: calc(var(--scene-question-size) * 5 / 8);
  block-size: var(--scene-question-size);
  translate: calc(var(--x) - 50%) 0;
  animation: pop 0.3s steps(3, end) both;

  & svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
}

@keyframes pop {
  from {
    opacity: 0;
    translate: calc(var(--x) - 50%) 10px;
  }
}

.spotlight {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 30% 90% at 50% 100%, var(--scene-light), transparent 70%);
  clip-path: polygon(42% 0, 58% 0, 80% 100%, 20% 100%);
  animation: lights-up 0.4s steps(4, end) both;
}

@keyframes lights-up {
  from {
    opacity: 0;
  }
}

.confetti i {
  position: absolute;
  inset-block-start: -10px;
  inset-inline-start: var(--x);
  inline-size: 6px;
  block-size: 6px;
  animation: confetti var(--fall) steps(10, end) var(--delay) infinite;
}

.tone-0 {
  background: var(--match);
}

.tone-1 {
  background: var(--match-end);
}

.tone-2 {
  background: var(--scene-white);
}

@keyframes confetti {
  to {
    translate: 0 260px;
    rotate: 360deg;
  }
}

.saucer {
  position: absolute;
  inset-block-start: var(--scene-saucer-top);
  inset-inline-start: 50%;
  inline-size: var(--scene-saucer-width);
  block-size: var(--scene-saucer-height);
  translate: calc(var(--x) - var(--scene-saucer-width) / 2) 0;
  transition: translate var(--glide) steps(14, end);

  & svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
}

.beam {
  position: absolute;
  inset-block: calc(var(--scene-saucer-top) + var(--scene-saucer-height) - 4px) var(--scene-floor);
  inset-inline-start: 50%;
  inline-size: calc(var(--scene-size) + 20px);
  translate: calc(var(--x) - 50%) 0;
  background: linear-gradient(var(--scene-beam), transparent);
  clip-path: polygon(35% 0, 65% 0, 100% 100%, 0 100%);
  animation: lights-up 0.2s steps(3, end) both;
}

/* MatchBlast bursts from the middle of this point. */
.burst {
  position: absolute;
  inset-block-end: calc(var(--scene-floor) + var(--y));
  inset-inline-start: calc(50% + var(--x));
  inline-size: 0;
  block-size: 0;
}

.banner {
  position: absolute;
  inset-block-start: var(--scene-banner-top);
  inset-inline: 0;
  margin: 0;
  background: var(--match-vs-fill);
  background-clip: text;
  color: transparent;
  font-family: var(--font-box-office-figures);
  font-stretch: condensed;
  font-size: var(--scene-banner-size);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-align: center;
  -webkit-text-stroke: 1px var(--match-vs-stroke);
  filter: var(--match-vs-glow);
  animation: banner-in 0.35s steps(4, end) both;
}

@keyframes banner-in {
  from {
    opacity: 0;
    scale: 2;
  }
}
</style>
