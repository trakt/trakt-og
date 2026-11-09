<!--
  The lists preview on a summary: "Popular Lists", then a Type dropdown picking Official (the title's collection
  first), Personal or Mine (the viewer's own lists with it), placed as the comments preview's Filter is, and up to
  three rows of the pick with the lists page's row icons. "All N Lists" follows the pick to the lists page's same type.
  With only one pick there's no dropdown. Sorting is on the lists page.
-->
<script lang="ts">
import { page } from '$app/state';
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import ListEditor from '#lib/components/lists/ListEditor.svelte';
import ListRow from '#lib/components/media/ListRow.svelte';
import { createItemListActions } from '#lib/itemLists/createItemListActions.svelte.ts';
import { itemListsHref } from '#lib/itemLists/itemListQuery.ts';
import type { ListTab } from '#lib/summary/toListTabs.ts';
import { countLabel } from '#lib/utils/countLabel.ts';
import SectionHeading from './SectionHeading.svelte';

interface Props {
  tabs: readonly ListTab[];
  /** The item's list count, for Personal's "All N Lists". */
  count: number;
  /** The item's page; the see-more link goes to its `/lists`. */
  href: string;
}

const { tabs, count, href }: Props = $props();
const viewer = $derived(page.data.user ? { slug: page.data.user.slug } : null);
// Report, progress and share, and the owner's edit and delete, as on the lists page.
const own = createItemListActions({ viewer: () => viewer, origin: () => page.url.origin });
let picked = $state<ListTab['id']>();
const current = $derived(tabs.find(({ id }) => id === picked) ?? tabs.at(0));
const shown = $derived(own.visible(current?.lists ?? []));
// The lists page on the same type, counting the pick's lists; Personal counts the item's.
const more = $derived({
  href: itemListsHref(href, { type: current?.id ?? 'personal', sortBy: 'popularity' }),
  text: `All ${countLabel(current?.total ?? count, 'List')}`,
});
</script>

<div class="summary-lists" {@attach trackDrilldowns({ source: 'popular-lists' })}>
  <SectionHeading title="Popular Lists" more={{ ...more, drilldown: 'popular-lists' }} />
  {#if current && tabs.length > 1}
    <div class="controls">
      <Dropdown section="Type">
        {#snippet trigger()}{current.label}{/snippet}
        <ul>
          {#each tabs as tab (tab.id)}
            <li>
              <button type="button" aria-current={tab.id === current.id} onclick={() => (picked = tab.id)}>{tab.label}</button>
            </li>
          {/each}
        </ul>
      </Dropdown>
    </div>
  {/if}
  {#each shown as list (list.id)}
    <ListRow {...list} mine={list.owner.slug === page.data.user?.slug} likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.owner.slug : undefined, viewer: page.data.user?.slug ?? null }}
      actions={own.actions(list)} />
  {/each}
</div>

{#if own.editor}<ListEditor id={own.editor.id} posters={own.editor.posters} count={own.editor.count}
  onclose={own.closeEditor} />{/if}

<style>
.summary-lists {
  margin-block-end: var(--gutter);
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}
</style>
