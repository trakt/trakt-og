<!--
  OG's lists preview on a summary: "Lists" with "All N Lists", then a dropdown picking Popular or Me and its list rows.
  Picks without lists are left out by the caller. `cut:` "Following" (no API filter).
-->
<script lang="ts">
import { page } from '$app/state';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import ListRow from '$lib/components/media/ListRow.svelte';
import type { ListTab } from '$lib/summary/sectionsClient';
import { countLabel } from '$lib/utils/countLabel';
import SectionHeading from './SectionHeading.svelte';

interface Props {
  tabs: readonly ListTab[];
  /** The item's list count, for "All N Lists". */
  count: number;
  /** The item's page; the see-more link goes to its `/lists`. */
  href: string;
}

const { tabs, count, href }: Props = $props();
let picked = $state<string>();
const current = $derived(tabs.find(({ id }) => id === picked) ?? tabs[0]);
</script>

<div class="summary-lists">
  <SectionHeading title="Lists" more={{ href: `${href}/lists`, text: `All ${countLabel(count, 'List')}` }} />
  {#if current}
    <div class="controls">
      <Dropdown section="Filter">
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
  {#each current?.lists ?? [] as list (list.id)}
    <ListRow {...list} likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.owner.slug : undefined, viewer: page.data.user?.slug ?? null }} />
  {/each}
</div>

<style>
.summary-lists {
  margin-block-end: var(--gutter);
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}
</style>
