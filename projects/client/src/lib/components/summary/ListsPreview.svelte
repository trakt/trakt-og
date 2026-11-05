<!--
  The lists preview on a summary: "Popular Lists" with "All N Lists", then the official and most popular lists' rows,
  with the lists page's row icons. Sorting and the viewer's own lists are on the lists page.
-->
<script lang="ts">
import { page } from '$app/state';
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import ListEditor from '#lib/components/lists/ListEditor.svelte';
import ListRow from '#lib/components/media/ListRow.svelte';
import { createItemListActions } from '#lib/itemLists/createItemListActions.svelte.ts';
import type { SummaryList } from '#lib/summary/toSummaryList.ts';
import { countLabel } from '#lib/utils/countLabel.ts';
import SectionHeading from './SectionHeading.svelte';

interface Props {
  lists: readonly SummaryList[];
  /** The item's list count, for "All N Lists". */
  count: number;
  /** The item's page; the see-more link goes to its `/lists`. */
  href: string;
}

const { lists, count, href }: Props = $props();
const viewer = $derived(page.data.user ? { slug: page.data.user.slug } : null);
// Report, progress and share, and the owner's edit and delete, as on the lists page.
const own = createItemListActions({ viewer: () => viewer, origin: () => page.url.origin });
const shown = $derived(own.visible(lists));
</script>

<div class="summary-lists" {@attach trackDrilldowns({ source: 'popular-lists' })}>
  <SectionHeading title="Popular Lists"
    more={{ href: `${href}/lists`, text: `All ${countLabel(count, 'List')}`, drilldown: 'popular-lists' }} />
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
</style>
