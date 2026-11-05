<!--
  A movie's or episode's watched tooltip: when you last watched it, the date in bold, over the runtime in gray, or the
  play count and their total time in italics after more than one play. Without a date it just says "Watched". With
  `href`, the play count links to those plays in the viewer's history: a pointer shortcut in a new tab, out of the tab
  order like the list tooltip's names.
    <Tooltip content={tip}>{#snippet tip()}<PlaysTip plays={fill.tips.plays} {href} />{/snippet}</Tooltip>
-->
<script lang="ts">
import { playsLines } from './playsLines.ts';
import type { WatchedPlays } from './WatchedPlays.ts';

const { plays, href }: { plays: WatchedPlays; href?: string } = $props();

const lines = $derived(playsLines(plays));
</script>

<!-- The viewer's canonical slug, like the list tooltip's links. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<span class="plays">
  <span>{lines.at ? `${lines.lead} on ` : lines.lead}{#if lines.at}<b>{lines.at}</b>{/if}</span>
  {#if lines.plays}
    <span class="detail">{#if href}<a {href} target="_blank" rel="noopener" tabindex="-1">{lines.plays}</a>{:else}{lines.plays}{/if} {#if lines.time}<em>({lines.time})</em>{/if}</span>
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

a {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
