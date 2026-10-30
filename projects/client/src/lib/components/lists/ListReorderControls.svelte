<!--
  The lists page's reorder controls on a list tile: the editable rank pill, over the first poster where the rank pill
  sits (the tile's `--rank-anchor-width`), and drag, move first, up, down and last in the glass edit strip across the
  tile's bottom.
-->
<script lang="ts">
import EditStrip from '$lib/components/lists/EditStrip.svelte';
import RankInput from '$lib/components/lists/RankInput.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import drag from '$lib/icons/solid/arrows-up-down-left-right.svg?raw';
import first from '$lib/icons/solid/angles-up.svg?raw';
import up from '$lib/icons/solid/angle-up.svg?raw';
import down from '$lib/icons/solid/angle-down.svg?raw';
import last from '$lib/icons/solid/angles-down.svg?raw';
interface Props {
  name: string;
  rank: number;
  total: number;
  busy?: boolean;
  onmove: (rank: number) => void;
  ondrag: (event: PointerEvent) => void;
}
const { name, rank, total, busy = false, onmove, ondrag }: Props = $props();
</script>
<span class="rank-anchor"><RankInput {name} {rank} {busy} {onmove} /></span>
<div class="controls">
  <EditStrip centered>
    <Tooltip text="Drag to reorder">
      {#snippet trigger(tooltip)}
        <button type="button" class="drag" aria-label="Drag to reorder {name}" aria-keyshortcuts="ArrowUp ArrowDown" aria-disabled={busy}
          {...tooltip} onpointerdown={ondrag} onkeydown={(event) => {
            if (busy || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault(); onmove(rank + (event.key === 'ArrowUp' ? -1 : 1));
          }}><Icon svg={drag} /></button>
      {/snippet}
    </Tooltip>
    {@render action('Move first', first, 1, rank === 1)}
    {@render action('Move up', up, rank - 1, rank === 1)}
    {@render action('Move down', down, rank + 1, rank === total)}
    {@render action('Move last', last, total, rank === total)}
  </EditStrip>
</div>
{#snippet action(label: string, svg: string, to: number, edge: boolean)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <button type="button" class={{ edge }} aria-label="{label}: {name}" aria-disabled={edge || busy} {...tooltip}
        onclick={() => { if (!edge && !busy) onmove(to); }}><Icon {svg} /></button>
    {/snippet}
  </Tooltip>
{/snippet}
<style>
.rank-anchor {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: var(--rank-anchor-width, 100%);
}

/* Covers the tile, so a click while reordering doesn't open the list. */
.controls {
  position: absolute;
  inset: 0;
}
</style>
