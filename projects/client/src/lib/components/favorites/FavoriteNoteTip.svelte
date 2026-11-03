<!--
  A favorite's note as a tooltip body. CSS can balance lines but can't shrink a box to them, so once it's showing it
  narrows itself to the smallest width that keeps the line count it has at the tooltip's widest: even lines, the box
  fitting them.
    <Tooltip placement="left">{#snippet trigger(tip)}...{/snippet}<FavoriteNoteTip {note} /></Tooltip>
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';

const { note }: { note: string } = $props();

// A shut tooltip has no size, so it fits on the first resize with one. Reads `note`, so new text fits again.
const fit: Attachment<HTMLElement> = (node) => {
  void note;
  let fitted = false;
  const run = () => {
    if (fitted || !node.offsetWidth) return;
    fitted = true;
    node.style.removeProperty('inline-size');
    const height = node.offsetHeight;
    let low = 0;
    let high = node.offsetWidth;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      node.style.inlineSize = `${middle}px`;
      if (node.offsetHeight > height) low = middle;
      else high = middle;
    }
    node.style.inlineSize = `${high}px`;
  };
  const observer = new ResizeObserver(run);
  observer.observe(node);
  return () => {
    observer.disconnect();
    node.style.removeProperty('inline-size');
  };
};
</script>

<span class="favorite-note-tip" {@attach fit}>{note}</span>

<style>
.favorite-note-tip {
  display: block;
  max-inline-size: 100%;
  text-align: start;
  text-wrap: wrap;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
