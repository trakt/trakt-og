<!--
  A favorite's tooltip, like the watched and library ones: "Favorited on Sep 28, 2026", the date in bold. With a
  `note`, the note sits in its footer, laid out like the list tooltip's names.
    <Tooltip content={tip}>{#snippet tip()}<FavoritedTip {date} {note} />{/snippet}</Tooltip>
-->
<script lang="ts">
import FavoriteNoteTip from '#lib/components/favorites/FavoriteNoteTip.svelte';
import TooltipFooter from '#lib/components/tooltip/TooltipFooter.svelte';

const { date, note }: { date?: string; note?: string } = $props();
</script>

{#snippet head()}{#if date}Favorited on <b>{date}</b>{:else}Favorited{/if}{/snippet}

{#if note}
  <span class="favorited-tip">
    <span class="head">{@render head()}</span>
    <TooltipFooter><FavoriteNoteTip {note} /></TooltipFooter>
  </span>
{:else}
  <span>{@render head()}</span>
{/if}

<style>
.favorited-tip {
  display: grid;
}

.head {
  padding: var(--space-tooltip-rich);
}

b {
  font-weight: var(--font-weight-headings-heavy);
}
</style>
