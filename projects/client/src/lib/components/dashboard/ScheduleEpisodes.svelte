<!--
  What a schedule row airs: one or two episodes by number and title ("13x07 Title + 13x08 Title" when `inline`, one a
  line otherwise), three or more as "1x01–1x08 · 8 episodes" that opens to the list, or a movie's tagline. `after`
  follows on the same line, inside the summary for a binge so it stays put when the list opens.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { ScheduleRow } from '$lib/dashboard/toScheduleLayout';

interface Props {
  row: ScheduleRow;
  inline?: boolean;
  after?: Snippet;
}

const { row, inline = false, after }: Props = $props();
const { episodes } = $derived(row);
</script>

<!-- Episode pages are linked by slug paths built in the mapper. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet episode({ number, title, href }: ScheduleRow['episodes'][number])}
  <a {href}><b>{number}</b>{title ? ` ${title}` : ''}</a>
{/snippet}

{#if episodes.length > 2}
  <details>
  <summary><b>{episodes.at(0)?.number}–{episodes.at(-1)?.number}</b> {episodes.length} episodes{@render after?.()}</summary>
  <ol>
      {#each episodes as item (item.href)}
        <li>{@render episode(item)}</li>
      {/each}
    </ol>
</details>
{:else if inline}
  <span class="line">
    {#each episodes as item, i (item.href)}{i > 0 ? ' + ' : ''}{@render episode(item)}{/each}{#if episodes.length === 0 && row.tagline}<span class="tagline">{row.tagline}</span>{/if}{@render after?.()}
  </span>
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
  margin-inline-end: var(--space-schedule-code);
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
