<!--
  A number whose digits roll into place like an odometer the first time it scrolls into view, then stay put. The server
  renders the number as it ends, and screen readers read it whole. Under reduced motion it never rolls.
    <RollingNumber value={150660} />
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';

const { value }: { value: number } = $props();

const text = $derived(value.toLocaleString('en-US'));
const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);
/** It rolls once it's this much on screen, so a number peeking in at the edge waits. */
const ON_SCREEN = 0.9;

let parked = $state(false);

/** Parks every reel at 0 until the number is on screen, then lets them roll to their digits. */
const rollIn: Attachment<HTMLElement> = (node) => {
  if (prefersReducedMotion.current) return;
  parked = true;
  const seen = new IntersectionObserver(([entry]) => {
    if (!entry || entry.intersectionRatio < ON_SCREEN) return;
    seen.disconnect();
    requestAnimationFrame(() => (parked = false));
  }, { threshold: ON_SCREEN });
  seen.observe(node);
  return () => seen.disconnect();
};
</script>

<span class={['rolling', { parked }]} aria-label={text} role="img" {@attach rollIn}>
  {#each text as char, i (i)}
    {#if /\d/.test(char)}
      <span class="window" aria-hidden="true">
        <span class="reel" style:--digit={Number(char)} style:--order={i}>
          {#each DIGITS as digit (digit)}<span>{digit}</span>{/each}
        </span>
      </span>
    {:else}
      <span aria-hidden="true">{char}</span>
    {/if}
  {/each}
</span>

<style>
.rolling {
  display: inline-flex;
  font-variant-numeric: tabular-nums;
  line-height: var(--rolling-number-line);
}

.window {
  display: inline-block;
  block-size: var(--rolling-number-line);
  overflow: hidden;
}

.reel {
  display: flex;
  flex-direction: column;
  translate: 0 calc(var(--digit) * -1 * var(--rolling-number-line));
  transition: translate var(--rolling-number-duration) var(--rolling-number-easing);
  transition-delay: calc(var(--order) * var(--rolling-number-stagger));
}

.parked .reel {
  translate: 0 0;
  transition: none;
}
</style>
