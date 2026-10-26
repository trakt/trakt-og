<!--
  The GIF picked in the comment composer, under the field: it pops in, and a frosted button on its corner takes it off.
  Reduced motion gets the still, and no pop.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/solid/xmark.svg?raw';
import type { GifEntry } from './GifEntry.ts';
import { gifPop } from './gifPop.ts';

const { gif, onremove }: { gif: GifEntry; onremove: () => void } = $props();
</script>

{#key gif.id}
  <div class="picked" in:gifPop>
  <picture>
      {#if gif.still}<source media="(prefers-reduced-motion: reduce)" srcset={gif.still.url} />{/if}
      <img src={gif.preview.url} width={gif.preview.width} height={gif.preview.height} alt="The GIF you picked" />
    </picture>
  <Tooltip text="Remove the GIF">
    {#snippet trigger(tooltip)}
      <button type="button" class="remove" aria-label="Remove the GIF" onclick={onremove} {...tooltip}>
        <Icon svg={xmark} />
      </button>
    {/snippet}
  </Tooltip>
</div>
{/key}

<style>
.picked {
  position: relative;
  inline-size: fit-content;
  margin: var(--composer-gif-margin);
  transform-origin: bottom left;

  & img {
    display: block;
    inline-size: auto;
    max-inline-size: 100%;
    block-size: var(--composer-gif-height);
    border-radius: var(--radius-comment-gif);
    background-color: var(--color-comment-chip);
    box-shadow: var(--shadow-composer-gif);
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
  min-block-size: 0;
  padding: 0;
  border: 1px solid var(--color-composer-gif-remove-ring);
  border-radius: 50%;
  background-color: var(--color-composer-gif-remove-bg);
  backdrop-filter: var(--composer-gif-remove-blur);
  box-shadow: var(--shadow-composer-gif-remove);
  color: var(--color-gif-on-image);
  font-size: var(--font-size-composer-gif-remove);
  line-height: 1;
  transition:
    background-color var(--transition-comment-quiet),
    transform var(--transition-comment-quiet);

  & :global(.icon) {
    vertical-align: 0;
    transition: transform var(--transition-comment-quiet);
  }

  &:hover,
  &:focus-visible {
    border-color: transparent;
    background-color: var(--color-composer-gif-remove-hover-bg);
    transform: scale(1.1);

    & :global(.icon) {
      transform: rotate(90deg);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-gif-on-image);
    outline-offset: var(--focus-ring-width);
  }
}

@media (prefers-reduced-motion: reduce) {
  .remove,
  .remove :global(.icon) {
    transition: none;
  }
}
</style>
