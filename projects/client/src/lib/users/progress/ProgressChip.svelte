<!--
  The pill on a progress row's line of actions, a link in the row's own type size and height, in the watched tag's
  wash, outline and text: the last episode or movie you watched.
    <ProgressChip href="/movies/tron"><Icon svg={history} />Last watched <b>Tron</b></ProgressChip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  href: string;
  children: Snippet;
}

const { href, children }: Props = $props();
</script>

<!-- The rows' links are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a class="chip" {href}>{@render children()}</a>

<style>
.chip {
  --tone: var(--color-comment-chip-watched);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  min-inline-size: 0;
  max-inline-size: 100%;
  block-size: var(--progress-action-height);
  padding: var(--progress-action-padding);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-control);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font: var(--font-size-progress-row) / var(--line-height-progress-row) var(--font-body);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-progress-last-icon);
  }

  & :global(b) {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--tone);

    & :global(b) {
      text-decoration: underline;
    }
  }
}
</style>
