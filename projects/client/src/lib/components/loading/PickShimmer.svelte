<!--
  A starter pick's place while its chart loads: the poster, then its one button under it, as tall as a loaded pick.
  Hidden from screen readers, so the row around it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';
</script>

<div class="pick-shimmer" aria-hidden="true">
  <span class="art"><Shimmer inline="100%" block="100%" /></span>
  <Shimmer inline="100%" block="var(--glass-action-height)" />
</div>

<style>
.pick-shimmer {
  display: grid;
  gap: var(--pick-shimmer-gap);
  min-inline-size: 0;
}

.art {
  display: flex;
  aspect-ratio: var(--ratio-poster);
}
</style>
