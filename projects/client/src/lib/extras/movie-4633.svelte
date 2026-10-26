<!--
  Everything on the page in view jiggles, in a wave from the top down, while loud floral Hawaiian shirts rain down
  the window, fluttering and tumbling as they fall. Over it all, "Do the truffle shuffle!" in chunky gold lettering
  pops in a letter at a time and bounces to the beat in front of a turning starburst. A second click or Esc ends it
  early. Decorative: it never takes the pointer, and with reduced motion only the words fade in and out.
-->
<script lang="ts">
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;

const { ondone, stop = false }: ExtraProps = $props();

const BEAT_MS = 460;
const BEATS = 7;
const START_MS = 250;
const FADE_MS = 380;
const POP_MS = 380;
const POP_STAGGER_MS = 45;
const MAX_JIGGLERS = 240;
// What jiggles: the page's smallest blocks, so nothing shakes twice inside something else that shakes.
const JIGGLY = 'main :is(img, h1, h2, h3, button, li, p, nav, figure, [class*="card"])';
const SHOUT = [[...'Do the'], [...'Truffle Shuffle!']];
const PETALS = [0, 72, 144, 216, 288];

// The shirts: where each one drops from, how big it is, how it tumbles and drifts, and when.
const SHIRTS = Array.from({ length: 28 }, (_, index) => ({
  left: ((index * 37) % 100) + Math.random() * 4 - 2,
  size: 70 + Math.random() * 70,
  spin: (Math.random() - 0.5) * 90,
  tumble: (Math.random() - 0.5) * 360,
  drift: (Math.random() - 0.5) * 160,
  delay: Math.random() * 1500,
  fall: 2200 + Math.random() * 900,
}));
const RAIN_MS = START_MS + Math.max(...SHIRTS.map(({ delay, fall }) => delay + fall));

const JIGGLE: Frames = [
  { transform: 'none', transformOrigin: '50% 100%' },
  { transform: 'scale(1.05, 0.93) rotate(-1.5deg)', transformOrigin: '50% 100%', offset: 0.25 },
  { transform: 'scale(0.96, 1.05) translateY(-3px) rotate(1.5deg)', transformOrigin: '50% 100%', offset: 0.55 },
  { transform: 'scale(1.02, 0.98) rotate(-0.5deg)', transformOrigin: '50% 100%', offset: 0.8 },
  { transform: 'none', transformOrigin: '50% 100%' },
];
const POP: Frames = [
  { opacity: 0, transform: 'translateY(60px) scale(0.2) rotate(-25deg)' },
  { opacity: 1, transform: 'translateY(-14px) scale(1.2) rotate(6deg)', offset: 0.7 },
  { opacity: 1, transform: 'none' },
];
const HOP: Frames = [
  { transform: 'none' },
  { transform: 'translateY(-16px) rotate(-4deg)', offset: 0.3 },
  { transform: 'none', offset: 0.6 },
];

// The visible blocks of the page, smallest first: a block that holds another one in the list stays still.
function jigglers(): Element[] {
  const inView = [...document.querySelectorAll(JIGGLY)]
    .filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.bottom > 0 && box.top < innerHeight;
    })
    .slice(0, MAX_JIGGLERS);
  return inView.filter((element) => !inView.some((other) => other !== element && element.contains(other)));
}

// A second click on its switch, or Esc, ends it on the spot.
$effect(() => {
  if (stop) untrack(ondone);
});

