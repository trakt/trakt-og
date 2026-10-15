<!--
  A summary's "People" section: the heading with "All People", a dropdown of every group with its count, under an
  Actors header ("Cast", or a show's "Series Regulars" and "Guest Stars") and a Crew header ("Directing", "Writing"),
  and a row of headshots sized so eight fit, that scrolls sideways for the rest. "All People" opens the people page on
  the picked group. Pointing at one headshot dims the rest. Empty groups aren't offered.
-->
<script lang="ts">
import SeeMore from '$lib/components/see-more/SeeMore.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import { peopleGroupHref } from '$lib/credits/peopleGroupHref';
import CastCard from './CastCard.svelte';
import type { CastMember } from './CastMember.ts';

interface Group {
  readonly id: string;
  readonly label: string;
  readonly cast: readonly CastMember[];
}

interface Props {
  groups: readonly Group[];
  /** The crew departments, with each person's jobs as their `characters`. */
  crew?: readonly Group[];
  /** The full credits subpage. */
  creditsHref: string;
}

const { groups, crew = [], creditsHref }: Props = $props();
const kinds = $derived(
  [
    { kind: 'Actors' as const, groups: groups.filter(({ cast }) => cast.length > 0) },
    { kind: 'Crew' as const, groups: crew.filter(({ cast }) => cast.length > 0) },
  ].filter(({ groups }) => groups.length > 0),
);
const tabs = $derived(
  kinds.flatMap(({ kind, groups }) => groups.map((group) => ({ ...group, kind, key: `${kind}:${group.id}` }))),
);
let picked = $state<string>();
const current = $derived(tabs.find(({ key }) => key === picked) ?? tabs[0]);
</script>

{#if current}
  <div class="actors" id="people">
  <div class="heading">
    <h2>People</h2>
    <SeeMore
      href={peopleGroupHref(creditsHref, { kind: current.kind, id: current.id, first: current.key === tabs[0]?.key })}
      text="All People"
    />
  </div>
  <div class="controls">
    <Dropdown section={current.kind}>
      {#snippet trigger()}{current.label}<span class="tag">{current.cast.length.toLocaleString('en-US')}</span>{/snippet}
      {#each kinds as { kind, groups: list }, i (kind)}
        {#if i > 0}<hr />{/if}
        <ul>
          <li class="header">{kind}</li>
          {#each list as group (group.id)}
            <li>
              <button type="button" aria-current={`${kind}:${group.id}` === current.key}
                onclick={() => (picked = `${kind}:${group.id}`)}
              ><span>{group.label}</span><span class="tag">{group.cast.length.toLocaleString('en-US')}</span></button>
            </li>
          {/each}
        </ul>
      {/each}
    </Dropdown>
  </div>
  <ul class="cast">
    {#each current.cast as member (member.href)}
      <li>
        <CastCard name={member.name} href={member.href} image={member.image} gender={member.gender} role={member.characters}
          episodes={member.episodes} />
      </li>
    {/each}
  </ul>
</div>
{/if}

<style>
.actors {
  container-type: inline-size;
}

.heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-block-start: var(--gutter);

  & h2 {
    margin: 0;
  }
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
