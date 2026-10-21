<!--
  A birthday surprise: one of the person's Known For posters rises from a random edge of the screen, like the Totally
  Ninja guy, with a bubble from the character ("Happy birthday, Bryan! Love, Walter White"), then ducks back out.
  It's decorative and never takes the pointer; the words reach screen readers through a live region.
    <PartyCrasher image={credit.image} name="Bryan" from="Walter White" ondone={…} />
-->
<script lang="ts">
import { ninjaEntrance } from '$lib/components/easter/ninjaEntrance';

interface Props {
  image: string;
  /** Who it's for: the person's first name. */
  name: string;
  /** Who it's from: the character. */
  from: string;
  ondone: () => void;
}

const { image, name, from, ondone }: Props = $props();
// The crasher's edge: any but the top, where the poster would hang upside down over the header.
const entrance = ninjaEntrance();
const edge = entrance.edge === 'top' ? 'bottom' : entrance.edge;
const along = entrance.along;
const turn = { bottom: '0deg', left: '90deg', right: '-90deg' }[edge];
</script>

<p class="visually-hidden" aria-live="polite">Happy birthday, {name}! Love, {from}</p>
<div class={['stage', edge]} style:--along="{along}%" aria-hidden="true">
  <div class="anchor" style:rotate={turn}>
    <img class="poster" src={image} alt="" onanimationend={ondone} />
  </div>
  <p class="bubble">Happy birthday, {name}!<small>Love, {from}</small></p>
</div>

<style>
.stage {
  position: fixed;
  inset: 0;
  z-index: var(--z-easter);
  overflow: hidden;
  pointer-events: none;
}

.anchor {
  position: absolute;
  inline-size: 0;
  block-size: 0;

  .bottom & {
    inset-block-start: 100%;
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

.poster {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  block-size: var(--party-crasher-height);
  inline-size: auto;
  max-inline-size: none;
  border-radius: var(--radius-card-framed);
  box-shadow: var(--shadow-ninja-bubble);
  translate: -50% 0;
  transform-origin: 50% 100%;
  animation: crash var(--party-crasher-duration) ease-in-out both;
}

/* The ninja's bubble, with who it's from under the words. */
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
  animation: speak var(--party-crasher-duration) ease-out both;

  & small {
    display: block;
    color: var(--color-party-crasher-from);
    font-size: var(--font-size-party-crasher-from);
    font-weight: var(--font-weight-headings);
  }

  .bottom & {
    inset-block-end: calc(var(--party-crasher-height) * 0.7 + var(--ninja-bubble-gap));
    inset-inline-start: calc(var(--along) + var(--party-crasher-height) / 3);
  }

  .left & {
    inset-block-start: var(--along);
    inset-inline-start: calc(var(--party-crasher-height) * 0.7 + var(--ninja-bubble-gap));
    translate: 0 -50%;
  }

  .right & {
    inset-block-start: var(--along);
    inset-inline-end: calc(var(--party-crasher-height) * 0.7 + var(--ninja-bubble-gap));
    translate: 0 -50%;
  }
}

/* Up with a tilt, a settle, a long hold for the words, and back out. */
@keyframes crash {
  0%,
  100% {
    transform: translateY(105%);
  }

  12% {
    transform: translateY(25%) rotate(-6deg);
  }

  18%,
  82% {
    transform: translateY(30%) rotate(0);
  }
}

@keyframes speak {
  0%,
  14% {
    opacity: 0;
    scale: 0.6;
  }

  20%,
  76% {
    opacity: 1;
    scale: 1;
  }

  82%,
  100% {
    opacity: 0;
    scale: 1;
  }
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
