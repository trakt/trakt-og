<!--
  The fanart header turns to the 500 page's falling green code in place of the fanart, on the summary and
  every subpage. It sits under the title, the shade and the ratings strip, and never takes the pointer. Each page
  brings its own header, so it moves into the new one after every navigation. Reduced motion gets one still frame.
-->
<script lang="ts">
import { afterNavigate } from '$app/navigation';
import type { Attachment } from 'svelte/attachments';
import { animateScene } from '#lib/components/error/animateScene.ts';

// It loads after the page it lands on, so it draws right away and again after every navigation that follows.
let visit = $state(1);
afterNavigate(() => visit++);

const pin: Attachment<HTMLElement> = (node) => {
  const header = document.querySelector('.fanart-header');
  if (header) header.prepend(node);
  else node.hidden = true;
  return () => node.remove();
};
</script>

{#key visit}
  <canvas aria-hidden="true" {@attach pin} {@attach animateScene('code')}></canvas>
{/key}

<style>
canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  background: var(--color-error-scene-matrix);
  color: var(--color-error-scene-matrix-accent);
  pointer-events: none;
}
</style>
