<!--
  The library tooltip, centered. A movie or episode: "Added to Plex on Apr 19, 2013", or "Added to library on" when
  no media server synced it, with the server and the date in bold. A show or season: the watched tooltip's progress, "84% in library" over
  "27 / 32 eps — from Plex" and a green bar. Under either, its format and audio (`CollectionLogoRow`) in the footer.
    <Tooltip content={tip}>{#snippet tip()}<LibraryTip tip={fill.tips.collected} />{/snippet}</Tooltip>
-->
<script lang="ts">
import ProgressTip from '$lib/components/media/ProgressTip.svelte';
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import { collectionBadges } from './collectionBadges.ts';
import CollectionLogoRow from './CollectionLogoRow.svelte';
import type { LibraryTipData } from './LibraryTipData.ts';
import { librarySourceIcon } from './librarySourceIcon.ts';

const { tip }: { tip: LibraryTipData } = $props();

const badges = $derived(collectionBadges(tip.metadata));
const source = $derived(librarySourceIcon(tip.sources)?.name);
const progress = $derived(
  tip.episodes
    ? [{
      verb: 'in library' as const,
      percent: Math.floor(Math.min(tip.episodes.done / tip.episodes.aired, 1) * 100),
      completed: tip.episodes.done,
      aired: tip.episodes.aired,
      from: source,
    }]
    : undefined,
);
</script>

{#snippet logos()}{#if badges}<CollectionLogoRow {badges} />{/if}{/snippet}

<span class="library-tip">
  {#if progress}
    <ProgressTip {progress} library footer={badges ? logos : undefined} />
  {:else}
    {#if tip.added !== undefined}
      <span class="added">Added to {#if source}<b>{source}</b>{:else}library{/if} {#if tip.added}on
          <b>{tip.added}</b>{:else}on an unknown date{/if}</span>
    {/if}
    {#if badges}<TooltipFooter>{@render logos()}</TooltipFooter>{/if}
  {/if}
</span>

<style>
.library-tip {
  display: grid;
}

.added {
  padding: var(--space-tooltip-library);

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
