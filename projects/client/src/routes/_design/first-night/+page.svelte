<script lang="ts">
import FirstNightHero from '$lib/components/first-night/FirstNightHero.svelte';
import FirstNightProgress from '$lib/components/first-night/FirstNightProgress.svelte';
import Nudges from '$lib/components/first-night/Nudges.svelte';
import Header from '$lib/components/header/Header.svelte';
import { toHeaderUser } from '$lib/components/header/toHeaderUser';
import Specimen from '$lib/design/Specimen.svelte';
import type { FirstNight } from '$lib/firstNight/firstNight';
import type { StarterPick } from '$lib/firstNight/starterPicks';
import { PLACEHOLDER_AVATAR } from '$lib/users/placeholderAvatar';
import { dayIn } from '$lib/utils/dayIn';
import { type LibraryStage, libraryStages, toDemoLibrary } from './library.ts';
import { seedOverlay } from './seedOverlay.svelte.ts';

const { data } = $props();

// Joined twelve days ago, inside the pill's first 30 days.
const joinedAt = `${dayIn(new Date(Date.now() - 12 * 86_400_000).toISOString(), 'UTC')}T20:41:00Z`;
const taste = { country: 'us', services: [], genres: [] };

let stageId = $state<LibraryStage['id']>('three');
let named = $state(false);
const stage = $derived(libraryStages.find(({ id }) => id === stageId) ?? libraryStages[0]);
const user = $derived(toHeaderUser({
  username: 'reel_rookie',
  name: named ? 'Sam Rivera' : null,
  vip: false,
  ids: { slug: 'reel_rookie' },
  images: { avatar: { full: PLACEHOLDER_AVATAR } },
  joined_at: joinedAt,
}));

// The library is made from the wall's own picks, so their posters fill the reel.
let picks = $state<readonly StarterPick[]>([]);
$effect(() => {
  data.firstNight.then(
    ({ tabs }) => (picks = (tabs.find(({ key }) => key === 'shows') ?? tabs.at(0))?.picks ?? []),
    () => {},
  );
});
seedOverlay(() => toDemoLibrary(stage, picks));

const loading = new Promise<FirstNight>(() => {});
</script>

<Specimen title="Welcome wall" bleed
  note="Pick how far the member got. The reel, the Getting started pill and the corner nudges all count the same library.">
  <div class="controls">
    <p>
      A member who joined twelve days ago and has watched fewer than ten titles gets this in place of the greeting.
      Signed out, the demo holds a made-up library built from the wall's picks; signed in, everything counts your own.
    </p>
    <fieldset>
      <legend>Library</legend>
      {#each libraryStages as option (option.id)}
        <label><input type="radio" bind:group={stageId} value={option.id} /> {option.label}</label>
      {/each}
    </fieldset>
    <label><input type="checkbox" bind:checked={named} /> Display name set</label>
  </div>
  <div class="site">
    <Header {user} searchType={data.searchType} />
    <FirstNightProgress slug={user.slug} watched={stage.watched} {taste} />
    <FirstNightHero firstNight={data.firstNight} firstName={user.firstName} {named} avatarUrl={user.avatarUrl} />
  </div>
</Specimen>

<Specimen title="While the charts load" bleed note="The wall holds its height until the posters land.">
  <div class="site">
    <Header {user} searchType={data.searchType} />
    <FirstNightProgress slug={user.slug} watched={stage.watched} {taste} />
    <FirstNightHero firstNight={loading} firstName={user.firstName} {named} avatarUrl={user.avatarUrl} />
  </div>
</Specimen>

<Nudges slug={user.slug} firstName={user.firstName} joinedAt={user.joinedAt} {taste} />

<style>
.controls {
  display: grid;
  gap: var(--space-sm-block);
  padding: var(--gutter) var(--design-canvas-padding);

  & p {
    max-inline-size: var(--design-note-width);
    margin: 0;
    color: var(--color-text-muted);
  }
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  margin: 0;
}

/* The header is fixed to this frame instead of the window, so it sits over the wall as it does on the dashboard. */
.site {
  contain: layout;
}
</style>
