<!--
  A profile box's fanned stack of up to three posters over a list's name: the first (rank 1) in the middle and on top,
  the next two tilted out behind it.
-->
<script lang="ts">
const { posters }: { posters: readonly string[] } = $props();
const fanned = $derived(posters.length > 1 ? [posters[1], posters[0], ...posters.slice(2, 3)] : posters);
</script>

{#if posters.length > 0}
  <div class="fan" aria-hidden="true">
    {#each fanned as poster (poster)}<img src={poster} alt="" decoding="async" />{/each}
  </div>
{/if}

<style>
.fan {
  display: flex;
  margin-block-end: 10px;

  img {
    inline-size: var(--profile-box-poster-width);
    block-size: var(--profile-box-poster-height);
    border-radius: var(--radius-profile-chip);
    box-shadow: var(--shadow-profile-box-poster);
    object-fit: cover;

    & + img {
      margin-inline-start: var(--profile-box-poster-overlap);
    }

    &:nth-child(2) {
      position: relative;
      z-index: 1;
    }

    &:first-child {
      rotate: calc(-1 * var(--profile-box-poster-tilt));
    }

    &:last-child:not(:first-child) {
      rotate: var(--profile-box-poster-tilt);
    }
  }
}
</style>
