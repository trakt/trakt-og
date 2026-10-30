<script lang="ts">
import avatar from '$lib/assets/trakt-logo-red.png';
import mandalorian from '$lib/assets/welcome-mandalorian.jpg';
import breakingBad from '$lib/assets/breaking-bad-fanart.jpg';
import brooklyn from '$lib/assets/dashboard-welcome.jpg';
import profileCover from '$lib/assets/profile-cover-default.jpg';
import { headerArt } from '$lib/components/header/headerArt';
import Footer from '$lib/components/footer/Footer.svelte';
import Header from '$lib/components/header/Header.svelte';
import Signpost from '$lib/components/signpost/Signpost.svelte';
import DemoChoice from '$lib/design/DemoChoice.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { DarkKnight } from '$lib/settings/DarkKnight';
import type { SettingsBody } from '$lib/settings/SettingsBody';
import { PLACEHOLDER_AVATAR } from '$lib/users/placeholderAvatar';
import { dayIn } from '$lib/utils/dayIn';
import { libraryStages, toDemoLibrary } from '../first-night/library.ts';
import { seedOverlay } from '../first-night/seedOverlay.svelte.ts';

const { data } = $props();

const demoUser = { slug: 'og_red', firstName: 'OG', displayName: 'OG Red', avatarUrl: avatar, joinedAt: '2020-08-20T19:23:00Z', named: true };
// Joined twelve days ago, so the Getting started pill shows.
const joinedAt = `${dayIn(new Date(Date.now() - 12 * 86_400_000).toISOString(), 'UTC')}T20:41:00Z`;
const NEW_MEMBER = 'New member';
const users: Record<string, HeaderUser | null> = {
  'Signed out': null,
  'Renewing an expired token': null,
  'Signed in': { ...demoUser, isVip: false },
  'Signed in, VIP': { ...demoUser, isVip: true },
  [NEW_MEMBER]: {
    slug: 'reel_rookie',
    firstName: 'reel_rookie',
    displayName: 'reel_rookie',
    avatarUrl: PLACEHOLDER_AVATAR,
    joinedAt,
    named: false,
    isVip: false,
  },
};

// The art a page hands the header, which tints the bar's glass with it.
const BACKDROPS: Record<string, string | undefined> = {
  None: undefined,
  'Dark art': mandalorian,
  'Bright art': brooklyn,
  'Gray and yellow art': breakingBad,
  'Red profile cover': profileCover,
};

let who = $state('Signed out');
let backdrop = $state('Dark art');
const art = $derived(BACKDROPS[backdrop]);
let darkKnight = $state<DarkKnight>('false');
const user = $derived(users[who] ?? null);
const threeSeen = libraryStages.find(({ id }) => id === 'three') ?? libraryStages[0];
seedOverlay(() => (who === NEW_MEMBER ? toDemoLibrary(threeSeen, []) : null));
const renewing = $derived(who === 'Renewing an expired token');

// The profile menu's "Dark Knight" item saves here instead of the API; each card's Light and Dark preview the themes.
function save(body: SettingsBody) {
  const next = body.browsing?.dark_knight;
  if (next === 'false' || next === 'true' || next === 'auto') darkKnight = next;
  return Promise.resolve({ saved: true, errors: [] });
}
</script>

<Specimen title="Top bar" bleed
  note="Pick a viewer and the art behind the bar, which tints its glass. Click the magnifier or press / to search (shimmering rows hold the starting list's place while it loads), and hover the signpost or the profile button for their menus.">
  <div class="knobs">
    <DemoChoice label="Viewer" options={Object.keys(users).map((value) => ({ value, label: value }))} bind:value={who} />
    <DemoChoice label="Backdrop" options={Object.keys(BACKDROPS).map((value) => ({ value, label: value }))}
      bind:value={backdrop} />
  </div>
  <div class="site">
    <Header {user} {renewing} searchType={data.searchType} {darkKnight} {save} />
    {#if art}
      <div class="backdrop" style:background-image="url('{art}')" {@attach headerArt(art)}></div>
    {:else}
      <div class="backdrop plain"></div>
    {/if}
  </div>
</Specimen>

<Specimen title="Signpost"
  note="og's help mark, 1em square in the text's color: the help menu's trigger and the help page's title.">
  <p class="marks"><Signpost /> <Signpost /> <Signpost /></p>
</Specimen>

<Specimen title="Footer" bleed note="The same on every page, under the content.">
  <Footer />
</Specimen>

<style>
.knobs {
  display: grid;
  gap: var(--space-base-inline);
  padding: var(--design-canvas-padding);
}

/* The mark at the help menu's size, then the help page title's, then twice that. */
.marks {
  display: flex;
  align-items: center;
  gap: var(--gutter);
  margin: 0;

  & :global(.signpost:nth-child(1)) {
    font-size: var(--header-signpost);
  }

  & :global(.signpost:nth-child(2)) {
    font-size: var(--font-size-base);
  }

  & :global(.signpost:nth-child(3)) {
    font-size: calc(var(--header-signpost) * 2);
  }
}

/* The bar is fixed to this frame instead of the window, so it sits over the art as it does on a page. */
.site {
  contain: layout;
}

/* Stands in for a page's fanart header, running under the bar. */
.backdrop {
  block-size: var(--fanart-header-height);
  background: center 25% / cover no-repeat;

  &.plain {
    background: var(--color-surface);
  }
}
</style>
