<!--
  The four boxes under a profile's frame, picked by the loader. Four across, two from tablet width, one on phones.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import { profileBoxComponent } from './profileBoxComponent.ts';
import type { toProfileBoxes } from './toProfileBoxes.ts';

const { boxes }: { boxes: Awaited<ReturnType<typeof toProfileBoxes>> } = $props();
</script>

<section class="boxes" aria-label="Stats">
  <Container>
    <div class="grid">
      {#each boxes as box (box.key)}
        {@const Box = profileBoxComponent(box.key)}
        {#if Box}<Box view={box.view} />{/if}
      {/each}
    </div>
  </Container>
</section>

<style>
.boxes {
  background-color: var(--color-profile-boxes-bg);
  color: var(--color-card-text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    margin-inline: calc(var(--gutter) / -2);
  }
}
</style>
