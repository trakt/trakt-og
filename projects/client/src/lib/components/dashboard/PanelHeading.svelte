<!--
  A panel's heading row: the h2 with its icon as a faint watermark, and on the right the see-more link.
  DashboardPanel puts one on top; the profile's Most Watched columns each have their own.
-->
<script lang="ts">
import HeadingMark from '#lib/components/heading/HeadingMark.svelte';
import type { Snippet } from 'svelte';
import SeeMore from '#lib/components/see-more/SeeMore.svelte';

interface Props {
  /** The h2's id, for the section's `aria-labelledby`. */
  id: string;
  title: string;
  /** The heading's icon, as raw SVG, drawn as a watermark behind the title. */
  icon?: string;
  /** The pulsing live dot before the title, in place of the icon. */
  live?: boolean;
  /** The flickering flame before the title, in place of the icon. */
  hot?: boolean;
  seeMore?: { href: string; text: string };
  /** OG's `h2.section`, with 28px above it instead of 20px (Recently Watched). */
  section?: boolean;
  /** On the right before the see-more link: a section's counts. */
  aside?: Snippet;
  /** Makes the title a link: the list a list panel shows. */
  titleHref?: string;
  /** After the title: a pinned list's tags. */
  tags?: Snippet;
}

const { id, title, icon, live = false, hot = false, seeMore, section = false, aside, titleHref, tags }: Props = $props();
</script>

<!-- The panel builds the list's href. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class={['heading', { section }]}>
  <h2 {id}>
    <HeadingMark svg={icon} {live} {hot} />{#if titleHref}<a class="title-link" href={titleHref}>{title}</a>{:else}{title}{/if}{#if tags}<span
        class="tags">{@render tags()}</span>{/if}
  </h2>
  <div class="links">
    {@render aside?.()}
    {#if seeMore}
      <SeeMore {...seeMore} />
    {/if}
  </div>
</div>

<style>
/* Centred on the title, with the margins above both alike, so the taller sort and eye line up with it. */
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gutter);
}

h2 {
  position: relative;
  isolation: isolate;
  min-inline-size: 0;
  margin-block-end: 0;
}

.title-link {
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

/* Spaced like a list page's tags beside its title, centred on the title's line rather than its lowercase letters. */
h2:has(> .tags) {
  display: flex;
  align-items: center;
}

.tags {
  display: inline-flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--list-title-pill-gap);
  margin-inline-start: var(--list-title-pill-gap);
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
