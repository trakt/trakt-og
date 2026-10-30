<!--
  OG's `.posters` / `.fanarts` row: equal columns with a 20px gutter. Six poster cards a row at desktop width, five on
  show pages, three or four fanart cards. Narrow containers drop to four columns, then two, like OG's col-sm and col-xs.
  `narrowColumns` adds a step between them, for a container under 720px but at least 480px: a summary page's main
  column on a small tablet, where two posters a row are too big.
    <PosterGrid columns={5} narrowColumns={3}>…</PosterGrid>
  `oneRow` keeps a tablet to the first row: a shelf that would leave a few cards alone on a second row (a person's Known
  For) hides the cards past the columns it shows.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** Columns at desktop width. */
  columns?: number;
  /** Columns below OG's sm width: two, or one for fanart cards that were `col-xs-12` there. */
  phoneColumns?: number;
  /** Columns in a container from 480px to under 720px. The same as `phoneColumns` unless set. */
  narrowColumns?: number;
  /** Below desktop width, only the first row shows. */
  oneRow?: boolean;
  children: Snippet;
}

const { columns = 6, phoneColumns = 2, narrowColumns = phoneColumns, oneRow = false, children }: Props = $props();
</script>

<div class="poster-grid-frame" data-sveltekit-preload-data="tap">
  <div class="poster-grid" style:--columns={columns} style:--phone-columns={phoneColumns}
    style:--narrow-columns={narrowColumns} data-tablet-row={oneRow ? Math.min(columns, 4) : undefined}
    data-narrow-row={oneRow ? Math.min(columns, narrowColumns) : undefined}>
    {@render children()}
  </div>
</div>

<style>
.poster-grid-frame {
  container-type: inline-size;
  margin-block-end: var(--gutter);
}

.poster-grid {
  --visible: var(--columns);
  display: grid;
  grid-template-columns: repeat(var(--visible), minmax(0, 1fr));
  gap: var(--gutter);
  /* OG gave every card a 20px top margin, which also leaves room for rank pills and badges above the first row. */
  padding-block-start: var(--gutter);
}

/* col-sm-3 below OG's md container, col-xs-6 below sm. */
@container (width < 940px) {
  .poster-grid {
    --visible: min(var(--columns), 4);
  }

  /* `oneRow`: nth-child can't read --visible, so each row length gets its own rule. */
  [data-tablet-row='2'] > :global(:nth-child(n + 3)),
  [data-tablet-row='3'] > :global(:nth-child(n + 4)),
  [data-tablet-row='4'] > :global(:nth-child(n + 5)) {
    display: none;
  }
}

@container (width < 720px) {
  .poster-grid {
    --visible: min(var(--columns), var(--narrow-columns));
  }

  [data-narrow-row='2'] > :global(:nth-child(n + 3)),
  [data-narrow-row='3'] > :global(:nth-child(n + 4)),
  [data-narrow-row='4'] > :global(:nth-child(n + 5)) {
    display: none;
  }
}

@container (width < 480px) {
  .poster-grid {
    --visible: min(var(--columns), var(--phone-columns));
  }
}
</style>
