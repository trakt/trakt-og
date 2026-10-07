<!--
  A row of toggle buttons in the dropdown trigger's look (og's control border, background and radius), the picked
  one filled with the season's accent. An optional count sits in each as a small badge. Discover's moods, their Movies/Shows switch
  and the premiere filters use it.
    <ToggleChips label="Moods" options={[{ id: 'short', label: 'Under 95 Minutes' }]} bind:selected />
-->
<script lang="ts">
interface Props {
  /** Names the group for screen readers. */
  label: string;
  options: readonly { id: string; label: string; count?: number }[];
  selected: string;
}

let { label, options, selected = $bindable() }: Props = $props();
</script>

<div class="chips" role="group" aria-label={label}>
  {#each options as option (option.id)}
    <button type="button" aria-pressed={option.id === selected} onclick={() => (selected = option.id)}>
      {option.label}{#if option.count !== undefined}<span class="count">{option.count}</span>{/if}
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
    border-color: var(--season-accent);
    background-color: var(--season-accent);
    color: var(--color-discover-on-image);
  }
}

.count {
  padding: var(--toggle-chip-count-padding);
  border-radius: var(--radius-toggle-chip-count);
  background-color: var(--color-toggle-chip-count-bg);
  font-size: var(--font-size-toggle-chip-count);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;

  [aria-pressed='true'] & {
    background-color: var(--color-toggle-chip-count-picked-bg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  button {
    transition: background-color var(--transition-season-ribbon), border-color var(--transition-season-ribbon);
  }
}
</style>
