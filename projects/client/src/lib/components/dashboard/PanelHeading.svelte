<!--
  A panel's heading row: the h2 with a spinner while loading, and on the right the see-more link.
  DashboardPanel puts one on top; the profile's Most Watched columns each have their own.
-->
<script lang="ts">
import Spinner from '$lib/components/loading/Spinner.svelte';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';

interface Props {
  /** The h2's id, for the section's `aria-labelledby`. */
  id: string;
  title: string;
  loading?: boolean;
  seeMore?: { href: string; text: string };
  /** OG's `h2.section`, with 28px above it instead of 20px (Recently Watched). */
  section?: boolean;
}

const { id, title, loading = false, seeMore, section = false }: Props = $props();
</script>

<div class={['heading', { section }]}>
  <h2 {id}>
    {title}
    {#if loading}<span class="spinner"><Spinner /></span>{/if}
  </h2>
  <div class="links">
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
  margin-block-end: 0;
}

.spinner {
  margin-inline-start: var(--space-heading-icon);
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
