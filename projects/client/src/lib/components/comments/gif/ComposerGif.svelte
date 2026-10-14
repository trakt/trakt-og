<!--
  The GIF picked in the comment composer, under the field, with a button that takes it off. Reduced motion gets the
  still.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/solid/xmark.svg?raw';
import type { GifEntry } from './GifEntry.ts';

const { gif, onremove }: { gif: GifEntry; onremove: () => void } = $props();
</script>

<div class="picked">
  <picture>
    {#if gif.still}<source media="(prefers-reduced-motion: reduce)" srcset={gif.still.url} />{/if}
    <img src={gif.preview.url} width={gif.preview.width} height={gif.preview.height} alt="The GIF you picked" />
  </picture>
  <button type="button" class="remove" aria-label="Remove the GIF" onclick={onremove}><Icon svg={xmark} /></button>
</div>

<style>
.picked {
  position: relative;
  inline-size: fit-content;
  margin: var(--composer-gif-margin);

  & img {
    display: block;
    inline-size: auto;
    max-inline-size: 100%;
    block-size: var(--composer-gif-height);
    border-radius: var(--radius-comment-gif);
    background-color: var(--color-comment-chip);
    object-fit: cover;
  }
}

.remove {
  display: grid;
  position: absolute;
  inset-block-start: var(--composer-gif-remove-inset);
  inset-inline-end: var(--composer-gif-remove-inset);
  place-items: center;
  inline-size: var(--composer-gif-remove-size);
  block-size: var(--composer-gif-remove-size);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-composer-gif-remove-bg);
  color: var(--color-gif-on-image);
  cursor: pointer;
}
</style>
