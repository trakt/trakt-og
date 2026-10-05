<!-- A profile box's one big number, with its label in two short lines beside it, and an icon before the label. -->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';

interface Props {
  value: string;
  label: readonly string[];
  /** A raw icon SVG, from `$lib/icons`. */
  icon?: string;
}

const { value, label, icon }: Props = $props();
</script>

<p class="figure">
  <b>{value}</b>
  <span>{#if icon}<span class="glyph"><Icon svg={icon} /></span>{/if}{#each label as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}</span>
</p>

<style>
.figure {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 2px 0 0;

  b {
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-figure);
    font-weight: var(--font-weight-profile-figure);
    font-variant-numeric: tabular-nums;
    letter-spacing: var(--letter-spacing-profile-figure);
    line-height: 1;
  }

  span {
    color: var(--color-profile-ink-soft);
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-figure-label);
    font-weight: var(--font-weight-headings);
    line-height: 1.2;
  }

  .glyph {
    margin-inline-end: 4px;
  }
}
</style>
