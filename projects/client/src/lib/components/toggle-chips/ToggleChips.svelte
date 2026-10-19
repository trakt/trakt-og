<!--
  A row of toggle buttons in the dropdown trigger's look (og's control border, background and radius), the picked
  one washed red like PillTabs. An optional count sits in each as a small badge. Discover's moods, their Movies/Shows
  switch and the premiere filters use it, filled with the season's accent (`--toggle-chip-on-bg`, `-border`, `-text`
  and `--toggle-chip-count-on-bg` set on its page), and the related band's threads, where a `swatch` before the label
  keys each chip to its color in the fingerprints.
    <ToggleChips label="Moods" options={[{ id: 'short', label: 'Under 95 Minutes' }]} bind:selected />
-->
<script lang="ts">
interface Props {
  /** Names the group for screen readers. */
  label: string;
  /** `swatch` is a CSS color for a small square before the label. */
  options: readonly { id: string; label: string; count?: number; swatch?: string }[];
  selected: string;
}

let { label, options, selected = $bindable() }: Props = $props();
</script>

<div class="chips" role="group" aria-label={label}>
  {#each options as option (option.id)}
    <button type="button" aria-pressed={option.id === selected} onclick={() => (selected = option.id)}>
      {#if option.swatch}<span class="swatch" style:background-color={option.swatch}></span>{/if}{option.label}{#if
        option.count !== undefined
      }<span class="count">{option.count}</span>{/if}
    </button>
  {/each}
</div>

<style>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--toggle-chip-gap);
}

button {
  display: inline-flex;
  align-items: center;
  gap: var(--toggle-chip-count-gap);
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }

  &[aria-pressed='true'] {
    border-color: var(--toggle-chip-on-border, var(--color-tab-picked-border));
    background-color: var(--toggle-chip-on-bg, var(--color-tab-picked-bg));
    color: var(--toggle-chip-on-text, var(--color-tab-picked-text));
  }
}

.swatch {
  inline-size: var(--toggle-chip-swatch-size);
  block-size: var(--toggle-chip-swatch-size);
  border-radius: var(--radius-toggle-chip-swatch);
}

.count {
  padding: var(--toggle-chip-count-padding);
  border-radius: var(--radius-toggle-chip-count);
  background-color: var(--color-toggle-chip-count-bg);
  font-size: var(--font-size-toggle-chip-count);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;

  [aria-pressed='true'] & {
    background-color: var(--toggle-chip-count-on-bg, var(--brand-primary));
    color: var(--toggle-chip-count-on-text, var(--color-text-inverse));
  }
}

@media (prefers-reduced-motion: no-preference) {
  button {
    transition: background-color var(--transition-season-ribbon), border-color var(--transition-season-ribbon);
  }
}
</style>
