<!--
  A party hat that drops onto a headshot on a person's birthday: it falls in tilted, lands on the top edge and wobbles
  still. It sits in its own layer just over the site header, so its peak can rise above the header bar, and follows
  `anchor` (the headshot) as the page scrolls. It's decorative; with reduced motion it's simply there.
    <PartyHat anchor={headshot} />
-->
<script lang="ts">
import hat from '$lib/assets/easter/party-hat.svg';
import type { Attachment } from 'svelte/attachments';

const { anchor }: { anchor: HTMLElement } = $props();

let spot = $state<{ x: number; y: number } | null>(null);

// The headshot's top center, kept up to date on scroll and resize; none while the headshot is hidden (phones).
const follow: Attachment<HTMLElement> = () => {
  let frame = 0;
  const measure = () => {
    const box = anchor.getBoundingClientRect();
    spot = box.width > 0 ? { x: box.left + box.width / 2, y: box.top } : null;
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  };
  measure();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
  };
};
</script>

<div class="party-hat-layer" aria-hidden="true" {@attach follow}>
  {#if spot}
    <img class="party-hat" src={hat} alt="" style:left="{spot.x}px" style:top="{spot.y}px" />
  {/if}
</div>

<style>
.party-hat-layer {
  position: fixed;
  inset: 0;
  z-index: var(--z-party-hat);
  overflow: hidden;
  pointer-events: none;
}

.party-hat {
  position: absolute;
  inline-size: var(--party-hat-size);
  margin-block-start: var(--party-hat-top);
  translate: -50% 0;
  rotate: var(--party-hat-tilt);
  transform-origin: 50% 100%;
  filter: drop-shadow(var(--shadow-party-hat));
  animation: drop var(--party-hat-duration) var(--party-hat-delay) both;
}

/* Falls in from high and tilted, lands, bounces once and wobbles to rest at a jaunty angle. */
@keyframes drop {
  0% {
    opacity: 0;
    transform: translateY(var(--party-hat-fall)) rotate(-35deg);
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }
  45% {
    opacity: 1;
    transform: translateY(0) rotate(4deg);
    animation-timing-function: ease-out;
  }
  60% {
    transform: translateY(var(--party-hat-bounce)) rotate(-10deg);
    animation-timing-function: ease-in;
  }
  72% {
    transform: translateY(0) rotate(8deg);
  }
  84% {
    transform: rotate(-4deg);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
</style>
