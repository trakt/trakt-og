<!--
  One GIF in the picker's grid, a button that picks it. Its box keeps the GIF's shape before it loads, and reduced
  motion gets the still.
-->
<script lang="ts">
import type { GifEntry } from './GifEntry.ts';

const { gif, onselect }: { gif: GifEntry; onselect: () => void } = $props();
</script>

<button
  type="button"
  class="tile"
  aria-label={gif.title}
  style:aspect-ratio="{gif.preview.width} / {gif.preview.height}"
  onclick={onselect}
>
  <picture>
    {#if gif.still}<source media="(prefers-reduced-motion: reduce)" srcset={gif.still.url} />{/if}
    <img src={gif.preview.url} alt="" loading="lazy" decoding="async" />
  </picture>
</button>

<style>
.tile {
  display: block;
  inline-size: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-comment-gif);
  background-color: var(--color-comment-chip);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--focus-ring-width));
  }

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}
</style>
