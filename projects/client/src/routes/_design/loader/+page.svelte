<!--
  The page loader as lists and progress pages show it, the shimmering bars that hold a number's or a name's place
  on the home page, and the shimmering cards that hold a dashboard panel's place.
-->
<script lang="ts">
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import CardShimmerRow from '$lib/components/loading/CardShimmerRow.svelte';
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

<Specimen title="Card shimmer"
  note="CardShimmerRow while a dashboard panel streams in: one row of the panel's cards, posters with their titles or fanart with the art's own. Narrow the window and it stays one row.">
  <Variant label="Posters, as Up Next, Watchlist and the Social Feed load">
    <CardShimmerRow columns={6} ratio="poster" />
  </Variant>
  <Variant label="Fanart, as Recently Watched loads">
    <CardShimmerRow columns={3} phoneColumns={1} ratio="fanart" />
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
