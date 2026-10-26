<!--
  A party hat that drops onto a headshot on a person's birthday: it falls in tilted, lands on the top edge and wobbles
  still. It sits in its own layer just over the site header, so its peak can rise above the header bar, and follows
  `anchor` (the headshot) as the page scrolls. It's decorative; with reduced motion it's simply there.
    <BirthdayHat anchor={headshot} />
-->
<script lang="ts">
import hat from './assets/birthday-hat.svg';
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

<div class="layer" aria-hidden="true" {@attach follow}>
  {#if spot}
    <img class="hat" src={hat} alt="" style:left="{spot.x}px" style:top="{spot.y}px" />
  {/if}
</div>

<style>
.layer {
  --extra-size: 62px;
  --extra-top: -62px; /* the brim on the headshot's top edge */
  --extra-tilt: 12deg;
  --extra-fall: -180px;
  --extra-bounce: -14px;
  --extra-duration: 1.1s;
  --extra-delay: 0.35s;
  --extra-shadow: 0 4px 6px rgb(0 0 0 / 0.45);

  position: fixed;
  inset: 0;
  z-index: calc(var(--z-header) + 1);
  overflow: hidden;
  pointer-events: none;
}

.hat {
  position: absolute;
  inline-size: var(--extra-size);
  margin-block-start: var(--extra-top);
  translate: -50% 0;
  rotate: var(--extra-tilt);
  transform-origin: 50% 100%;
  filter: drop-shadow(var(--extra-shadow));
  animation: drop var(--extra-duration) var(--extra-delay) both;
}

/* Falls in from high and tilted, lands, bounces once and wobbles to rest at a jaunty angle. */
@keyframes drop {
  0% {
    opacity: 0;
    transform: translateY(var(--extra-fall)) rotate(-35deg);
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }
  45% {
    opacity: 1;
    transform: translateY(0) rotate(4deg);
    animation-timing-function: ease-out;
  }
  60% {
    transform: translateY(var(--extra-bounce)) rotate(-10deg);
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
