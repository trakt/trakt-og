<!--
  A red line across the top of the window while the next page loads. og keeps the current page up until the new one's
  data arrives, and OG's full page loads had the browser's own spinner, so this says the click was heard. It waits a
  beat so a quick page never flashes it, creeps along while the page loads, then runs to the end and fades. With the
  OS set to reduce motion, it fades in at full width and holds still.
-->
<script lang="ts">
const { active }: { active: boolean } = $props();

const FINISH_MS = 300;

// From wherever the line got to, run it to the end, then fade it in the second half. A line that never showed stays
// hidden.
function finish(node: HTMLElement) {
  const { opacity, transform } = getComputedStyle(node);
  const shown = Number(opacity);
  const reached = new DOMMatrixReadOnly(transform).a;
  return {
    duration: shown ? FINISH_MS : 0,
    css: (t: number) => `opacity: ${shown * Math.min(1, t * 2)}; transform: scaleX(${1 - (1 - reached) * t})`,
  };
}
</script>

{#if active}<div class="navigation-progress" aria-hidden="true" out:finish></div>{/if}

<style>
.navigation-progress {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: var(--z-navigation-progress);
  block-size: var(--navigation-progress-height);
  background-color: var(--color-navigation-progress);
  transform-origin: 0 0;
  pointer-events: none;
  animation:
    appear var(--transition-navigation-progress-appear) var(--navigation-progress-delay) both,
    crawl var(--transition-navigation-progress-crawl) var(--navigation-progress-delay) both;
}

@keyframes appear {
  from {
    opacity: 0;
  }
}

@keyframes crawl {
  from {
    transform: scaleX(0.1);
  }

  to {
    transform: scaleX(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .navigation-progress {
    animation: appear var(--transition-navigation-progress-appear) var(--navigation-progress-delay) both;
  }
}
</style>
