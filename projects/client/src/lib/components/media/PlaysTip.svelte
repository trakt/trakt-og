<!--
  A movie's or episode's watched tooltip: when you last watched it, the date in bold, over the runtime in gray, or the
  play count and their total time in italics after more than one play. Without a date it just says "Watched".
    <Tooltip content={tip}>{#snippet tip()}<PlaysTip plays={fill.tips.plays} />{/snippet}</Tooltip>
-->
<script lang="ts">
import { playsLines } from './playsLines.ts';
import type { WatchedPlays } from './WatchedPlays.ts';

const { plays }: { plays: WatchedPlays } = $props();

const lines = $derived(playsLines(plays));
</script>

<span class="plays">
  <span>{lines.at ? `${lines.lead} on ` : lines.lead}{#if lines.at}<b>{lines.at}</b>{/if}</span>
  {#if lines.plays}
    <span class="detail">{lines.time ? `${lines.plays} ` : lines.plays}{#if lines.time}<em>({lines.time})</em>{/if}</span>
  {:else if lines.time}
    <span class="detail">{lines.time}</span>
  {/if}
</span>

<style>
.plays {
  display: grid;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.detail {
  color: var(--color-tooltip-muted);
}
</style>
