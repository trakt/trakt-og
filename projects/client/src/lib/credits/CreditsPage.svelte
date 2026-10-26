<!--
  The people page (cast and crew) of a movie, show, season or episode: the subpage frame with a bar under its header. On the
  bar's left, one dropdown of every group, under an Actors and a Crew header ("Season Regulars 14", "Directing 3"); on
  its right the sort and its direction, a grid or list toggle and a search icon. The picked group shows as a grid of
  headshot cards (as many columns as fit) or a list of rows, one person a row. A search runs over every group as you
  type, name, character or job, and shows the matches under each group's heading with its count.
-->
<script lang="ts">
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import FilterPopover from '$lib/components/filters/FilterPopover.svelte';
import CastCard from '$lib/components/summary/CastCard.svelte';
import SectionHeading from '$lib/components/summary/SectionHeading.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '$lib/components/toolbar/SubnavCount.svelte';
import ViewToggle from '$lib/components/toolbar/ViewToggle.svelte';
import Icon from '$lib/icons/Icon.svelte';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import type { loadCredits } from './loadCredits.ts';
import { matchesCreditTerms } from './matchesCreditTerms.ts';
import { peopleGroupHref } from './peopleGroupHref.ts';
import { readPeopleGroup } from './readPeopleGroup.ts';
import { type CreditSort, sortCredits } from './sortCredits.ts';

const { data }: { data: Awaited<ReturnType<typeof loadCredits>> } = $props();
const title = $derived(`People for ${data.media.item.title}`);
const kinds = $derived(
  [
    { kind: 'Actors' as const, groups: data.credits.actors },
    { kind: 'Crew' as const, groups: data.credits.crew },
  ].filter(({ groups }) => groups.length > 0),
);
const groups = $derived(
  kinds.flatMap(({ kind, groups }) => groups.map((group) => ({ ...group, kind, key: `${kind}:${group.id}` }))),
);
const hasEpisodes = $derived(groups.some((group) => group.people.some(({ episodeCount }) => episodeCount)));
const sorts = $derived<readonly { id: CreditSort; label: string }[]>([
  { id: 'billing', label: 'Billing' },
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role' },
  ...(hasEpisodes ? [{ id: 'episodes' as const, label: 'Episodes' }] : []),
]);

// A new item starts on the group its link names (`?crew=production`), else its first, with no search; the sort and
// view carry over. Picking a group writes it back to the URL, so the page can be linked to as it is.
let picks = $state<{ href: string; key?: string; terms: string }>({ href: '', terms: '' });
const own = $derived(picks.href === data.media.href ? picks : { href: data.media.href, terms: '' });
const terms = $derived(own.terms.trim());
const linked = $derived(readPeopleGroup(page.url.searchParams));
const current = $derived(
  groups.find(({ key }) => key === own.key) ?? groups.find(({ key }) => key === linked) ?? groups[0],
);
function pick(key: string) {
  picks = { ...own, key };
  const group = groups.find((candidate) => candidate.key === key);
  if (!group) return;
  const href = peopleGroupHref(page.url.pathname, { kind: group.kind, id: group.id, first: group === groups[0] });
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page, with only its query changed
  replaceState(`${href}${page.url.hash}`, page.state);
}
const setTerms = (next: string) => (picks = { ...own, terms: next });

let sortBy = $state<CreditSort>('billing');
let flipped = $state(false);
let view = $state<'grid' | 'list'>('grid');
const sort = $derived(sorts.find(({ id }) => id === sortBy) ?? sorts[0]);

const results = $derived(
  (terms ? groups : current ? [current] : [])
    .map((group) => ({
      ...group,
      people: sortCredits(group.people.filter((person) => matchesCreditTerms(person, terms)), {
        by: sort?.id ?? 'billing',
        flipped,
        characters: group.kind === 'Actors',
      }),
    }))
    .filter((group) => group.people.length > 0),
);
const matches = $derived(results.reduce((total, group) => total + group.people.length, 0));
</script>

