<!--
  A movie's or episode's watched tooltip: the play count in bold, "3 plays", over their total time in gray, like the
  first two lines of a show's progress tooltip.
    <Tooltip content={tip}>{#snippet tip()}<PlaysTip plays={fill.tips.plays} />{/snippet}</Tooltip>
-->
<script lang="ts">
import { formatRuntime } from '$lib/utils/formatRuntime';
import type { WatchedPlays } from './WatchedPlays.ts';

const { plays }: { plays: WatchedPlays } = $props();
</script>

<span class="plays">
  <span><b>{plays.count.toLocaleString('en-US')}</b> {plays.count === 1 ? 'play' : 'plays'}</span>
  {#if plays.minutes}<span class="time">{formatRuntime(plays.minutes)}</span>{/if}
</span>

<style>
.plays {
  display: grid;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.time {
  color: var(--color-tooltip-muted);
}
</style>
