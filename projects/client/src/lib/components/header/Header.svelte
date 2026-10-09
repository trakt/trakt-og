<!--
  The fixed top bar, on dark glass tinted by the page's backdrop (HeaderTint): the Trakt mark, the search icon and the
  main links on the left, and the account on the right: Get VIP and the profile menu, or one Sign In button.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import logo from '$lib/assets/trakt-logo-red.png';
import Icon from '$lib/icons/Icon.svelte';
import bars from '$lib/icons/solid/bars.svg?raw';
import moon from '$lib/icons/solid/moon.svg?raw';
import rocket from '$lib/icons/solid/rocket.svg?raw';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { toast } from '$lib/components/toast/toast.svelte';
import type { DarkKnight } from '$lib/settings/DarkKnight';
import { saveSettings, type SaveSettingsResult } from '$lib/settings/saveSettings';
import { setDarkKnight } from '$lib/settings/setDarkKnight';
import { settingsRequest } from '$lib/settings/settingsRequest';
import { showsDark } from '$lib/settings/showsDark';
import type { SettingsBody } from '$lib/settings/SettingsBody';
import { traktUrls } from '$lib/traktUrls';
import { MediaQuery } from 'svelte/reactivity';
import HeaderMenu from './HeaderMenu.svelte';
import HeaderSearch from './HeaderSearch.svelte';
import HeaderTint from './HeaderTint.svelte';
import type { HeaderUser } from './HeaderUser.ts';
import { reviewLinks } from './reviewLinks.ts';

interface Props {
  user: HeaderUser | null;
  /** The `search_type` cookie, so SSR renders the search type picker's label. */
  searchType?: string;
  /** The viewer's saved Dark Knight setting, which the profile menu's "Dark Knight" item toggles. */
  darkKnight?: DarkKnight;
  /** Saves the toggled setting. The demo route passes one that doesn't touch the API. */
  save?: (body: SettingsBody) => Promise<SaveSettingsResult>;
}

const browserSave = (body: SettingsBody) =>
  saveSettings({
    request: settingsRequest(authenticatedFetch({ manager: userManager() })),
    body,
  });

const { user, searchType, darkKnight: saved = 'false', save = browserSave }: Props = $props();

const sections = $derived([
  ...(user ? [{ title: 'Dashboard', href: '/dashboard' }] : []),
  { title: 'Discover', href: '/discover' },
  { title: 'Shows', href: '/shows/trending' },
  { title: 'Movies', href: '/movies/trending' },
  { title: 'Calendar', href: '/calendars' },
]);

const profileTabs = ['History', 'Progress', 'Watchlist', 'Library', 'Ratings', 'Lists', 'Comments', 'Notes', 'Network'];
const profileLinks = $derived(
  user
    ? [
      { title: 'Profile', href: `/users/${user.slug}` },
      ...profileTabs.map((title) => ({ title, href: `/users/${user.slug}/${title.toLowerCase()}` })),
    ]
    : [],
);
const reviews = $derived(user ? reviewLinks({ slug: user.slug, now: new Date() }) : []);

// OG marks a nav link selected when the first path segment matches (`/shows/popular` selects Shows).
const section = $derived(page.url.pathname.split('/')[1]);
const current = (href: string) => (href.split('/')[1] === section ? 'true' : undefined);

// What the page shows now: the saved setting until a toggle answers, and Auto follows the system.
let darkKnight = $derived(saved);
const prefersDark = new MediaQuery('(prefers-color-scheme: dark)');
const dark = $derived(showsDark({ darkKnight, prefersDark: prefersDark.current }));

// OG flips what the page shows and saves it, so from Auto it saves an explicit On or Off (global.js:4011-4017).
async function toggleDarkKnight() {
  const before = darkKnight;
  darkKnight = dark ? 'false' : 'true';
  const done = await setDarkKnight({
    value: darkKnight,
    save,
    reload: invalidateAll,
    notify: toast.error,
    root: document.documentElement,
  });
  if (!done) darkKnight = before;
}
</script>

