<!--
  The copy of a dragged list item under the pointer, lifted off the page while the other items make room. On release
  it glides into its new place, then calls `onlanded`. It's fixed to the viewport, so render it outside any container
  query (a PosterGrid), which would hold it instead. A poster grid lifts the poster alone; a row lifts its children.
    {#if reorder.ghost}
      <DragGhost ghost={reorder.ghost} {duration} onlanded={reorder.landed} poster={reorder.ghost.item.image} />
      <DragGhost ghost={reorder.ghost} {duration} onlanded={reorder.landed}>…</DragGhost>
    {/if}
-->
<script lang="ts">
import posterPlaceholder from '#lib/assets/placeholders/poster.png';
import type { Snippet } from 'svelte';
import type { DragGhostState } from '#lib/lists/createDragReorder.svelte.ts';

type Props = {
  ghost: DragGhostState;
  /** The page's motion duration in ms: 0 under reduced motion. */
  duration: number;
  onlanded: () => void;
} & ({ /** The dragged poster's image; undefined shows the placeholder. */ poster: string | undefined } | { children: Snippet });

const props: Props = $props();
const { ghost, duration, onlanded } = $derived(props);

let raised = $state(false);
const raise = () => {
  const frame = requestAnimationFrame(() => (raised = true));
  return () => cancelAnimationFrame(frame);
};

$effect(() => {
  if (!ghost.settling) return;
  const timer = setTimeout(onlanded, duration);
  return () => clearTimeout(timer);
});
</script>

<div class={['drag-ghost', { lifted: raised && !ghost.settling, settling: ghost.settling }]}
  style:translate="{ghost.x}px {ghost.y}px" style:inline-size="{ghost.width}px"
  style:--drag-ghost-duration="{duration}ms" inert aria-hidden="true" {@attach raise}>
  {#if 'children' in props}
    <div class="lift">{@render props.children()}</div>
  {:else}
    <img class="lift poster" src={props.poster ?? posterPlaceholder} alt="" />
  {/if}
</div>

<style>
.drag-ghost {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: var(--z-list-reorder-ghost);
  pointer-events: none;

  &.settling {
    transition: translate var(--drag-ghost-duration) ease-out;
  }
}

.lift {
  background-color: var(--color-list-reorder-ghost-bg);
  box-shadow: var(--shadow-list-reorder-ghost);
  transition: transform var(--drag-ghost-duration) ease-out;

  .lifted & {
    transform: var(--list-reorder-ghost-lift);
  }
}

.poster {
  display: block;
  inline-size: 100%;
  aspect-ratio: var(--ratio-poster);
  object-fit: cover;
  border-radius: var(--radius-card-framed);
}
</style>
