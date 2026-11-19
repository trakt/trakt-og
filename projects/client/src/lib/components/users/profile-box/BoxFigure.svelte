<!--
  A profile box's one big number in the dashboard panels' condensed figures, then a plain space and its label on the
  same line ("11 episodes in one day"), wrapping only when it runs out of room. An icon leads the label.
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';

interface Props {
  value: string;
  label: string;
  /** A raw icon SVG, from `#lib/icons`. */
  icon?: string;
}

const { value, label, icon }: Props = $props();
</script>

<p class="figure"><b>{value}</b> {#if icon}<span class="glyph"><Icon svg={icon} /></span>{/if}{label}</p>

<style>
.figure {
  margin: var(--profile-box-figure-gap) 0 0;
  color: var(--color-profile-ink-soft);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-figure-label);
  font-weight: var(--font-weight-headings);
  line-height: 1.2;

  b {
    color: var(--color-card-text);
    font-family: var(--font-profile-figure);
    font-size: var(--font-size-profile-figure);
    font-weight: var(--font-weight-profile-figure);
    font-variant-numeric: tabular-nums;
    line-height: 0.85;
    margin-inline-start: var(--profile-box-figure-nudge);
  }

  .glyph {
    margin-inline-end: 4px;
  }
}
</style>
