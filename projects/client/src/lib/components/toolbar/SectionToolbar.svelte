<!--
  The toolbar under a profile or list subnav, on one line: the filters on the left, then the stats, then the summary
  (sort, view and filter tools) on the right.
    <SectionToolbar>
      {#snippet filters()}<Dropdown>…</Dropdown>{/snippet}
      {#snippet stats()}<SubnavCount … />{/snippet}
      {#snippet summary()}<Dropdown joined>…</Dropdown><SortDirection joined />{/snippet}
    </SectionToolbar>
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import type { Snippet } from 'svelte';

interface Props {
  filters: Snippet;
  stats?: Snippet;
  summary?: Snippet;
  inSummary?: boolean;
}

const { filters, stats, summary, inSummary = false }: Props = $props();
</script>

<section class="section-toolbar" aria-label="Page filters">
  <Container>
    <div class={['toolbar', { 'in-summary': inSummary }]}>
      <div class="filters">{@render filters()}</div>
      {#if stats}<div class="stats">{@render stats()}</div>{/if}
      {#if summary}<div class="summary">{@render summary()}</div>{/if}
    </div>
  </Container>
</section>

<style>
.section-toolbar {
  padding-block: var(--toolbar-padding);
  background: var(--color-toolbar-bg);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--toolbar-gap);
}
.in-summary {
  margin-inline-start: var(--summary-offset);
  @media (width < 992px) {
    margin-inline-start: var(--summary-offset-sm);
  }
  @media (width < 768px) {
    margin-inline-start: 0;
  }
}
.filters,
.stats,
.summary {
  display: flex;
  align-items: center;
  gap: var(--toolbar-gap);
}
/* The filters push the stats and the summary to the right. */
.filters {
  margin-inline-end: auto;
}
.stats {
  gap: var(--space-stats);
}
</style>
