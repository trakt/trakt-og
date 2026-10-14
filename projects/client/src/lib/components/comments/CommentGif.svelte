<!--
  A comment's Klipy GIF, under its text, at a set height and its own width. The API's size, when it has one, holds
  the GIF's box before it loads. Klipy has no still to swap in for reduced motion, so there the GIF waits behind a
  play button: the <source> loads a blank pixel instead, with no script, until the reader presses play.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import play from '$lib/icons/solid/play.svg?raw';

type Gif = { readonly url: string; readonly width?: number; readonly height?: number };

const { gif }: { gif: Gif } = $props();

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
let playing = $state(false);
</script>

<div class="comment-gif">
  <picture>
    {#if !playing}<source media="(prefers-reduced-motion: reduce)" srcset={BLANK} />{/if}
    <img
      src={gif.url}
      width={gif.width || undefined}
      height={gif.height || undefined}
      alt="GIF attached to the comment"
      loading="lazy"
      decoding="async"
    />
  </picture>
  {#if !playing}
    <button type="button" class="play" onclick={() => (playing = true)}><Icon svg={play} /> Play GIF</button>
  {/if}
</div>

<style>
.comment-gif {
  display: grid;
  inline-size: fit-content;
  max-inline-size: 100%;

  :global(.comment-text:not(:empty)) + & {
    margin-block-start: var(--comment-bubble-gap);
  }

  & > * {
    grid-area: 1 / 1;
  }

  & img {
    display: block;
    inline-size: auto;
    max-inline-size: 100%;
    block-size: var(--comment-gif-height);
    border-radius: var(--radius-comment-gif);
    background-color: var(--color-comment-chip);
    object-fit: cover;
  }
}

/* Only reduced motion needs it; everyone else sees the GIF play. */
.play {
  display: none;
  place-self: center;
  gap: var(--comment-action-icon-gap);
  align-items: center;

  @media (prefers-reduced-motion: reduce) {
    display: inline-flex;
  }
}
</style>
