<!--
  The dashboard's status dot: red and pulsing while something is playing, still green once it has ended. Social Feed
  pills and the watching-now player both use it. Decorative; the text next to it says what it means.
    <StatusDot kind="live" />
-->
<script lang="ts">
const { kind }: { kind: 'live' | 'done' } = $props();
</script>

<span class={['dot', kind]} aria-hidden="true"></span>

<style>
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
