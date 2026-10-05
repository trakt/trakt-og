<!--
  The profile's stat boxes: four made-up users and the strip the picker gives each, with every box's score, then
  every box alone in each user's state and its empty states.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import { profileBoxComponent } from '$lib/users/profile/boxes/profileBoxComponent';
import ProfileBoxStrip from '$lib/users/profile/boxes/ProfileBoxStrip.svelte';

const { data } = $props();
</script>

<svelte:head>
  <title>Profile boxes - Trakt</title>
</svelte:head>

<Container>
  <h1>Profile boxes</h1>
  <p>Each user gets the four best-scoring boxes. Scores of 40 or more count; the floor fills the rest.</p>
</Container>

{#each data.strips as strip (strip.name)}
  <Container>
  <h2>{strip.name}, {strip.label.toLowerCase()}</h2>
  <p class="scores">
      {#each strip.scores as { key, score } (key)}<span>{key} <b>{score ?? '–'}</b></span>{/each}
    </p>
</Container>
  <ProfileBoxStrip boxes={strip.boxes} />
{/each}

<Container>
  <h2>Each box</h2>
  {#each data.alone as box (box.key)}
    <h3>{box.key}</h3>
    <div class="variants">
      {#each box.variants as variant (variant.caption)}
        {#if variant.entry}
          {@const Box = profileBoxComponent(variant.entry.key)}
          <figure>
            {#if Box}<Box view={variant.entry.view} />{/if}
            <figcaption>{variant.caption}</figcaption>
          </figure>
        {/if}
      {/each}
    </div>
  {/each}
</Container>

<style>
h2 {
  margin-block-start: var(--space-lg-block);
}

.scores {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  color: var(--color-text-muted);
}

.variants {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--gutter);
}

figure {
  margin: 0;
  color: var(--color-card-text);
}

figcaption {
  color: var(--color-text-muted);
}
</style>
