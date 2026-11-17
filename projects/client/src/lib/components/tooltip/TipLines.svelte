<!--
  A tooltip's text split on `\n`: the first line in the tooltip's white, the rest in its gray, like a certification's
  meaning over its age advice.
    <TipLines text={'Parents Strongly Cautioned\nAges 13+ Recommended'} />
-->
<script lang="ts">
const { text }: { text: string } = $props();
const lines = $derived(text.split('\n'));
</script>

<span class="tip-lines">
  {#each lines as line, i (i)}<span class={{ detail: i > 0 }}>{line}</span>{/each}
</span>

<style>
.tip-lines {
  display: grid;
}

.detail {
  color: var(--color-tooltip-muted);
}
</style>
