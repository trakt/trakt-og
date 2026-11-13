<!--
  A streaming tag's tooltip, in the watched tooltip's style: when the episode airs on TV, the date and time in bold,
  over its network in gray.
    <Tooltip content={tip}>{#snippet tip()}<AirsTip {...airs} />{/snippet}</Tooltip>
-->
<script lang="ts">
import type { AirsTip } from './AirsTip.ts';

const { label, date, time, network }: AirsTip = $props();
</script>

<span class="airs">
  <span>{label} on <b>{date}</b> at <b>{time}</b></span>
  {#if network}<span class="detail">{network}</span>{/if}
</span>

<style>
.airs {
  display: grid;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.detail {
  color: var(--color-tooltip-muted);
}
</style>
