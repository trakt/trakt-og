<!--
  The Follow button's place while the viewer's follow state loads, on the profile cover and the network page's user
  cards: a pill as big as the button, in the buttons' dark glass with a light sweep, so it reads on the cover and on a
  card's footer in both themes. Hidden from screen readers, so whatever holds it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';
</script>

<span class="follow-shimmer" aria-hidden="true"><Shimmer inline="100%" block="100%" /></span>

<style>
.follow-shimmer {
  --shimmer: var(--shimmer-on-art);

  display: flex;
  inline-size: var(--follow-shimmer-width);
  block-size: var(--profile-button-height);
  overflow: hidden;
  border-radius: var(--radius-profile-button);
  background-color: var(--color-profile-pill-bg);
}
</style>
