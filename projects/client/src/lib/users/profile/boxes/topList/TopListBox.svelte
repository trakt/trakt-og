<!-- Top List: likes across the user's lists over the most liked one's posters, and that list. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import BoxTitle from '$lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import heart from '$lib/icons/solid/heart.svg?raw';
import type { TopListView } from './TopListView.ts';

const { view }: { view: TopListView } = $props();
</script>

{#snippet bottom()}
  <BoxTitle title={view.title} subtitle={{ text: view.line }} />
{/snippet}

<ProfileBox image={null} {bottom}>
  <div class="posters">{#each view.posters as poster (poster)}<img src={poster} alt="" decoding="async" />{/each}</div>
  <BoxChips chips={[{ text: 'Top List' }, { text: view.lists, alt: true }]} />
  <BoxFigure value={view.likes} label={['likes', 'on lists']} icon={heart} />
</ProfileBox>

<style>
.posters {
  position: absolute;
  inset: 0;
  z-index: -2;
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  filter: var(--filter-profile-box-collage);

  img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}
</style>
