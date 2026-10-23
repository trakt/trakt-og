<!--
  The rating-10 easter egg, mounted once in the root layout: the Totally Ninja guy rises from a random edge of the
  screen, feet first on the edge, says "Totally Ninja!" for about a second, and slides back out. `ninja.show()`
  starts him. He's decorative and never takes the pointer; the words reach screen readers through a live region.
-->
<script lang="ts">
import guy from '$lib/assets/easter/totally-ninja.webp';
import type { NinjaEdge } from './ninjaEntrance.ts';
import { ninja } from './ninja.svelte.ts';

// Turns the image so its bottom faces the edge he rises from.
const turn: Record<NinjaEdge, string> = { bottom: '0deg', top: '180deg', left: '90deg', right: '-90deg' };
</script>

<p class="visually-hidden" aria-live="polite">{ninja.current ? 'Totally Ninja!' : ''}</p>
{#if ninja.current}
  {@const { edge, along, id } = ninja.current}
  {#key id}
    <div class={['stage', edge]} style:--along="{along}%" aria-hidden="true">
  <div class="anchor" style:rotate={turn[edge]}>
    <img class="guy" src={guy} alt="" onanimationend={() => ninja.done(id)} />
  </div>
  <p class="bubble">Totally Ninja!</p>
</div>
  {/key}
{/if}

<style>
.stage {
  position: fixed;
  inset: 0;
  z-index: var(--z-easter);
  overflow: hidden;
  pointer-events: none;
}

/* A point on the edge, turned so his "down" points off the screen. */
.anchor {
  position: absolute;
  inline-size: 0;
  block-size: 0;

  .bottom & {
    inset-block-start: 100%;
    inset-inline-start: var(--along);
  }

  .top & {
    inset-block-start: 0;
    inset-inline-start: var(--along);
  }

  .left & {
    inset-block-start: var(--along);
    inset-inline-start: 0;
  }

  .right & {
    inset-block-start: var(--along);
    inset-inline-start: 100%;
  }
}

/* Feet on the point, sliding up out of the edge and back down into it. */
.guy {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  block-size: var(--ninja-height);
  inline-size: auto;
  max-inline-size: none;
  translate: -50% 0;
  animation: rise var(--ninja-duration) ease-in-out both;
}

/* Over his head, which is toward the middle of the screen whichever edge he's on, upright either way. */
.bubble {
  position: absolute;
  margin: 0;
  padding: var(--ninja-bubble-padding);
  border-radius: var(--radius-ninja-bubble);
  background-color: var(--color-ninja-bubble-bg);
  box-shadow: var(--shadow-ninja-bubble);
  color: var(--color-ninja-bubble-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-ninja-bubble);
  font-weight: var(--font-weight-headings-heavy);
  white-space: nowrap;
  animation: speak var(--ninja-duration) ease-out both;

  /* The tail: a turned square on the side facing his head. */
  &::after {
    content: '';
    position: absolute;
    inline-size: var(--ninja-bubble-tail);
    block-size: var(--ninja-bubble-tail);
    background-color: inherit;
    rotate: 45deg;
  }

  .bottom &,
  .top & {
    inset-inline-start: var(--along);
    translate: -50% 0;

    &::after {
      inset-inline-start: calc(50% - var(--ninja-bubble-tail) / 2);
    }
  }

  .bottom & {
    inset-block-end: calc(var(--ninja-height) + var(--ninja-bubble-gap));

    &::after {
      inset-block-end: calc(var(--ninja-bubble-tail) / -2);
    }
  }

  .top & {
    inset-block-start: calc(var(--ninja-height) + var(--ninja-bubble-gap));

    &::after {
      inset-block-start: calc(var(--ninja-bubble-tail) / -2);
    }
  }

  .left &,
  .right & {
    inset-block-start: var(--along);
    translate: 0 -50%;

    &::after {
      inset-block-start: calc(50% - var(--ninja-bubble-tail) / 2);
    }
  }

  .left & {
    inset-inline-start: calc(var(--ninja-height) + var(--ninja-bubble-gap));

    &::after {
      inset-inline-start: calc(var(--ninja-bubble-tail) / -2);
    }
  }

  .right & {
    inset-inline-end: calc(var(--ninja-height) + var(--ninja-bubble-gap));

    &::after {
      inset-inline-end: calc(var(--ninja-bubble-tail) / -2);
    }
  }
}

/* Over the 1.9s run: 0.35s up (to 18.4%), held, and 0.35s back down (from 81.6%). */
@keyframes rise {
  0%,
  100% {
    transform: translateY(105%);
  }

  18.4%,
  81.6% {
    transform: translateY(0);
  }
}

/* The bubble speaks once he's up, for about a second, and clears before he ducks back. */
@keyframes speak {
  0%,
  18.4% {
    opacity: 0;
    scale: 0.6;
  }

  24%,
  74% {
    opacity: 1;
    scale: 1;
  }

  79%,
  100% {
    opacity: 0;
    scale: 1;
  }
}

/* Without motion he fades in and out in place. */
@keyframes appear {
  0%,
  100% {
    opacity: 0;
  }

  15%,
  80% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guy {
    animation-name: appear;
  }

  .bubble {
    animation-name: appear;
  }
}
</style>