// Runs once: the whole shuffle, start to finish.
const shuffle: Attachment<HTMLElement> = (root) =>
  untrack(() => {
    const reduced = prefersReducedMotion.current;
    document.body.append(root);
    const animations: Animation[] = [];
    const timers: number[] = [];
    const play = (element: Element | null, keyframes: Frames, options: Timing) => {
      const animation = element?.animate(keyframes, options);
      if (animation) animations.push(animation);
    };
    const banner = root.querySelector('.banner');
    const letters = [...root.querySelectorAll('.letter')];
    const dance = BEAT_MS * BEATS;

    if (reduced) {
      play(banner, [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], {
        duration: dance,
        fill: 'forwards',
      });
      timers.push(window.setTimeout(ondone, dance));
    } else {
      for (const element of jigglers()) {
        const top = element.getBoundingClientRect().top;
        play(element, JIGGLE, {
          duration: BEAT_MS,
          iterations: BEATS,
          delay: START_MS + Math.max(0, top / innerHeight) * 240,
          easing: 'ease-in-out',
          composite: 'add',
        });
      }
      play(document.querySelector('header.top-nav'), JIGGLE, {
        duration: BEAT_MS,
        iterations: BEATS,
        delay: START_MS,
        composite: 'add',
      });

      // The shirts: each drops from above the window, tumbling and drifting sideways, and falls out the bottom.
      root.querySelectorAll('.shirt').forEach((shirt, index) => {
        const path = SHIRTS[index];
        if (!path) return;
        const { spin, tumble, drift, delay, fall } = path;
        play(
          shirt,
          [
            { transform: `translate(0, -30vh) rotate(${spin}deg)` },
            { transform: `translate(${drift}px, 45vh) rotate(${spin + tumble / 2}deg)`, offset: 0.5 },
            { transform: `translate(${-drift / 2}px, 120vh) rotate(${spin + tumble}deg)` },
          ],
          { duration: fall, delay: START_MS + delay, easing: 'cubic-bezier(0.35, 0.1, 0.65, 1)', fill: 'both' },
        );
      });

      // The words: each letter pops in, then they all hop to the beat in a wave, and the banner rocks.
      const popped = START_MS + letters.length * POP_STAGGER_MS + POP_MS;
      letters.forEach((letter, index) => {
        play(letter, POP, {
          duration: POP_MS,
          delay: START_MS + index * POP_STAGGER_MS,
          easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)',
          fill: 'backwards',
        });
        play(letter, HOP, {
          duration: BEAT_MS,
          delay: popped + index * 30,
          iterations: Math.max(1, Math.floor((dance - popped + START_MS) / BEAT_MS)),
          easing: 'ease-in-out',
        });
      });
      play(banner, [{ transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }], {
        duration: BEAT_MS,
        iterations: BEATS,
        delay: START_MS,
        direction: 'alternate',
        easing: 'ease-in-out',
      });
      play(banner, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, delay: START_MS + dance, fill: 'forwards' });
      play(
        root.querySelector('.burst'),
        [
          { opacity: 0, transform: 'rotate(0deg) scale(0.5)' },
          { opacity: 1, transform: 'rotate(45deg) scale(1)', offset: 0.12 },
          { opacity: 1, transform: 'rotate(300deg) scale(1)', offset: 0.9 },
          { opacity: 0, transform: 'rotate(360deg) scale(1.15)' },
        ],
        { duration: dance, delay: START_MS, fill: 'both' },
      );
      timers.push(window.setTimeout(ondone, Math.max(START_MS + dance + FADE_MS, RAIN_MS)));
    }

    return () => {
      for (const timer of timers) clearTimeout(timer);
      for (const animation of animations) animation.cancel();
      root.remove();
    };
  });
</script>

