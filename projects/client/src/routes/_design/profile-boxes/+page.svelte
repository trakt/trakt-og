<!--
  The profile's stat boxes: four made-up users and the strip the picker gives each, with every box's score, then
  every box alone in each user's state and its empty states.
-->
<script lang="ts">
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import { profileBoxComponent } from '$lib/users/profile/boxes/profileBoxComponent';
import ProfileBoxStrip from '$lib/users/profile/boxes/ProfileBoxStrip.svelte';

const { data } = $props();
</script>

<Specimen title="Each member's strip" bleed
  note="Four boxes each: About Me first when it's written, then the best scores of 40 or more (at most two number boxes), always one image box, and floor boxes fill any slot left.">
  {#each data.strips as strip (strip.name)}
    <div class="strip-head">
      <h3>{strip.name}, {strip.label.toLowerCase()}</h3>
      <p class="scores">
        {#each strip.scores as { key, score } (key)}<span>{key} <b>{score ?? '–'}</b></span>{/each}
      </p>
    </div>
    <ProfileBoxStrip boxes={strip.boxes} />
  {/each}
</Specimen>

<Specimen title="Each box" note="Every box alone, in each member's state, then your own empty one and nothing yet.">
  {#each data.alone as box (box.key)}
    <h3>{box.key}</h3>
    <div class="variants">
      {#each box.variants as variant (variant.caption)}
        {#if variant.entry}
          {@const Box = profileBoxComponent(variant.entry.key)}
          <Variant label={variant.caption}>
            {#if Box}<Box view={variant.entry.view} />{/if}
          </Variant>
        {/if}
      {/each}
    </div>
  {/each}
</Specimen>

<style>
.strip-head {
  padding: var(--gutter) var(--design-canvas-padding) 0;

  & h3 {
    margin: 0;
    font-size: var(--font-size-h4);
  }
}

.scores {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  color: var(--color-text-muted);
}

/* The strip's text color, which the boxes inherit. */
.variants {
  display: grid;
  color: var(--color-card-text);
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--gutter);
}
</style>
