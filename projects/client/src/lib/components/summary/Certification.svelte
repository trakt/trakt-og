<!--
  A title's certification after its year ("PG-13", "TV-MA"): OG's small box at OG's size, in the frosted glass of the
  ratings strip's buttons (All Stats), filling white on hover, with a tooltip saying what the rating means. For
  summaries, episodes and their subpages.
    <Certification certification="TV-MA" />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { certificationTip } from './certificationTip.ts';

const { certification }: { certification: string } = $props();
</script>

<Tooltip text={certificationTip(certification)}>
  {#snippet trigger(tooltip)}
    <span class="certification" {...tooltip}>{certification}</span>
  {/snippet}
</Tooltip>

<style>
.certification {
  display: inline-block;
  margin-inline-start: var(--space-certification);
  padding: var(--space-certification-padding);
  border: 1px solid var(--color-certification-line);
  border-radius: var(--radius-control);
  background-color: var(--color-certification-bg);
  backdrop-filter: var(--blur-header-glass);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-certification);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
  vertical-align: middle;
  text-shadow: none;
  cursor: default;
  transition: background-color var(--transition-card), color var(--transition-card), border-color
    var(--transition-card);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-certification-hover-bg);
    background-color: var(--color-certification-hover-bg);
    color: var(--color-certification-hover-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .certification {
    transition: none;
  }
}
</style>
