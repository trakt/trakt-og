<!--
  A panel's heading row: the h2 with its icon as a faint watermark, and on the right the see-more link.
  DashboardPanel puts one on top; the profile's Most Watched columns each have their own.
-->
<script lang="ts">
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import type { Snippet } from 'svelte';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';

interface Props {
  /** The h2's id, for the section's `aria-labelledby`. */
  id: string;
  title: string;
  /** The heading's icon, as raw SVG, drawn as a watermark behind the title. */
  icon: string;
  seeMore?: { href: string; text: string };
  /** OG's `h2.section`, with 28px above it instead of 20px (Recently Watched). */
  section?: boolean;
  /** On the right before the see-more link: a section's counts. */
  aside?: Snippet;
}

const { id, title, icon, seeMore, section = false, aside }: Props = $props();
</script>

<div class={['heading', { section }]}>
  <h2 {id}>
    <HeadingMark svg={icon} />{title}
  </h2>
  <div class="links">
    {@render aside?.()}
    {#if seeMore}
      <SeeMore {...seeMore} />
    {/if}
  </div>
</div>

<style>
.heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--gutter);
}

h2 {
  position: relative;
  isolation: isolate;
  margin-block-end: 0;
}

.links {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-block-start: var(--line-height-computed);
}

/* OG floated the links inside the h2, so they move down with it. */
.section :is(h2, .links) {
  margin-block-start: var(--space-heading-section);
}
</style>