<!-- Links point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<header class="top-nav">
  <HeaderTint />
  <a class="logo" href="/"><img src={logo} alt="Trakt" width="34" height="34" /></a>

  <HeaderSearch savedType={searchType} viewer={user?.slug ?? null} />

  <nav class="links" aria-label="Main">
    {#each sections as link (link.href)}
      <a href={link.href} aria-current={current(link.href)}>{link.title}</a>
    {/each}
  </nav>

  <div class="mobile-links">
    <HeaderMenu label="Menu">
      {#snippet trigger()}<Icon svg={bars} />{/snippet}
      <ul>
        {#each sections as link (link.href)}
          <li><a href={link.href} aria-current={current(link.href)}>{link.title}</a></li>
        {/each}
      </ul>
    </HeaderMenu>
  </div>

  <div class="user">
    {#if user}
      {#if !user.isVip}
        <a class="get-vip" href={traktUrls.vip} target="_blank" rel="noopener"><Icon svg={rocket} /> Get VIP</a>
      {/if}
      <div class={['profile', { vip: user.isVip }]}>
        <HeaderMenu label="{user.firstName}'s menu">
          {#snippet trigger()}<img class="avatar" src={user.avatarUrl} alt="" width="36" height="36" />{/snippet}
          <ul>
            {#each profileLinks as link (link.href)}
              <li><a href={link.href}>{link.title}</a></li>
            {/each}
          </ul>
          <hr />
          <ul>
            {#each reviews as link (link.href)}
              <li><a href={link.href} target="_blank" rel="noopener">{link.title}</a></li>
            {/each}
            <li>
              <button type="button" class="dark-knight" aria-pressed={dark} onclick={toggleDarkKnight}>
                Dark Knight <span class="dark-knight-icon"><Icon svg={moon} /></span>
              </button>
            </li>
          </ul>
          <hr />
          <ul>
            {#if user.isVip}<li><a href={traktUrls.vip} target="_blank" rel="noopener">Manage VIP</a></li>{/if}
            <li><a href={traktUrls.settings} target="_blank" rel="noopener">Settings</a></li>
            <li><a href="/logout">Sign Out</a></li>
          </ul>
        </HeaderMenu>
      </div>
    {:else}
      <!-- One page signs in and signs up, so one button. -->
      <a class="sign-in" href="/auth/signin">Sign In</a>
    {/if}
  </div>
</header>

<style>
/* Always dark, whatever the page's theme. The tint layer sits under the content (z-index -1 inside this stacking
   context) and over the glass color. */
.top-nav {
  position: fixed;
  inset-block-start: 0;
  z-index: var(--z-header);
  display: flex;
  align-items: center;
  gap: var(--gap-header);
  inline-size: 100%;
  block-size: var(--header-height);
  padding-inline: var(--space-lg-inline);
  background: var(--color-header-glass);
  backdrop-filter: var(--blur-header-glass);
  box-shadow: inset 0 -1px 0 var(--color-header-edge);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

.logo {
  display: flex;
  margin-inline-end: var(--space-xs-inline);
  filter: var(--shadow-header-logo);
}

/* Main nav: loose pills. Hover gives a soft glass pill, and the current section is solid red. */
.links {
  display: flex;
  gap: var(--gap-header-links);
  font-size: var(--font-size-header-link);

  & > a {
    display: flex;
    align-items: center;
    block-size: var(--header-pill-height);
    padding-inline: var(--space-header-pill-inline);
    border-radius: var(--radius-header-pill);
    color: var(--color-header-muted);
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: var(--color-header-pill);
      color: var(--color-header-text);
    }

    &[aria-current] {
      background-color: var(--brand-primary);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-header-current);
    }
  }
}

/* The account, pushed to the far end. */
.user {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin-inline-start: auto;
  white-space: nowrap;
  font-size: var(--font-size-header-link);
}

.get-vip,
.sign-in {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--header-control-height);
  padding-inline: var(--space-header-pill-inline);
  border-radius: var(--radius-header-control);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

.get-vip {
  background-color: var(--color-header-vip-bg);
  color: var(--color-header-vip-text);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-tertiary);
    color: var(--color-header-text);
  }
}

.sign-in {
  padding-inline: var(--space-header-control-inline);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
  }
}

.profile :global(.trigger) {
  padding: 0;
  border-radius: 50%;
  text-shadow: none;
}

/* Open, the avatar gets a soft glass ring. */
.profile :global(.header-menu:has(.menu:popover-open) .trigger) {
  box-shadow: 0 0 0 var(--header-avatar-open-ring) var(--color-header-avatar-open-ring);
}

.mobile-links :global(.trigger) {
  block-size: var(--header-pill-height);
  padding-inline: var(--space-sm-inline);
  border-radius: var(--radius-header-pill);
  color: var(--color-header-muted);
  font-size: var(--font-size-nav);
  text-shadow: none;
}

.mobile-links :global(:is(.trigger:hover, .header-menu:has(.menu:popover-open) .trigger)) {
  background-color: var(--color-header-pill);
  color: var(--color-header-text);
}

.avatar {
  display: block;
  inline-size: var(--header-avatar-size);
  block-size: var(--header-avatar-size);
  border-radius: 50%;
  object-fit: cover;

  /* VIP: a red-to-orange ring around the avatar. */
  .profile.vip & {
    padding: var(--header-avatar-ring);
    background: conic-gradient(from 200deg, var(--brand-primary), var(--color-header-vip-ring), var(--brand-primary));
  }
}

.dark-knight-icon {
  margin-inline-start: 5px;
  opacity: 0;
  transition: opacity 0.5s;
}

/* Dark knight colors the toggle blue and shows the moon. */
.dark-knight[aria-pressed='true'] {
  color: var(--brand-secondary);

  & .dark-knight-icon {
    opacity: 1;
  }
}

.mobile-links {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .links > a,
  .get-vip,
  .sign-in {
    transition: none;
  }
}

/* Tablets: tighter link pills. */
@media (width <= 1200px) {
  .links > a {
    padding-inline: var(--space-sm-inline);
  }
}

/* The links move into a menu button on smaller screens. OG did so at 768px; og keeps 992px so the bar never
   overflows beside Get VIP. */
@media (width < 992px) {
  .links {
    display: none;
  }

  .mobile-links {
    display: block;
  }
}
</style>
