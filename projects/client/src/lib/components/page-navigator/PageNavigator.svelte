<!--
  OG's less and more pill under a panel, in Read more's pill: a segment each, with its plus or minus. It hangs
  over the panel's bottom edge, centered, so put it last in a `position: relative` panel. `dark` is OG's
  `.page-navigator.dark` for a panel that's dark in both themes, and `--page-navigator-offset` moves it down from the
  content. With `edge` it's centered on the bottom edge of that panel instead, half on each side. "less" hides at one row and
  "more" at the last, and the pill hides when there's only one row to show.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import circleMinus from '$lib/icons/solid/circle-minus.svg?raw';
import circlePlus from '$lib/icons/solid/circle-plus.svg?raw';

interface Props {
  rows: number;
  maxRows: number;
  onchange: (rows: number) => void;
  /** What the rows belong to, for screen readers: "Up Next". */
  label: string;
  /** The dark glass with white text, on a dark panel in either theme. */
  dark?: boolean;
  /** Centered on the panel's bottom edge rather than under its content. */
  edge?: boolean;
}

const { rows, maxRows, onchange, label, dark = false, edge = false }: Props = $props();
</script>

{#snippet control(kind: 'less' | 'more', svg: string, next: number)}
  <button type="button" class="control" aria-label="Show {kind} {label}" onclick={() => onchange(next)}>
    <Icon {svg} />{kind}
  </button>
{/snippet}

{#if maxRows > 1}
  <div class={['page-navigator', { dark, edge }]}>
    {#if rows > 1}
      {@render control('less', circleMinus, rows - 1)}
    {/if}
    {#if rows < maxRows}
      {@render control('more', circlePlus, rows + 1)}
    {/if}
  </div>
{/if}

<style>
.page-navigator {
  position: absolute;
  inset-inline-start: 50%;
  z-index: 1;
  display: inline-flex;
  overflow: hidden;
  margin-block-start: var(--page-navigator-offset, -2px);
  border: 1px solid var(--color-page-navigator-border);
  border-radius: var(--radius-page-navigator);
  background-color: var(--color-page-navigator-bg);
  color: var(--color-page-navigator-text);
  translate: -50% 0;
  white-space: nowrap;

  &.edge {
    inset-block-end: 0;
    margin-block-start: 0;
    translate: -50% 50%;
  }

  &.dark {
    --color-page-navigator-border: var(--color-page-navigator-dark-border);
    --color-page-navigator-icon: var(--color-page-navigator-dark-icon);
    --color-page-navigator-hover-bg: var(--color-page-navigator-dark-hover-bg);
    background-color: var(--color-page-navigator-dark-bg);
    color: var(--color-page-navigator-dark-text);
  }
}

.control {
  display: inline-flex;
  align-items: center;
  gap: var(--page-navigator-gap);
  min-block-size: var(--page-navigator-height);
  margin: 0;
  padding: var(--page-navigator-padding);
  border: 0;
  background: none;
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-page-navigator);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  text-decoration: none;
  text-transform: capitalize;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet);

  & + & {
    border-inline-start: 1px solid var(--color-page-navigator-border);
  }

  &:is(:hover, :focus-visible) {
    background-color: var(--color-page-navigator-hover-bg);
    color: inherit;
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: -2px;
  }

  & :global(.icon) {
    color: var(--color-page-navigator-icon);
    font-size: var(--font-size-page-navigator-icon);
  }
}

@media (prefers-reduced-motion: reduce) {
  .control {
    transition: none;
  }
}
</style>
