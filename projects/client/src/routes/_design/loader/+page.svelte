<!--
  The page loader as lists and progress pages show it, and the shimmering bars that hold a number's or a name's place
  on the home page.
-->
<script lang="ts">
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
</script>

<Specimen title="Page loader" bleed
  note="LoadingOverlay over a list while it loads or saves: TraktLoader at 64px on the backdrop. Red rises in a wave until the disc is full, then drains. With the OS set to reduce motion, the mark breathes instead.">
  <div class="viewport">
    <LoadingOverlay visible />
  </div>
</Specimen>

<Specimen title="Shimmer" row note="Holds a flag's, a name's or a pill's place on the home page while it loads.">
  <Variant label="Flag">
    <span class="home"><Shimmer inline="var(--home-flag-size)" block="var(--home-flag-size)" round /></span>
  </Variant>
  <Variant label="Name">
    <span class="home">
      <Shimmer inline="var(--home-rank-shimmer-name-width)" block="var(--font-size-home-rank-name)" />
    </span>
  </Variant>
  <Variant label="Pill">
    <span class="home">
      <Shimmer inline="var(--home-live-shimmer-pill-width)" block="var(--home-live-shimmer-pill-height)" />
    </span>
  </Variant>
</Specimen>

<style>
/* Paint containment makes the overlay's fixed position fill this box instead of the window. */
.viewport {
  contain: paint;
  aspect-ratio: var(--ratio-fanart);
}

.home {
  display: flex;
  padding: var(--gutter);
  border-radius: var(--radius-object);
  background-color: var(--color-home-bg);
}
</style>
