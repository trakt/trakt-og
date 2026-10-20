<!--
  A summary section's h2 with a bold count ("3 Seasons", "24 Episodes") and, on the right, OG's sort dropdown plus the
  direction toggle, its arrow the way the picked sort runs (`desc`). Picking a sort puts it back in its own direction.
  `by` and `flipped` are bindable.
-->
<script lang="ts" generics="By extends string">
import type { Snippet } from 'svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';

interface Props {
  id: string;
  count: number;
  /** The singular noun after the count; the heading adds the "s". */
  noun: string;
  sorts: readonly { readonly by: By; readonly name: string; readonly desc: boolean }[];
  by: By;
  flipped: boolean;
  controls?: Snippet;
  loading?: boolean;
}

let { id, count, noun, sorts, by = $bindable(), flipped = $bindable(), controls, loading = false }: Props = $props();
const picked = $derived(sorts.find((sort) => sort.by === by));
</script>

<div class="heading" aria-busy={loading}>
  <h2 {id}><strong>{count.toLocaleString('en-US')}</strong> {count === 1 ? noun : `${noun}s`}</h2>
  <div class="sort">
    <span class="loading" role="status">{loading ? 'Loading stats…' : ''}</span>
    <span class="pair">
      <Dropdown joined section="Sort">
        {#snippet trigger()}{picked?.name}{/snippet}
        <ul>
          {#each sorts as sort (sort.by)}
            <li>
              <button type="button" aria-current={sort.by === by} onclick={() => {
                by = sort.by;
                flipped = false;
              }}>{sort.name}</button>
            </li>
          {/each}
        </ul>
      </Dropdown>
      <SortDirection joined bind:flipped descending={picked?.desc} />
    </span>
    {@render controls?.()}
  </div>
</div>

<style>
.loading {
  font-size: var(--font-size-small);
  color: var(--color-summary-label);
}
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-start: var(--gutter);

  & h2 {
    margin: 0;
  }

  & strong {
    font-weight: var(--font-weight-headings);
  }
}

.sort {
  display: flex;
  align-items: center;
  gap: var(--space-dropdown-row);
}

.pair {
  display: flex;
  align-items: center;
}
</style>
