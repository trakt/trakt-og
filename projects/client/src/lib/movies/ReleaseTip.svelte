<!--
  A release mark's tooltip, the way the charts' marks read: its type small and gray, the date big, then a line for a
  limited run, a rating that differs from the country's and each part of its note, with any disc formats' logos in
  the footer.
    <Tooltip toggles>{#snippet trigger(tooltip)}…{/snippet}<ReleaseTip {release} /></Tooltip>
-->
<script lang="ts">
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import TooltipStat from '$lib/components/tooltip/TooltipStat.svelte';
import ReleaseFormats from './ReleaseFormats.svelte';
import type { ReleaseDate } from './toMovieReleases.ts';

const { release }: { release: ReleaseDate } = $props();
const lines = $derived([
  ...(release.limited ? [{ text: 'Limited release' }] : []),
  ...(release.certification ? [{ text: `Rated ${release.certification}` }] : []),
  ...release.notes.map((text) => ({ text })),
]);
</script>

<span class="release-tip">
  <TooltipStat label={release.type} value={release.dateText} {lines} />
  {#if release.formats.length > 0}<TooltipFooter><ReleaseFormats formats={release.formats} /></TooltipFooter>{/if}
</span>

<style>
.release-tip {
  display: grid;
}
</style>
