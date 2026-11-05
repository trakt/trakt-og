<!--
  A summary section's heading : "Comments" with "All 12 Comments",
  "Lists" with "All 3 Lists". `ruled` puts it over the history's divider line instead of a top margin, for headings
  that split one list into groups (the cast & crew search).
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import SeeMore from '#lib/components/see-more/SeeMore.svelte';
import { trackSectionDrilldown } from '#lib/analytics/trackSectionDrilldown.ts';

interface Props {
  title: string;
  id?: string;
  /** `drilldown` is trakt-web's id for the section, sent when the link is followed. */
  more?: { readonly href: string; readonly text: string; readonly drilldown?: string };
  /** Links before the see-more one, like the comments' "Add comment". */
  actions?: Snippet;
  ruled?: boolean;
}

const { title, id, more, actions, ruled = false }: Props = $props();
</script>

<div class={['heading', { ruled }]}>
  <h2 {id}>{title}</h2>
  {#if actions}<span class="actions">{@render actions()}</span>{/if}
  {#if more}<span class="more" {@attach more.drilldown ? trackSectionDrilldown({ source: more.drilldown }) : undefined}><SeeMore href={more.href} text={more.text} /></span>{/if}
</div>

<style>
.heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-block-start: var(--gutter);

  & h2 {
    margin: 0;
  }

  &.ruled {
    margin-block-start: 0;
    padding-block-end: var(--space-heading-rule);
    border-block-end: 1px solid var(--color-separator);
  }
}

.actions {
  margin-inline-start: auto;
}

/* The link's tall line hangs below the title without making the row taller, so what's under it spaces from the h2. */
.more {
  margin-block-end: -1lh;
}
</style>
