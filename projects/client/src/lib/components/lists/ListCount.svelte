<!--
  A list's count as a comment's "N replies": an outlined button where it leads somewhere, the same look where it
  doesn't (inside a card that's already a link). The icon is blue and the number bold. `shown` replaces the number
  as written ("204k"), `plural` a plural that isn't the word plus s, and `iconColor` the blue (plays' purple). The
  rest (a tooltip's attributes) goes on the button.
    <ListCount svg={file} value={330} word="item" href="/lists/7" />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import type { HTMLAttributes } from 'svelte/elements';

interface Props extends HTMLAttributes<HTMLElement> {
  svg: string;
  value: number;
  /** Singular; `plural` (the word plus s) shows for any other count. */
  word: string;
  plural?: string;
  /** The number as written, when not in full. */
  shown?: string;
  iconColor?: string;
  href?: string;
}
const { svg, value, word, plural = `${word}s`, shown, iconColor, href, ...rest }: Props = $props();
</script>

<!-- List hrefs are built from ids, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<svelte:element this={href ? 'a' : 'span'} {href} {...rest} class="count" style:--count-icon={iconColor}
><Icon {svg} /><strong>{shown ?? value.toLocaleString('en-US')}</strong><span class="count-text"
  >{value === 1 ? word : plural}</span></svelte:element>

<style>
.count {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--glass-action-gap-card);
  block-size: var(--control-height);
  padding-inline: var(--glass-action-padding-card);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-family: var(--font-body);
  font-size: var(--font-size-glass-action);
  font-weight: var(--font-weight-glass-action-card);
  white-space: nowrap;
  transition: background-color var(--transition-comment-quiet), border-color var(--transition-comment-quiet);

  & > :global(.icon) {
    color: var(--count-icon, var(--color-stat-count));
  }

  & strong {
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }

  & .count-text {
    margin-inline-start: calc(-1 * var(--glass-action-gap-card) + var(--space-stat-noun));
  }
}

a.count:is(:hover, :focus-visible) {
  border-color: var(--color-control-border-hover);
  background-color: var(--color-control-hover-bg);
  color: var(--color-control-text);
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  .count {
    transition: none;
  }
}
</style>