<div class="extra" aria-hidden="true" {@attach shuffle}>
  <svg class="print">
    <defs>
      <pattern id="extra-floral" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-12) scale(0.6)">
        <rect class="ground" width="44" height="44" />
        <path class="leaf" d="M2 14c6-8 16-8 20-2-6 6-14 7-20 2Z" />
        <path class="leaf" d="M26 40c4-9 14-12 19-8-4 7-12 10-19 8Z" />
        <path class="leaf" d="M30 2c6 0 10 4 10 9-6 1-10-3-10-9Z" />
        <g class="petal">
          {#each PETALS as turn (turn)}
            <ellipse cx="14" cy="27" rx="4" ry="6" transform="rotate({turn} 14 32)" />
          {/each}
        </g>
        <circle class="heart" cx="14" cy="32" r="2" />
        <g class="petal cream">
          {#each [0, 90, 180, 270] as turn (turn)}
            <ellipse cx="35" cy="19" rx="3" ry="4.5" transform="rotate({turn} 35 23)" />
          {/each}
        </g>
        <circle class="heart" cx="35" cy="23" r="1.4" />
      </pattern>
    </defs>
  </svg>

  {#if !prefersReducedMotion.current}
    {#each SHIRTS as shirt, index (index)}
      <svg class="shirt" viewBox="0 0 100 100" style:left="{shirt.left}%" style:width="{shirt.size}px">
        <g class="flutter" style:animation-delay="{-(index % 5) * 0.13}s">
          <path class="cloth" d="M30 8 42 4q8 9 16 0l12 4 24 14-10 20-10-6v58q-24 5-48 0V36l-10 6L6 22Z" />
          <path class="seam" d="M42 4 50 18 58 4M50 18v76M26 36l-4-14M74 36l4-14" />
          {#each [32, 50, 68, 84] as y (y)}
            <circle class="button" cx="53" cy={y} r="1.8" />
          {/each}
        </g>
      </svg>
    {/each}
  {/if}

  <div class="banner">
    <span class="burst"></span>
    <p class="shout">
      {#each SHOUT as line, row (row)}
        <span class={['words', { lead: row === 0 }]}>
          {#each line as letter, index (index)}
            <span class="letter" data-letter={letter === ' ' ? ' ' : letter}>{letter === ' ' ? ' ' : letter}</span>
          {/each}
        </span>
      {/each}
    </p>
  </div>
</div>

<style>
.extra {
  --extra-trim: rgb(244 236 212 / 90%);
  --extra-shirt-ground: #141414;
  --extra-leaf: #78d12f;
  --extra-petal: #d94fd3;
  --extra-cream: #f4ecd4;
  --extra-heart: #ffd84a;
  --extra-button: #f4ecd4;
  --extra-gold: linear-gradient(180deg, #fff7c2 0%, #ffd23a 42%, #ff9a1f 58%, #e2421b 100%);
  --extra-letter-edge: #7a1010;
  --extra-letter-drop: #2a0606;
  --extra-ray: rgb(255 210 70 / 40%);
  --extra-glow: radial-gradient(ellipse at center, rgb(0 0 0 / 65%), transparent 68%);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
  overflow: hidden;
  pointer-events: none;
}

.print {
  position: absolute;
  inline-size: 0;
  block-size: 0;
}

/* A short-sleeved camp shirt in the loud print, starting above the window. */
.shirt {
  position: absolute;
  inset-block-start: 0;
  block-size: auto;
  translate: -50% 0;
  overflow: visible;
  filter: drop-shadow(0 6px 8px rgb(0 0 0 / 45%));
}

.flutter {
  transform-box: fill-box;
  transform-origin: center;
  animation: flutter 0.65s ease-in-out infinite alternate;
}

.cloth {
  fill: url(#extra-floral);
  stroke: var(--extra-trim);
  stroke-width: 2.4;
  stroke-linejoin: round;
}

.seam {
  fill: none;
  stroke: var(--extra-trim);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.button {
  fill: var(--extra-button);
}

.ground {
  fill: var(--extra-shirt-ground);
}

.leaf {
  fill: var(--extra-leaf);
}

.petal {
  fill: var(--extra-petal);

  &.cream {
    fill: var(--extra-cream);
  }
}

.heart {
  fill: var(--extra-heart);
}

/* The words: two lines of chunky, tilted gold capitals on a deep red drop, in front of a slow starburst. */
.banner {
  position: absolute;
  inset-block-start: calc(var(--header-height) + 3vh);
  inset-inline: 0;
  display: grid;
  place-items: center;
}

.burst {
  position: absolute;
  inline-size: min(80vw, 980px);
  aspect-ratio: 1;
  opacity: 0;
  background: repeating-conic-gradient(var(--extra-ray) 0 7deg, transparent 7deg 20deg), var(--extra-glow);
  mask-image: radial-gradient(circle, #000 12%, transparent 62%);
}

.shout {
  position: relative;
  display: grid;
  justify-items: center;
  margin: 0;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 0.95;
  text-transform: uppercase;
  transform: skewX(-8deg);
}

.words {
  font-size: clamp(44px, 7vw, 104px);
  white-space: nowrap;

  &.lead {
    font-size: clamp(24px, 3.6vw, 52px);
  }
}

/* A dark, stepped drop under each letter, and the gold face drawn over it. */
.letter {
  position: relative;
  display: inline-block;
  color: var(--extra-letter-drop);
  -webkit-text-stroke: 0.08em var(--extra-letter-drop);
  text-shadow:
    1px 1px 0 var(--extra-letter-drop),
    2px 2px 0 var(--extra-letter-drop),
    3px 3px 0 var(--extra-letter-drop),
    4px 4px 0 var(--extra-letter-drop),
    5px 5px 0 var(--extra-letter-drop),
    6px 6px 0 var(--extra-letter-drop),
    8px 10px 16px rgb(0 0 0 / 55%);

  &::after {
    content: attr(data-letter);
    position: absolute;
    inset: 0;
    background: var(--extra-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 0.03em var(--extra-letter-edge);
    text-shadow: none;
  }
}

/* Cloth catching the air as it falls: it narrows and swings a little, back and forth. */
@keyframes flutter {
  from {
    transform: scaleX(1) skewY(-4deg);
  }

  to {
    transform: scaleX(0.82) skewY(5deg);
  }
}
</style>
