<!--
  The flush fanart grid inside a Frame: the first two cards are wide, two
  a row, then three a row, four on the widest screens, each with OG's 1px separators on the right and bottom.
  OG switched columns at the 768, 992 and 1600px viewport breakpoints. Minus the 300px sidebar, that's a frame of
  468, 692 and 1300px, so the container queries use those.
  `framed` is the charts' grid of framed cards, with the page's gutter between and around them instead of separators:
  one a row, then two, three and four, each wide enough for its full quick-icon bar.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

type Variant = 'fanart' | 'framed';

const { children, variant = 'fanart' }: { children: Snippet; variant?: Variant } = $props();
</script>

<div class="frame-grid-frame" data-sveltekit-preload-data="tap">
  <div class={['frame-grid', variant]}>
    {@render children()}
  </div>
</div>

<style>
.frame-grid-frame {
  container-type: inline-size;
}

.frame-grid {
  --span: 12;
  --span-wide: 12;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));

  & > :global(*) {
    grid-column: span var(--span);
    border-block-end: 1px solid var(--color-frame-line);
    border-inline-end: 1px solid var(--color-frame-line);
  }

  & > :global(:nth-child(-n + 2)) {
    grid-column: span var(--span-wide);
  }
}

@container (width >= 468px) {
  .frame-grid {
    --span: 6;
    --span-wide: 6;
  }
}

@container (width >= 692px) {
  .frame-grid {
    --span: 4;
  }
}

@container (width >= 1300px) {
  .frame-grid {
    --span: 3;
  }
}

.frame-grid.framed {
  --span: 12;
  --span-wide: var(--span);
  gap: var(--gutter);
  padding: var(--gutter);

  & > :global(*) {
    border: 0;
  }
}

@container (width >= 560px) {
  .frame-grid.framed {
    --span: 6;
  }
}

@container (width >= 860px) {
  .frame-grid.framed {
    --span: 4;
  }
}

@container (width >= 1300px) {
  .frame-grid.framed {
    --span: 3;
  }
}
</style>
