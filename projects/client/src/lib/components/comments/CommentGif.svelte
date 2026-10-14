<!--
  A comment's Klipy GIF, under its text, at a set height and its own width. The API's size, when it has one, holds
  the GIF's box before it loads.
-->
<script lang="ts">
type Gif = { readonly url: string; readonly width?: number; readonly height?: number };

const { gif }: { gif: Gif } = $props();
</script>

<img
  class="comment-gif"
  src={gif.url}
  width={gif.width || undefined}
  height={gif.height || undefined}
  alt="GIF attached to the comment"
  loading="lazy"
  decoding="async"
/>

<style>
.comment-gif {
  display: block;
  inline-size: auto;
  max-inline-size: 100%;
  block-size: var(--comment-gif-height);
  border-radius: var(--radius-comment-gif);
  background-color: var(--color-comment-chip);
  object-fit: cover;

  :global(.comment-text:not(:empty)) + & {
    margin-block-start: var(--comment-bubble-gap);
  }
}
</style>
