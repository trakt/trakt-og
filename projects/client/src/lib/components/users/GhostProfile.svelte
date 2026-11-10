<!--
  Someone else's public profile with nothing on it: still outlines of the episodes and movies a profile fills with,
  fading out under one line saying it's empty. Takes the place of every section under the frame. The outlines
  hold still, so it never reads as loading; your own empty profile gets the welcome hero instead.
    {#if data.ghost}<GhostProfile name={data.profile.displayName} />{/if}
-->
<script lang="ts">
import Container from '#lib/components/container/Container.svelte';

const { name }: { name: string } = $props();

const id = $props.id();
const ROWS = [
  { type: 'episodes', cards: 4 },
  { type: 'movies', cards: 6 },
] as const;
</script>

<section class="ghost-profile" aria-labelledby={id}>
  <Container>
    <div class="ghost">
      <div class="outlines" aria-hidden="true">
        {#each ROWS as row (row.type)}
          <span class="heading"></span>
          <div class={['row', row.type]}>
            {#each { length: row.cards }, slot (slot)}<span class="card"></span>{/each}
          </div>
        {/each}
      </div>
      <div class="message">
        <h2 {id}>Nothing watched yet</h2>
        <p>When {name} watches, rates or comments on something, it shows up here.</p>
      </div>
    </div>
  </Container>
</section>

<style>
.ghost-profile {
  display: flow-root;
  padding-block: var(--ghost-profile-padding-block);
  background-color: var(--color-surface);
}

.ghost {
  display: grid;
  container-type: inline-size;

  & > * {
    grid-area: 1 / 1;
  }
}

.outlines {
  display: grid;
  gap: var(--ghost-profile-gap);
  mask-image: var(--ghost-profile-fade);
}

.heading {
  inline-size: var(--ghost-profile-heading-width);
  block-size: var(--ghost-profile-heading-height);
  border-radius: var(--radius-empty-state);
  background-color: var(--color-ghost-profile-shape);
}

.row {
  display: grid;
  gap: var(--gutter);

  &.episodes {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &.movies {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  @container (max-width: 700px) {
    &.episodes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &.movies {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}

.card {
  border: 1px dashed var(--color-empty-state-border);
  border-radius: var(--radius-empty-state);
  background-color: var(--color-ghost-profile-shape);
}

.episodes .card {
  aspect-ratio: var(--ratio-fanart);
}

.movies .card {
  aspect-ratio: var(--ratio-poster);
}

.message {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--ghost-profile-message-gap);
  padding: var(--gutter);
  text-align: center;
  font-family: var(--font-headings);
  text-shadow: var(--shadow-ghost-profile-text);

  h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-ghost-profile-title);
    text-wrap: balance;
  }

  p {
    max-inline-size: var(--ghost-profile-text-width);
    margin: 0;
    color: var(--color-empty-state-text);
    font-size: var(--font-size-ghost-profile-text);
    text-wrap: balance;
  }
}
</style>
