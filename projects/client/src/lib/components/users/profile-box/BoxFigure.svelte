<!-- A profile box's one big number, with its label in two short lines beside it. -->
<script lang="ts">
interface Props {
  value: string;
  label: readonly string[];
}

const { value, label }: Props = $props();
</script>

<p class="figure">
  <b>{value}</b>
  <span>{#each label as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}</span>
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
}
</style>
