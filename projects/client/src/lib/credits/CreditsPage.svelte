<!--
  The cast and crew page of a movie, show, season or episode: the subpage frame,
  then an "Actors" and a "Crew" section, each a dropdown of its groups (Role, Department) over a five-column grid of
  headshots.
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import type { loadCredits } from './loadCredits.ts';

const { data }: { data: Awaited<ReturnType<typeof loadCredits>> } = $props();
const title = $derived(`Cast & Crew for ${data.media.item.title}`);
const groups = $derived(
  [
    { key: 'actors', label: 'Actors', section: 'Role', tabs: data.credits.actors },
    { key: 'crew', label: 'Crew', section: 'Department', tabs: data.credits.crew },
  ].filter(({ tabs }) => tabs.length > 0),
);
const sections = $derived(groups.map(({ key, label }) => ({ label, href: `#${key}` })));
// A new item starts on each section's first group, like OG.
let picks = $state<{ href: string; ids: Readonly<Record<string, string>> }>({ href: '', ids: {} });
const pickedIn = (key: string) => (picks.href === data.media.href ? picks.ids[key] : undefined);
const pick = (key: string, id: string) => {
  const ids = picks.href === data.media.href ? picks.ids : {};
  picks = { href: data.media.href, ids: { ...ids, [key]: id } };
};
</script>

<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content={title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={title} />
  {#if data.media.poster}<meta property="og:image" content={data.media.poster} />{/if}
</svelte:head>

<SubpageFrame {...data} label="Cast & Crew" {sections}>
  {#each groups as { key, label, section, tabs } (key)}
    {@const current = tabs.find(({ id }) => id === pickedIn(key)) ?? tabs[0]}
    <section id={key} aria-labelledby="{key}-heading">
      <h2 id="{key}-heading">{label}</h2>
      {#if current}
        <div class="controls">
          <Dropdown {section}>
            {#snippet trigger()}{current.label}<span class="tag">{current.count}</span>{/snippet}
            <ul>
              {#each tabs as tab (tab.id)}
                <li>
                  <button type="button" aria-current={tab.id === current.id} onclick={() => pick(key, tab.id)}
                    ><span>{tab.label}</span><span class="tag">{tab.count}</span></button>
                </li>
              {/each}
            </ul>
          </Dropdown>
        </div>
        <PosterGrid columns={5}>
          {#each current.people as person, i (i)}
            <PosterCard
              href={person.href}
              title={person.name}
              image={person.image}
              subtitles={[person.role || '\u00a0', ...(person.episodes ? [person.episodes] : [])]}
            />
          {/each}
        </PosterGrid>
      {/if}
    </section>
  {/each}
</SubpageFrame>

<style>
h2 {
  margin: 0;
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}
</style>
