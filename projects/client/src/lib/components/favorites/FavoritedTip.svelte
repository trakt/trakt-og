<!--
  A favorite's tooltip on one line, like the watched and library ones: "Favorited on Sep 28, 2026", the date in
  bold.
    <Tooltip content={tip}>{#snippet tip()}<FavoritedTip {date} />{/snippet}</Tooltip>
-->
<script lang="ts">
const { date }: { date: string } = $props();
</script>

<span>Favorited on <b>{date}</b></span>

<style>
b {
  font-weight: var(--font-weight-headings-heavy);
}
</style>
