<!--
  One section of a title's stats page: its h2 with the icon as a faint watermark behind it, like the dashboard's panel
  headings, then the section. The id is the sidebar's anchor.
    <StatsSection id="community" title="Community" icon={userGroup}>...</StatsSection>
-->
<script lang="ts">
import HeadingMark from '#lib/components/heading/HeadingMark.svelte';
import type { Snippet } from 'svelte';

interface Props {
  id: string;
  title: string;
  /** Raw SVG, drawn as the watermark. */
  icon: string;
  children: Snippet;
}

const { id, title, icon, children }: Props = $props();
</script>

<section {id} aria-labelledby="{id}-heading">
  <h2 id="{id}-heading"><HeadingMark svg={icon} />{title}</h2>
  <div class="body">{@render children()}</div>
</section>

<style>
section:not(:first-child) {
  margin-block-start: var(--space-stats-section);
}

h2 {
  position: relative;
  isolation: isolate;
  margin-block: 0;
}

.body {
  margin-block-start: var(--space-stats-body);
}
</style>
