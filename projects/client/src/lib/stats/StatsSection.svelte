<!--
  One section of a title's stats page: its h2 with the icon as a faint watermark behind it, like the dashboard's panel
  headings, then the section. The id is the sidebar's anchor. With `hideHeading` the heading is only for screen
  readers, for a section the page opens with.
    <StatsSection id="community" title="Community" icon={userGroup}>...</StatsSection>
-->
<script lang="ts">
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import type { Snippet } from 'svelte';

interface Props {
  id: string;
  title: string;
  /** Raw SVG, drawn as the watermark. */
  icon: string;
  hideHeading?: boolean;
  children: Snippet;
}

const { id, title, icon, hideHeading = false, children }: Props = $props();
</script>

<section {id} aria-labelledby="{id}-heading">
  {#if hideHeading}
    <h2 id="{id}-heading" class="visually-hidden">{title}</h2>
    {@render children()}
  {:else}
    <h2 id="{id}-heading"><HeadingMark svg={icon} />{title}</h2>
    <div class="body">{@render children()}</div>
  {/if}
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

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
