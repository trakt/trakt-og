<!--
  An Upcoming Schedule entry's tags, the calendar's: the premiere or finale in its episode type's color, the air time
  in red, and the network in gray (a link to its popular shows). Nothing for a movie.
-->
<script lang="ts">
import CardTag from '$lib/components/media/CardTag.svelte';
import type { ScheduleRow } from '$lib/dashboard/toScheduleLayout';

const { row }: { row: ScheduleRow } = $props();
</script>

{#if row.label || row.time || row.network}
  <span class="tags">
    {#if row.label}<CardTag text={row.label.label} kind={row.label.kind} />{/if}
    {#if row.time}<CardTag text={row.time} />{/if}
    {#if row.network}<CardTag text={row.network.name} href={row.network.href} kind="generic" />{/if}
  </span>
{/if}

<style>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-schedule-tags);
  margin-block-start: var(--space-schedule-line);
}
</style>
