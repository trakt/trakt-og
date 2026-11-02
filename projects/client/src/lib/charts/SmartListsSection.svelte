<!--
  The viewer's smart lists for this chart's type, where classic Trakt had Saved Filters: each a link with its name,
  a lock unless it's public, and its source as a tag, tinted purple when the list opens on this very chart. One a
  chart can show opens there with its filters on; any other opens as a list. The open one is marked current. The gear
  goes to the viewer's smart lists.
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import gear from '$lib/icons/regular/gear.svg?raw';
import lock from '$lib/icons/regular/lock.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';
import type { SmartList } from '$lib/lists/smart/SmartList';
import { smartListSourceLabel } from '$lib/lists/smart/smartListSourceLabel';

interface Props {
  lists: readonly (SmartList & { href: string })[];
  /** The slug of the smart list this chart was opened from. */
  current?: string;
  /** This chart's path: the lists that open on it tint their chart tag in the smart list purple. */
  chartPath: string;
  manageHref: string;
  open: boolean;
}

const { lists, current, chartPath, manageHref, open }: Props = $props();
</script>

<!-- The hrefs come built: a chart with its query, or a list page. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="smart" title="Smart Lists" {open} remember>
  {#snippet action()}
    <Tooltip text="Manage smart lists">
      {#snippet trigger(tooltip)}
        <a class="manage" href={manageHref} aria-label="Manage smart lists" {...tooltip}><Icon svg={gear} /></a>
      {/snippet}
    </Tooltip>
  {/snippet}
  <ul>
    {#each lists as list (list.slug)}
      <li>
        <a href={list.href} aria-current={list.slug === current ? 'page' : undefined}>
          <Icon svg={sparkles} />
          <span class="name">{list.name}</span>
          {#if list.privacy !== 'public'}<Icon svg={lock} label={list.privacy === 'friends' ? 'Following only' : 'Private'} />{/if}
          <span class="source"><TagPills tags={[{
            text: smartListSourceLabel(list.source),
            ...(list.href.startsWith(`${chartPath}?`) && { tint: 'var(--color-list-chip-smart)' }),
          }]} /></span>
        </a>
      </li>
    {/each}
  </ul>
</SidebarSection>

<style>
ul {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

li > a {
  display: flex;
  align-items: center;
  gap: var(--space-base-block);
  padding: var(--space-xs-inline) var(--space-base-block);
  margin-inline: calc(-1 * var(--space-base-block));
  border-radius: var(--radius-control);
  color: var(--color-frame-ink);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  text-decoration: none;

  & :global(.icon) {
    flex: none;
    color: var(--color-sidebar-label);
    font-size: var(--font-size-small);
  }

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
  }

  &[aria-current='page'] {
    background-color: var(--color-sidebar-pill-set-bg);
    color: var(--color-sidebar-pill-set-text);

    & :global(.icon) {
      color: inherit;
    }
  }
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source {
  flex: none;
  margin-inline-start: auto;
}

/* Applied Filters' Clear: an outline on the raised control fill, its icon muted. */
.manage {
  display: inline-grid;
  place-items: center;
  inline-size: var(--control-height-mini);
  block-size: var(--control-height-mini);
  border-radius: var(--radius-comment-tool);
  color: var(--color-control-muted);
  font-size: var(--font-size-small);
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-comment-chip);
    color: var(--color-control-text);
  }
}
</style>
