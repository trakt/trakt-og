<!-- Featured List: the watchlist over its first item's fanart, with its size, a fanned poster stack and what's next. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxTitle from '$lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { FeaturedListView } from './FeaturedListView.ts';

const { view }: { view: FeaturedListView } = $props();
const chips = $derived([{ text: 'Featured List', alt: true }, ...(view.count ? [{ text: view.count }] : [])]);
</script>

{#snippet bottom()}
  <BoxChips {chips} />
  <BoxTitle title={{ text: view.name, href: view.href }} subtitle={view.next ? { text: view.next } : undefined} />
{/snippet}

<ProfileBox image={view.count ? view.image ?? null : undefined} placeholder={!view.count} {bottom}>
  {#if view.posters.length > 0}
    <div class="posters">
      {#each view.posters as poster (poster)}<img src={poster} alt="" decoding="async" />{/each}
    </div>
  {/if}
</ProfileBox>

<style>
.posters {
  position: absolute;
  inset-block-start: var(--profile-box-padding-block);
  inset-inline-end: var(--profile-box-padding-block);
  display: flex;

  img {
    inline-size: var(--profile-box-poster-width);
    block-size: var(--profile-box-poster-height);
    border: 1px solid var(--color-profile-box-poster-border);
    border-radius: var(--radius-profile-chip);
    box-shadow: var(--shadow-profile-box-poster);
    object-fit: cover;

    & + img {
      margin-inline-start: var(--profile-box-poster-overlap);
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
