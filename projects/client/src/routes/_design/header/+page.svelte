<script lang="ts">
import avatar from '$lib/assets/trakt-logo-red.png';
import mandalorian from '$lib/assets/welcome-mandalorian.jpg';
import breakingBad from '$lib/assets/mobile-splash-fanart.jpg';
import brooklyn from '$lib/assets/dashboard-welcome.jpg';
import profileCover from '$lib/assets/profile-cover-default.jpg';
import { headerArt } from '$lib/components/header/headerArt';
import Footer from '$lib/components/footer/Footer.svelte';
import Header from '$lib/components/header/Header.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import type { DarkKnight } from '$lib/settings/DarkKnight';
import type { SettingsBody } from '$lib/settings/SettingsBody';
import { toTheme } from '$lib/settings/toTheme';

const demoUser = { slug: 'og_red', firstName: 'OG', avatarUrl: avatar };
const users: Record<string, HeaderUser | null> = {
  'Signed out': null,
  'Signed in': { ...demoUser, isVip: false },
  'Signed in, VIP': { ...demoUser, isVip: true },
};

const SETTINGS: ReadonlyArray<readonly [DarkKnight, string]> = [
  ['false', 'Off (OG default)'],
  ['true', 'On (dark knight)'],
  ['auto', 'Auto (uses your system appearance setting)'],
];

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

$effect(() => {
  const root = document.documentElement;
  const before = root.dataset.theme;
  root.dataset.theme = toTheme(darkKnight);
  return () => {
    if (before === undefined) delete root.dataset.theme;
    else root.dataset.theme = before;
  };
});

// The profile menu's "Dark Knight" item saves here instead of the API.
function save(body: SettingsBody) {
  darkKnight = SETTINGS.find(([value]) => value === body.browsing?.dark_knight)?.[0] ?? darkKnight;
  return Promise.resolve({ saved: true, errors: [] });
}
</script>

<svelte:head>
  <title>Header and footer · og design system</title>
</svelte:head>

<Header {user} {darkKnight} {save} />

<main>
  {#if art}<div class="backdrop" style:background-image="url('{art}')" {@attach headerArt(art)}></div>{/if}
  <section>
    <h1>Header and footer</h1>
    <p>
      The fixed top bar and OG's footer. The bar is dark glass, tinted by the page's backdrop. Click the magnifier or
      press <kbd>/</kbd> to open search, and hover the profile button for its menu. Below 992px the links move into the
      menu button.
    </p>
    <fieldset>
      <legend>User</legend>
      {#each Object.keys(users) as option (option)}
        <label><input type="radio" bind:group={who} value={option} /> {option}</label>
      {/each}
    </fieldset>
    <fieldset>
      <legend>Backdrop</legend>
      {#each Object.keys(BACKDROPS) as option (option)}
        <label><input type="radio" bind:group={backdrop} value={option} /> {option}</label>
      {/each}
    </fieldset>
    <label>
      Dark Knight
      <select bind:value={darkKnight}>
        {#each SETTINGS as [value, label] (value)}<option {value}>{label}</option>{/each}
      </select>
    </label>
  </section>
</main>

<Footer />

<style>
main {
  padding-block-start: var(--header-height);

  &:has(.backdrop) {
    padding-block-start: 0;
  }
}

/* Stands in for a page's fanart header, running under the bar. */
.backdrop {
  block-size: var(--fanart-header-height);
  background: center 25% / cover no-repeat;
}

section {
  min-block-size: 60vh;
  padding: var(--gutter);
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  margin-block: var(--gutter);
}
</style>
