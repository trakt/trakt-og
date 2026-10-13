<!--
  What a schedule row airs: one or two episodes by number and title, one a line, three or more as
  "1x01–1x08 8 episodes" that opens to the list, or a movie's tagline.
-->
<script lang="ts">
import type { ScheduleRow } from '$lib/dashboard/toScheduleLayout';

const { row }: { row: ScheduleRow } = $props();
const { episodes } = $derived(row);
</script>

<!-- Episode pages are linked by slug paths built in the mapper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet episode({ number, title, href }: ScheduleRow['episodes'][number])}
  <a {href}><b>{number}</b>{title ? ` ${title}` : ''}</a>
{/snippet}

{#if episodes.length > 2}
  <details>
  <summary><b>{episodes.at(0)?.number}–{episodes.at(-1)?.number}</b> {episodes.length} episodes</summary>
  <ol>
      {#each episodes as item (item.href)}
        <li>{@render episode(item)}</li>
      {/each}
    </ol>
</details>
{:else}
  {#each episodes as item (item.href)}
    <div class="line">{@render episode(item)}</div>
  {/each}
  {#if episodes.length === 0 && row.tagline}<div class="line tagline">{row.tagline}</div>{/if}
{/if}

<style>
a {
  color: inherit;
}

b {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
}

.line {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tagline {
  color: var(--color-schedule-muted);
}

details {
  white-space: normal;
}

summary {
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '▾';
    display: inline-block;
    margin-inline-start: var(--space-schedule-code);
    color: var(--color-text-muted);
  }

  [open] > &::after {
    transform: rotate(180deg);
  }
}

ol {
  display: grid;
  gap: var(--space-schedule-episodes);
  margin: var(--space-schedule-line) 0 0;
  padding: 0;
  font-size: var(--font-size-small);
  list-style: none;
}
</style>
