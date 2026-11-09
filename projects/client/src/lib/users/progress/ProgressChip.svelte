<!--
  The pill on a progress row's line of actions, a link in the row's own type size and height. `watched` is the last
  watched chip, in the watched tag's wash, outline and text; `neutral` is the plain control look Seasons has, for
  anything else a row links to, like a franchise's up next movie.
    <ProgressChip href="/movies/tron" tone="watched"><Icon svg={history} />Last watched <b>Tron</b></ProgressChip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  href: string;
  tone?: 'watched' | 'neutral';
  children: Snippet;
}

const { href, tone = 'watched', children }: Props = $props();
</script>

<!-- The rows' links are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a class={['chip', tone]} {href}>{@render children()}</a>

<style>
.chip {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--progress-inline-gap);
  min-inline-size: 0;
  max-inline-size: 100%;
  block-size: var(--progress-action-height);
  padding: var(--progress-action-padding);
  overflow: hidden;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
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
}

.watched {
  --tone: var(--color-comment-chip-watched);
  border-color: color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));

  &:is(:hover, :focus-visible) {
    border-color: var(--tone);

    & :global(b) {
      text-decoration: underline;
    }
  }
}

.neutral {
  color: var(--color-control-text);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background: var(--color-control-hover-bg);

    & :global(b) {
      text-decoration: underline;
    }
  }
}
</style>
