<!--
  The search page sidebar's Recent: the viewer's last searches as links to their results, the current one marked, an ×
  on each to remove it and Clear all on the right. With no recent searches it isn't there at all. Its open state is
  kept in the `sidebar_recent` cookie.
    <RecentSearchesSection {terms} open={data.sidebar.recent} query={data.query} slug={data.slug} {onremove} {onclear} />
-->
<script lang="ts">
import type { RecentSearch } from '$lib/components/header/createRecentSearches.svelte';
import { recentSearchType } from '$lib/components/header/recentSearchType';
import RecentClearAll from '$lib/components/header/RecentClearAll.svelte';
import SearchTermRow from '$lib/components/header/SearchTermRow.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import clockRotateLeft from '$lib/icons/light/clock-rotate-left.svg?raw';

interface Props {
  terms: ReadonlyArray<RecentSearch>;
  open: boolean;
  /** The page's search, marked in the list. */
  query: string;
  slug: string;
  onremove: (term: RecentSearch) => void;
  onclear: () => void;
}

const { terms, open, query, slug, onremove, onclear }: Props = $props();

const href = (kind: ReturnType<typeof recentSearchType>, term: RecentSearch) =>
  `/search${kind.slug ? `/${kind.slug}` : ''}?query=${encodeURIComponent(term.query)}`;
</script>

{#if terms.length}
  <SidebarSection id="recent" title="Recent" {open} remember>
    {#snippet action()}<RecentClearAll onclick={onclear} />{/snippet}
    <ul class="recent">
      {#each terms as term (`${term.query}:${term.type}`)}
        {@const kind = recentSearchType(term.type)}
        <SearchTermRow icon={clockRotateLeft} query={term.query} type={kind.label} href={href(kind, term)}
          selected={term.query === query && kind.slug === slug} onremove={() => onremove(term)} />
      {/each}
    </ul>
  </SidebarSection>
{/if}

<style>
.recent {
  display: grid;
  margin: 0 calc(-1 * var(--space-base-inline));
  padding: 0;
}
</style>
