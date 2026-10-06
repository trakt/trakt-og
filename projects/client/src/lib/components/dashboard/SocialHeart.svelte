<!--
  A rating as a small heart chip in the rating's color: "♥ 8". Screen readers hear "rated 8 out of 10".
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import heart from '$lib/icons/solid/heart.svg?raw';

const { rating }: { rating: number } = $props();
</script>

<span class="heart" style:--heart-color="var(--rating-{rating})"><Icon svg={heart} /><span class="sr">rated
  </span>{rating}<span class="sr"> out of 10</span></span>

<style>
.heart {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-block);
  padding: var(--space-social-heart);
  border-radius: var(--social-pill-radius);
  background-color: var(--heart-color);
  color: var(--color-social-on-image);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  line-height: var(--social-heart-line);
  white-space: nowrap;
}

.sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
