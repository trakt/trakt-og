<!--
  The status pill on a tile or a row: a pulsing red dot for "Watching now", a still green one for a sitting that ended
  within the hour, or no dot at all. Only the live dot moves, and not with reduced motion.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  dot?: 'live' | 'done';
  /** Over a still, or on the panel's own background. */
  onImage?: boolean;
  children: Snippet;
}

const { dot, onImage = false, children }: Props = $props();
</script>

<span class={['pill', { 'on-image': onImage }]}>
  {#if dot}<span class={['dot', dot]} aria-hidden="true"></span>{/if}
  {@render children()}
</span>

<style>
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm-block);
  padding: var(--space-social-pill);
  border: 1px solid var(--color-social-line);
  border-radius: var(--social-pill-radius);
  background-color: var(--color-social-chip-bg);
  font-size: var(--font-size-social-pill);
  font-weight: bold;
  white-space: nowrap;

  &.on-image {
    border-color: transparent;
    background-color: var(--color-social-pill-on-image);
    color: var(--color-social-on-image);
  }
}

.dot {
  position: relative;
  flex: none;
  inline-size: var(--social-dot);
  block-size: var(--social-dot);
  border-radius: 50%;

  &.done {
    background-color: var(--color-social-done);
  }

  &.live {
    background-color: var(--color-social-live);

    &::after {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background-color: var(--color-social-live-glow);
      animation: pulse var(--social-pulse) ease-out infinite;
      content: '';
    }
  }
}

@keyframes pulse {
  to {
    opacity: 0;
    transform: scale(3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot.live::after {
    animation: none;
    opacity: 0;
  }
}
</style>
