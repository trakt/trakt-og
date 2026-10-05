<!--
  A section heading's icon as a faint watermark: large, mostly in the margin to the left of the title, behind the
  text and fading out before the content. It's og's own treatment; OG put a thin icon inline before the title.
  Put it first inside the heading, and give the heading `position: relative` and `isolation: isolate` so the mark
  sits behind the text but in front of the panel's background.
    <h2 class="heading"><HeadingMark svg={forward} />Up Next</h2>
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';

const { svg }: { svg: string } = $props();
</script>

<span class="mark" aria-hidden="true"><Icon {svg} /></span>

<style>
.mark {
  position: absolute;
  inset-block-start: var(--space-heading-mark-block);
  inset-inline-start: var(--space-heading-mark-inline);
  z-index: -1;
  color: var(--color-heading-mark);
  font-size: var(--font-size-heading-mark);
  line-height: 1;
  pointer-events: none;
  mask-image: var(--mask-heading-mark);
}
</style>
