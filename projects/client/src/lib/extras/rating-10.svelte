<!--
  The rating-10 extra, mounted once in the root layout: the Totally Ninja guy rises from a random edge of the
  screen, feet first on the edge, says "Totally Ninja!" for about a second, and slides back out. `rating10.show()`
  starts him. He's decorative and never takes the pointer; the words reach screen readers through a live region.
-->
<script lang="ts">
import guy from './assets/rating-10.webp';
import type { Edge } from './edgeEntrance.ts';
import { rating10 } from './rating10.svelte.ts';

// Turns the image so its bottom faces the edge he rises from.
const turn: Record<Edge, string> = { bottom: '0deg', top: '180deg', left: '90deg', right: '-90deg' };
</script>

<p class="visually-hidden" aria-live="polite">{rating10.current ? 'Totally Ninja!' : ''}</p>
{#if rating10.current}
  {@const { edge, along, id } = rating10.current}
  {#key id}
    <div class={['stage', edge]} style:--along="{along}%" aria-hidden="true">
  <div class="anchor" style:rotate={turn[edge]}>
    <img class="guy" src={guy} alt="" onanimationend={() => rating10.done(id)} />
  </div>
  <p class="bubble">Totally Ninja!</p>
</div>
  {/key}
{/if}

<style>
.stage {
  --extra-height: clamp(75px, 13vh, 120px);
  --extra-duration: 1.9s; /* 0.35s up, about a second of speech, 0.35s down; the keyframes are cut to this */
  --extra-bubble-gap: 12px; /* past the top of his head */
  --extra-bubble-padding: 8px 16px;
  --extra-bubble-radius: var(--radius-container);
  --extra-bubble-tail: 14px;
  --extra-bubble-font-size: 20px;
  --extra-bubble-bg: #fff;
  --extra-bubble-text: #111;
  --extra-bubble-shadow: 0 8px 24px rgb(0 0 0 / 0.35);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-loading) - 1);
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
  block-size: var(--extra-height);
  inline-size: auto;
  max-inline-size: none;
  translate: -50% 0;
  animation: rise var(--extra-duration) ease-in-out both;
}

/* Over his head, which is toward the middle of the screen whichever edge he's on, upright either way. */
.bubble {
  position: absolute;
  margin: 0;
  padding: var(--extra-bubble-padding);
  border-radius: var(--extra-bubble-radius);
  background-color: var(--extra-bubble-bg);
  box-shadow: var(--extra-bubble-shadow);
  color: var(--extra-bubble-text);
  font-family: var(--font-headings);
  font-size: var(--extra-bubble-font-size);
  font-weight: var(--font-weight-headings-heavy);
  white-space: nowrap;
  animation: speak var(--extra-duration) ease-out both;

  /* The tail: a turned square on the side facing his head. */
  &::after {
    content: '';
    position: absolute;
    inline-size: var(--extra-bubble-tail);
    block-size: var(--extra-bubble-tail);
    background-color: inherit;
    rotate: 45deg;
  }

  .bottom &,
  .top & {
    inset-inline-start: var(--along);
    translate: -50% 0;

    &::after {
      inset-inline-start: calc(50% - var(--extra-bubble-tail) / 2);
    }
  }

  .bottom & {
    inset-block-end: calc(var(--extra-height) + var(--extra-bubble-gap));

    &::after {
      inset-block-end: calc(var(--extra-bubble-tail) / -2);
    }
  }

  .top & {
    inset-block-start: calc(var(--extra-height) + var(--extra-bubble-gap));

    &::after {
      inset-block-start: calc(var(--extra-bubble-tail) / -2);
    }
  }

  .left &,
  .right & {
    inset-block-start: var(--along);
    translate: 0 -50%;

    &::after {
      inset-block-start: calc(50% - var(--extra-bubble-tail) / 2);
    }
  }

  .left & {
    inset-inline-start: calc(var(--extra-height) + var(--extra-bubble-gap));

    &::after {
      inset-inline-start: calc(var(--extra-bubble-tail) / -2);
    }
  }

  .right & {
    inset-inline-end: calc(var(--extra-height) + var(--extra-bubble-gap));

    &::after {
      inset-inline-end: calc(var(--extra-bubble-tail) / -2);
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