<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content={title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={title} />
  {#if data.media.poster}<meta property="og:image" content={data.media.poster} />{/if}
</svelte:head>

{#snippet subnav()}
  <SectionToolbar inSummary>
    {#snippet filters()}
      {#if current}
        <Dropdown section={current.kind}>
          {#snippet trigger()}{current.label}<span class="tag">{current.count}</span>{/snippet}
          {#each kinds as { kind, groups: list }, i (kind)}
            {#if i > 0}<hr />{/if}
            <ul>
              <li class="header">{kind}</li>
              {#each list as group (group.id)}
                <li>
                  <button type="button" aria-current={`${kind}:${group.id}` === current.key}
                    onclick={() => pick(`${kind}:${group.id}`)}
                  ><span>{group.label}</span><span class="tag">{group.count}</span></button>
                </li>
              {/each}
            </ul>
          {/each}
        </Dropdown>
      {/if}
    {/snippet}
    {#snippet summary()}
      <span class="sort">
        <Dropdown joined section="Sort">
          {#snippet trigger()}{sort?.label}{/snippet}
          <ul>
            {#each sorts as { id, label } (id)}
              <li>
                <button type="button" aria-current={id === sort?.id} onclick={() => {
                  sortBy = id;
                  flipped = false;
                }}>{label}</button>
              </li>
            {/each}
          </ul>
        </Dropdown>
        <!-- Billing, Name and Role run first to last, A to Z; Episodes most first. -->
        <SortDirection joined descending={sort?.id === 'episodes'} bind:flipped />
      </span>
      <span class="tools">
        <ViewToggle bind:view />
        <FilterPopover svg={search} label="Filter by name" tooltip="Filter by Name or Role" title="Search terms"
          help="Search every group for a name, character or job." active={Boolean(terms)} clearable={Boolean(terms)}
          note={terms ? `${matches.toLocaleString('en-US')} shown` : undefined} onapply={() => {}}
          onclear={() => setTerms('')}>
          <label class="panel-field">
            <Icon svg={search} />
            <input type="search" aria-label="Search term" placeholder="Type a name or role…" autocomplete="off"
              value={own.terms} oninput={(event) => setTerms(event.currentTarget.value)} />
          </label>
        </FilterPopover>
      </span>
    {/snippet}
  </SectionToolbar>
{/snippet}

<SubpageFrame
  {...data}
  label="People"
  sections={[{ label: 'People', href: '#people' }]}
  {subnav}
>
  <div id="people" class="people">
    {#each results as group (group.key)}
      <section aria-label="{group.kind}: {group.label}">
        {#if terms}
          <SectionHeading title={group.label} ruled>
            {#snippet actions()}
              <SubnavCount svg={friends} count={group.people.length} noun="person" plural="people"
                tooltip={group.kind} />
            {/snippet}
          </SectionHeading>
        {/if}
        <ul class={['grid', view]}>
          {#each group.people as person, i (i)}
            <li>
              <CastCard name={person.name} href={person.href} image={person.image} gender={person.gender} role={person.role}
                episodes={person.episodes} layout={view === 'list' ? 'row' : 'card'} />
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      {#if terms}<EmptyState action={{ onclick: () => setTerms(''), text: 'Clear search' }} />
      {:else}<EmptyState />{/if}
    {/each}
  </div>
</SubpageFrame>

<style>
.sort,
.tools {
  display: flex;
  align-items: center;
}

.tools {
  gap: var(--space-tools);
}

.people {
  display: grid;
  gap: var(--cast-groups-gap);
  padding-block-end: var(--gutter);
}

section {
  display: grid;
  gap: var(--cast-heading-gap);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--cast-grid-min), 1fr));
  gap: var(--cast-grid-row-gap) var(--actors-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  &.list {
    grid-template-columns: repeat(var(--cast-list-columns), minmax(0, 1fr));
    gap: var(--cast-list-gap);
  }
}
</style>
