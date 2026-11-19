<!--
  A section heading's icon as a faint watermark: large, mostly in the margin to the left of the title, behind the
  text and fading out before the content. It's og's own treatment; OG put a thin icon inline before the title.
  Put it first inside the heading, and give the heading `position: relative` and `isolation: isolate` so the mark
  sits behind the text but in front of the panel's background. `live` draws the pulsing live dot instead, in full
  color, centered on the title's line just before it (Watching Now), and `hot` a flame there instead, slowly
  flickering (Hot in Your Network). Both hold still for reduced motion.
    <h2 class="heading"><HeadingMark svg={forward} />Up Next</h2>
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import StatusDot from '#lib/components/status/StatusDot.svelte';
import fire from '#lib/icons/solid/fire.svg?raw';

const { svg, live = false, hot = false }: { svg?: string; live?: boolean; hot?: boolean } = $props();
</script>

<span class={['mark', { live, hot }]} aria-hidden="true">
  {#if live}<StatusDot kind="live" />{:else if hot}<span class="flame"><Icon svg={fire} /></span>{:else if svg}<Icon
      {svg} />{/if}
</span>

<style>
.mark {
  position: absolute;
  inset-block-start: var(--space-heading-mark-block);
  inset-inline-start: var(--space-heading-mark-inline);
  z-index: -1;
  color: var(--color-heading-mark);
  font-size: var(--font-size-heading-mark);
  line-height: 1;
  pointer-events: none;
  mask-image: var(--mask-heading-mark);

  &.live {
    --social-dot: var(--size-heading-live-dot);
    inset-block-start: 50%;
    inset-inline-start: calc(-1 * var(--space-heading-live-dot));
    display: flex;
    translate: 0 -50%;
    mask-image: none;
  }

  &.hot {
    inset-block-start: 50%;
    inset-inline-start: calc(-1 * var(--space-heading-hot));
    display: flex;
    color: var(--color-heading-hot);
    font-size: var(--size-heading-hot);
    translate: 0 -50%;
    mask-image: none;
  }
}

/* A slow flicker from the flame's base: a little taller and brighter, then settling. */
.flame {
  display: flex;
  transform-origin: 50% 100%;
  animation: flicker var(--heading-hot-flicker) ease-in-out infinite;
}

@keyframes flicker {
  50% {
    filter: drop-shadow(0 0 var(--heading-hot-glow) var(--color-heading-hot));
    transform: scale(1.08, 1.14);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flame {
    animation: none;
  }
}
</style>
