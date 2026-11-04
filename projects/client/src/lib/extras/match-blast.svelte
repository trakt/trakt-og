<!--
  A burst of 8-bit sparks from the middle of whatever holds it, in the level's colors, gone in half a second.
  Decorative; it never takes the pointer.
    <span class="slot">VS <MatchBlast /></span>
-->
<script lang="ts">
const COUNT = 14;
// Each spark: where it flies to (px from the middle) on one of three rings, and which of three colors it is.
const SPARKS = Array.from({ length: COUNT }, (_, n) => {
  const angle = (n / COUNT) * Math.PI * 2;
  const reach = 46 + (n % 3) * 14;
  return { dx: Math.round(Math.cos(angle) * reach), dy: Math.round(Math.sin(angle) * reach), tone: n % 3 };
});
</script>

<span class="blast" aria-hidden="true">
  {#each SPARKS as { dx, dy, tone }, n (n)}
    <i class="tone-{tone}" style:--dx="{dx}px" style:--dy="{dy}px"></i>
  {/each}
</span>

<style>
.blast {
  --spark: 6px;
  --blast-duration: 0.5s;

  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  z-index: 3;
  inline-size: 0;
  block-size: 0;
  pointer-events: none;
}

i {
  position: absolute;
  inline-size: var(--spark);
  block-size: var(--spark);
  margin: calc(var(--spark) / -2);
  animation: spark var(--blast-duration) steps(6, end) forwards;
}

.tone-0 {
  background: var(--match-text, #fff6c2);
}

.tone-1 {
  background: var(--match, #ffc400);
}

.tone-2 {
  background: var(--match-end, #ff6a00);
}

@keyframes spark {
  from {
    opacity: 1;
    transform: translate(0, 0) scale(1.4);
  }

  to {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(0.6);
  }
}
</style>
