<!--
  OG's rewatching badge: a round backward icon over a poster's top-left corner, in the watch quick icon's purple.
  Put it in the positioned card, before the poster.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import backward from '$lib/icons/solid/backward.svg?raw';
const { date }: { date?: string } = $props();
</script>

<Tooltip>
  {#if date}Rewatching since <strong>{date}</strong>{:else}Rewatching{/if}
  {#snippet trigger(tooltip)}
    <div class="rewatching-badge" role="img" aria-label="Rewatching" {...tooltip}>
      <Icon svg={backward} />
    </div>
  {/snippet}
</Tooltip>

<style>
.rewatching-badge {
  position: absolute;
  inset-block-start: var(--rewatching-badge-offset);
  inset-inline-start: var(--rewatching-badge-offset);
  z-index: 30;
  inline-size: var(--badge-size);
  block-size: var(--badge-size);
  padding-inline-start: 6px;
  border: 2px solid var(--color-badge-border);
  border-radius: 50%;
  background-color: var(--color-rewatching-badge-bg);
  color: var(--color-rewatching-badge-text);
  font-size: var(--font-size-badge);
  line-height: 27px;
}
</style>
