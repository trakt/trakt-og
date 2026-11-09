<!--
  The progress page's Status dropdown, shared by the shows' tabs and Franchises: Watching, Rewatching and Dropped under
  a Shows header, Franchises under Movies. The trigger names the picked tab's header ("Shows: Watching", "Movies: Franchises").
    <ProgressTypeMenu type="watched" href={(type) => `/users/me/progress/${type}`} />
-->
<script lang="ts">
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import { progressTypeGroup } from './progressTypeGroup.ts';
import { progressTypeGroups } from './progressTypeGroups.ts';
import { type ProgressType, progressTypes } from './progressTypes.ts';

interface Props {
  type: ProgressType;
  href: (type: ProgressType) => string;
}

const { type, href }: Props = $props();
</script>

<!-- Tab links keep the canonical profile slug and the query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Dropdown section={progressTypeGroup(type)}>
  {#snippet trigger()}{progressTypes[type].label}{/snippet}
  {#each progressTypeGroups as group, index (group.label)}
    {#if index > 0}<hr />{/if}
    <ul>
      <li class="header">{group.label}</li>
      {#each group.types as groupType (groupType)}
        <li><a href={href(groupType)} aria-current={type === groupType ? 'page' : undefined}>{progressTypes[groupType].label}</a></li>
      {/each}
    </ul>
  {/each}
</Dropdown>
