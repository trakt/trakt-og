<!--
  OG's Saved Filters, kept in this browser, in the smart lists section's look: each a link with its name and the page
  it opens as a tag, tinted the smart list purple when it opens on this very page, as a smart list's is on its chart. The open one is
  marked current; Applied Filters deletes it, as it does an open smart list.
    <SavedFiltersSection filters={[{ name: 'Anime', href: '/calendars/premieres?genres=anime', tag: 'Premieres' }]}
      open />
-->
<script lang="ts">
import TagPills from '#lib/components/labels/TagPills.svelte';
import SidebarSection from '#lib/components/sidebar/SidebarSection.svelte';
import Icon from '#lib/icons/Icon.svelte';
import thumbtack from '#lib/icons/solid/thumbtack.svg?raw';

interface Props {
  /** `here`: the filter opens on this page. */
  filters: readonly { name: string; href: string; tag?: string; here?: boolean; current?: boolean }[];
  open: boolean;
}

const { filters, open }: Props = $props();
</script>

<!-- The hrefs come built: a page with its filters. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarSection id="saved" title="Saved Filters" {open} remember>
  <ul>
    {#each filters as filter (filter.name)}
      <li>
        <a href={filter.href} aria-current={filter.current ? 'page' : undefined}>
          <Icon svg={thumbtack} />
          <span class="name">{filter.name}</span>
          {#if filter.tag}<span class="tag"><TagPills tags={[{
            text: filter.tag,
            ...(filter.here && { tint: 'var(--color-list-chip-smart)' }),
          }]} /></span>{/if}
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

/* A grid item would size to a long name; this lets the name end in an ellipsis instead. */
li {
  min-inline-size: 0;
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

.tag {
  flex: none;
  margin-inline-start: auto;
}
</style>
