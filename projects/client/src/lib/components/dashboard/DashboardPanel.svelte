<!--
  One dashboard panel: an h2 with its icon watermark, the see-more link and the Customize gear on the right, a gray help line, then the content.
  Set `--panel-bg` for the panel's background, and `--panel-padding-end` or `--panel-min-height` where OG's section
  had its own. The footer snippet goes after the content, outside the page column,
  which is where the less and more pill hangs.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Container from '#lib/components/container/Container.svelte';
import PanelHeading from './PanelHeading.svelte';
import PanelHelp from './PanelHelp.svelte';
import { trackSectionDrilldown } from '#lib/analytics/trackSectionDrilldown.ts';

interface Props {
  title: string;
  /** The heading's icon, as raw SVG. */
  icon?: string;
  /** The pulsing live dot before the heading, in place of the icon (Watching Now). */
  live?: boolean;
  /** The flickering flame before the heading, in place of the icon (Hot in Your Network). */
  hot?: boolean;
  /** Marks the panel busy for screen readers while its content shows shimmers. */
  loading?: boolean;
  seeMore?: { href: string; text: string };
  /** trakt-web's section-title drilldown, sent when the see-more link is clicked. */
  drilldown?: Parameters<typeof trackSectionDrilldown>[0];
  help?: Snippet;
  /** OG's `h2.section` heading (PanelHeading). */
  section?: boolean;
  /** On the heading's right: the panel's counts. */
  aside?: Snippet;
  /** Makes the title a link to what the panel shows. */
  titleHref?: string;
  /** After the title: a pinned list's tags. */
  tags?: Snippet;
  /** May switch to the page's surface color when the panel above shares its background (`separatePanels`). */
  alternate?: boolean;
  children: Snippet;
  footer?: Snippet;
}

const {
  title,
  icon,
  live,
  hot,
  loading = false,
  seeMore,
  drilldown,
  help,
  section,
  aside,
  titleHref,
  tags,
  alternate = false,
  children,
  footer,
}: Props = $props();
const id = $props.id();
</script>

<section
  class="dashboard-panel"
  aria-labelledby={id}
  aria-busy={loading}
  data-alternate={alternate || undefined}
  {@attach seeMore && drilldown && trackSectionDrilldown(drilldown, seeMore.href)}
>
  <Container>
    <PanelHeading {id} {title} {icon} {live} {hot} {seeMore} {section} {aside} {titleHref} {tags} />
    {#if help}
      <PanelHelp>{@render help()}</PanelHelp>
    {/if}
    {@render children()}
  </Container>
  {@render footer?.()}
</section>

<style>
.dashboard-panel {
  position: relative;
  min-block-size: var(--panel-min-height, auto);
  padding-block-end: var(--panel-padding-end, var(--space-lg-block));
  background-color: var(--panel-bg, var(--color-surface));

  /* Set by `separatePanels` when the panel above has the same background. */
  &:global([data-contrast='alternate']) {
    background-color: var(--color-surface);
  }

  &:global([data-contrast='rule']) {
    border-block-start: 1px solid var(--color-panel-rule);
  }
}
</style>
