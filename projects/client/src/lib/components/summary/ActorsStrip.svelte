<!--
  A summary's "People" section: the heading with "All People", a dropdown of every group with its count, under an
  Actors header ("Cast", or a show's "Series Regulars" and "Guest Stars") and a Crew header ("Directing", "Writing"),
  and a row of headshots sized so eight fit, that scrolls sideways for the rest. "All People" opens the people page on
  the picked group. Pointing at one headshot dims the rest. Empty groups aren't offered. A group the page only counts
  (a long-running show's guest stars) loads when picked, with a row of shimmers meanwhile, and keeps what it loaded.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import { peopleGroupHref } from '#lib/credits/peopleGroupHref.ts';
import { castHeadshot, type PortraitOf } from '#lib/images/castHeadshot.ts';
import { countLabel } from '#lib/utils/countLabel.ts';
import CastCard from './CastCard.svelte';
import type { CastMember } from './CastMember.ts';
import SectionHeading from './SectionHeading.svelte';

type Cast = readonly CastMember[];

/** A group the page sends whole, or one it only counts, which `load`s when picked. */
type Group = {
  readonly id: string;
  readonly label: string;
  /** Each actor shows in character where there's a portrait of them in this show or movie. */
  readonly portraitOf?: PortraitOf;
} & ({ readonly cast: Cast } | { readonly count: number; readonly load: () => Promise<Cast | null> });

interface Props {
  groups: readonly Group[];
  /** The crew departments, with each person's jobs as their `characters`. */
  crew?: readonly Group[];
  /** The full credits subpage. */
  creditsHref: string;
}

// The row's visible cards (`--actors-visible`).
const SHIMMER_SLOTS = Array.from({ length: 7 }, (_, i) => i);

const { groups, crew = [], creditsHref }: Props = $props();
const size = (group: Group) => ('cast' in group ? group.cast.length : group.count);
const kinds = $derived(
  [
    { kind: 'Actors' as const, groups: groups.filter((group) => size(group) > 0) },
    { kind: 'Crew' as const, groups: crew.filter((group) => size(group) > 0) },
  ].filter(({ groups }) => groups.length > 0),
);
const tabs = $derived(
  kinds.flatMap(({ kind, groups }) => groups.map((group) => ({ ...group, kind, key: `${kind}:${group.id}` }))),
);
let picked = $state<string>();
const current = $derived(tabs.find(({ key }) => key === picked) ?? tabs[0]);

// One read per group, kept while the strip is; a failed one is dropped, so Try again reads it again.
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- never read reactively: dropping a failed read would reread it
const loads = new Map<string, Promise<Cast | null>>();
let attempt = $state(0);
const loaded = (key: string, load: () => Promise<Cast | null>) => {
  const kept = loads.get(key);
  if (kept) return kept;
  const read = load().catch(() => null);
  loads.set(key, read);
  void read.then((cast) => {
    if (!cast) loads.delete(key);
  });
  return read;
};
</script>

{#snippet row(cast: Cast, portraitOf?: PortraitOf)}
  <ul class="cast">
    {#each cast as member (member.slug)}
      <li>
        <CastCard name={member.name} href="/people/{member.slug}" image={castHeadshot(member.id, portraitOf)}
          gender={member.gender} role={member.characters}
          episodes={member.episodes ? countLabel(member.episodes, 'episode') : undefined} />
      </li>
    {/each}
  </ul>
{/snippet}

{#if current}
  <div class="actors" id="people" {@attach trackDrilldowns({ source: 'credits' })}>
  <SectionHeading title="People" more={{
    href: peopleGroupHref(creditsHref, { kind: current.kind, id: current.id, first: current.key === tabs[0]?.key }),
    text: 'All People',
    drilldown: 'social',
  }} />
  <div class="controls">
    <Dropdown section={current.kind}>
      {#snippet trigger()}{current.label}<span class="tag">{size(current).toLocaleString('en-US')}</span>{/snippet}
      {#each kinds as { kind, groups: list }, i (kind)}
        {#if i > 0}<hr />{/if}
        <ul>
          <li class="header">{kind}</li>
          {#each list as group (group.id)}
            <li>
              <button type="button" aria-current={`${kind}:${group.id}` === current.key}
                onclick={() => (picked = `${kind}:${group.id}`)}
              ><span>{group.label}</span><span class="tag">{size(group).toLocaleString('en-US')}</span></button>
            </li>
          {/each}
        </ul>
      {/each}
    </Dropdown>
  </div>
  {#if 'cast' in current}
    {@render row(current.cast, current.portraitOf)}
  {:else}
    {#key attempt}
    {#await loaded(current.key, current.load)}
      <ul class="cast" aria-busy="true">
        {#each SHIMMER_SLOTS as slot (slot)}
          <li class="shimmer-card">
            <span class="headshot-shimmer"><Shimmer inline="100%" block="100%" /></span>
            <Shimmer inline="var(--cast-card-shimmer-name-width)" block="var(--font-size-cast-card-name)" />
            <Shimmer inline="var(--cast-card-shimmer-role-width)" block="var(--font-size-cast-card-role)" />
          </li>
        {/each}
      </ul>
    {:then cast}
      {#if cast}
        {@render row(cast, current.portraitOf)}
      {:else}
        <LoadFailed what={current.label} onretry={() => attempt++} />
      {/if}
    {/await}
    {/key}
  {/if}
</div>
{/if}

<style>
.actors {
  container-type: inline-size;
}

.controls {
  padding-block-start: var(--space-heading-dropdowns);
}

/* As far under the dropdown as the comments and lists previews' first rows. Eight cards fill the width, fewer in a
   narrow column, and the rest scroll in from the right. */
.cast {
  --visible: var(--actors-visible);
  display: grid;
  grid-auto-columns: calc((100% - (var(--visible) - 1) * var(--actors-gap)) / var(--visible));
  grid-auto-flow: column;
  gap: var(--actors-gap);
  margin: var(--gutter) 0;
  padding: 0 0 var(--actors-scrollbar-gap);
  overflow-x: auto;
  list-style: none;
  scroll-snap-type: x mandatory;
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
  scrollbar-width: thin;
}

.shimmer-card {
  display: grid;
  justify-items: center;
  gap: var(--cast-card-line-gap);
}

.headshot-shimmer {
  display: block;
  inline-size: 100%;
  aspect-ratio: var(--ratio-poster);
  margin-block-end: var(--cast-card-headshot-gap);
}

.cast > li {
  min-inline-size: 0;
  scroll-snap-align: start;
  transition: opacity var(--transition-card);
}

/* Like OG, pointing anywhere in the row fades every other actor. */
.cast:hover > li:not(:hover) {
  opacity: var(--opacity-actor-dimmed);
}

@container (width < 760px) {
  .cast {
    --visible: var(--actors-visible-narrow);
  }
}
</style>
