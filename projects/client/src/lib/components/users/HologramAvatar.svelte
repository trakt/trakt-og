<!--
  A private profile's avatar as a flickering blue hologram over its projector. The photo is tinted to the hologram's
  blue, with scanlines rolling over it. While the viewer's follow request is `pending` it turns amber, and it flickers
  as it changes either way. It's null until the follow state streams in, so a request sent earlier loads amber without
  a flicker. `element` binds the hologram so the sky can launch a courier ship from it. Under reduced motion it holds
  still.
    <HologramAvatar src={user.avatarUrl} pending={requested} bind:element={hologram} />
-->
<script lang="ts">
import { prefersReducedMotion } from 'svelte/motion';

interface Props {
  src: string;
  pending?: boolean | null;
  element?: HTMLElement;
}

let { src, pending = null, element = $bindable() }: Props = $props();

const RETUNE = [
  { opacity: 1 },
  { opacity: 0.2, offset: 0.1 },
  { opacity: 0.9, offset: 0.2, translate: '3px 0' },
  { opacity: 0.1, offset: 0.35, translate: '0 0' },
  { opacity: 1, offset: 0.45 },
  { opacity: 0.4, offset: 0.6, translate: '-2px 0' },
  { opacity: 1, offset: 0.7, translate: '0 0' },
  { opacity: 1 },
];
let tuned: boolean | null = null;

$effect(() => {
  if (tuned !== null && pending !== null && tuned !== pending && !prefersReducedMotion.current) {
    element?.animate(RETUNE, { duration: 700 });
  }
  if (pending !== null) tuned = pending;
});
</script>

<div class={['hologram', { pending }]} bind:this={element}>
  <div class="disc">
    <div class="screen"><img {src} alt="" width="132" height="132" /></div>
  </div>
  <div class="cone"></div>
  <div class="emitter"></div>
</div>

<style>
.hologram {
  --backdrop: var(--color-hologram-backdrop);
  --filter: var(--filter-hologram);
  --shadow: var(--shadow-hologram);
  --cone: var(--gradient-hologram-cone);
  --emitter: var(--gradient-hologram-emitter);
  --emitter-shadow: var(--shadow-hologram-emitter);
  display: grid;
  justify-items: center;

  &.pending {
    --backdrop: var(--color-hologram-backdrop-pending);
    --filter: var(--filter-hologram-pending);
    --shadow: var(--shadow-hologram-pending);
    --cone: var(--gradient-hologram-cone-pending);
    --emitter: var(--gradient-hologram-emitter-pending);
    --emitter-shadow: var(--shadow-hologram-emitter-pending);
  }
}

.disc {
  position: relative;
  inline-size: var(--hologram-size);
  block-size: var(--hologram-size);
  border-radius: 50%;
  box-shadow: var(--shadow);
  animation: flicker var(--duration-hologram-flicker) steps(1) infinite;
}

.screen {
  position: relative;
  block-size: 100%;
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--backdrop);

  /* Scanlines, a little taller than the disc so they can roll down one line and start over. */
  &::after {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--hologram-scanline-period)) 0 0;
    background: var(--gradient-hologram-scanlines);
    animation: scan var(--duration-hologram-scan) linear infinite;
  }
}

img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: var(--opacity-hologram);
  filter: var(--filter);
  mix-blend-mode: screen;
}

.cone {
  inline-size: var(--hologram-cone-width);
  block-size: var(--hologram-cone-height);
  margin-block-start: calc(-1 * var(--hologram-cone-overlap));
  clip-path: polygon(6% 0, 94% 0, 56% 100%, 44% 100%);
  background: var(--cone);
  animation: pulse var(--duration-hologram-pulse) ease-in-out infinite;
}

.emitter {
  inline-size: var(--hologram-emitter-width);
  block-size: var(--hologram-emitter-height);
  border-radius: 50%;
  background: var(--emitter);
  box-shadow: var(--emitter-shadow);
}

@keyframes flicker {
  41% {
    opacity: 0.72;
  }
  42% {
    opacity: 1;
  }
  43% {
    opacity: 0.85;
    translate: 2px 0;
  }
  44% {
    opacity: 1;
    translate: 0 0;
  }
  78% {
    opacity: 0.9;
  }
  79% {
    opacity: 1;
  }
}

@keyframes scan {
  to {
    translate: 0 var(--hologram-scanline-period);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.65;
  }
}

@media (prefers-reduced-motion: reduce) {
  .disc,
  .screen::after,
  .cone {
    animation: none;
  }
}
</style>
