<!--
  The video type dropdown of the summary's videos row and the videos page: All, then each type with its count.
    <VideoTypeDropdown {tabs} {current} onpick={(id) => (picked = id)} />
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import type { VideoTab } from './toVideoCards.ts';
import type { VideoTabId } from './videoTypes.ts';

interface Props {
  tabs: readonly VideoTab[];
  current: VideoTab;
  onpick: (id: VideoTabId) => void;
}

const { tabs, current, onpick }: Props = $props();
</script>

<Dropdown section="Type">
  {#snippet trigger()}{current.label}<span class="tag">{current.videos.length.toLocaleString('en-US')}</span>{/snippet}
  <ul>
    {#each tabs as tab (tab.id)}
      <li>
        <button type="button" aria-current={tab.id === current.id} onclick={() => onpick(tab.id)}
        ><span>{tab.label}</span><span class="tag">{tab.videos.length.toLocaleString('en-US')}</span></button>
      </li>
    {/each}
  </ul>
</Dropdown>
