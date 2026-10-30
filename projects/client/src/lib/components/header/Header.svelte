<!--
  The fixed top bar, on dark glass tinted by the page's backdrop (HeaderTint): the Trakt mark, the search icon and the
  main links on the left, and on the right the help menu and the account: Get VIP and the profile menu, or one Sign
  In button.
  While an expired session renews, it keeps the signed-in links and leaves the account empty until the user loads.
  A member picks their own links: Customize Header in the profile menu, or the pencil that shows when the mouse rests
  on the links, turns the bar into an editor (HeaderLinks),
  with Reset (back to the default links) and a green Done, list management's, in place of the account. Each change saves to this browser (headerLinkPrefs).
-->
<script lang="ts">
import { afterNavigate, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import logo from '$lib/assets/trakt-logo-red.png';
import Icon from '$lib/icons/Icon.svelte';
import arrowRightFromBracket from '$lib/icons/solid/arrow-right-from-bracket.svg?raw';
import barsProgress from '$lib/icons/solid/bars-progress.svg?raw';
import bookmark from '$lib/icons/solid/bookmark.svg?raw';
import calendarDays from '$lib/icons/solid/calendar-days.svg?raw';
import chartColumn from '$lib/icons/solid/chart-column.svg?raw';
import circleUser from '$lib/icons/solid/circle-user.svg?raw';
import clockRotateLeft from '$lib/icons/solid/clock-rotate-left.svg?raw';
import comments from '$lib/icons/solid/comments.svg?raw';
import gear from '$lib/icons/solid/gear.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import list from '$lib/icons/solid/list.svg?raw';
import memo from '$lib/icons/solid/memo.svg?raw';
import moon from '$lib/icons/solid/moon.svg?raw';
import pen from '$lib/icons/solid/pen.svg?raw';
import resetIcon from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import check from '$lib/icons/solid/check.svg?raw';
import rocket from '$lib/icons/solid/rocket.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import userGroup from '$lib/icons/solid/user-group.svg?raw';
import { toast } from '$lib/components/toast/toast.svelte';
import type { DarkKnight } from '$lib/settings/DarkKnight';
import { saveSettings, type SaveSettingsResult } from '$lib/settings/saveSettings';
import { setDarkKnight } from '$lib/settings/setDarkKnight';
import { settingsRequest } from '$lib/settings/settingsRequest';
import { showsDark } from '$lib/settings/showsDark';
import type { SettingsBody } from '$lib/settings/SettingsBody';
import { traktUrls } from '$lib/traktUrls';
import { MediaQuery } from 'svelte/reactivity';
import HeaderHelp from './HeaderHelp.svelte';
import { headerLinkChoices } from './headerLinkChoices.ts';
import { headerLinkPrefs } from './headerLinkPrefs.ts';
import HeaderLinks from './HeaderLinks.svelte';
import HeaderMenu from './HeaderMenu.svelte';
import GettingStarted from '$lib/components/first-night/GettingStarted.svelte';
import HeaderSearch from './HeaderSearch.svelte';
import HeaderTint from './HeaderTint.svelte';
import type { HeaderUser } from './HeaderUser.ts';
import { reviewLinks } from './reviewLinks.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';
import { authStep } from '../../auth/authStep.svelte.ts';

interface Props {
  user: HeaderUser | null;
  /**
   * The viewer has a session but no user yet, so the bar stays signed in: the browser is renewing an expired token, or
   * the API rate limited the settings read.
   */
  renewing?: boolean;
  /** The `search_type` cookie, so SSR renders the search type picker's label. */
  searchType?: string;
  /** The viewer's saved Dark Knight setting, which the profile menu's "Dark Knight" item toggles. */
  darkKnight?: DarkKnight;
  /** Saves the toggled setting. The demo route passes one that doesn't touch the API. */
  save?: (body: SettingsBody) => Promise<SaveSettingsResult>;
  /** The member's own bar from the og-header cookie, in order. Null keeps the default links. */
  links?: readonly string[] | null;
}

const browserSave = (body: SettingsBody) =>
  saveSettings({
    request: settingsRequest(viewerFetch()),
    body,
  });

const {
  user,
  renewing = false,
  searchType,
  darkKnight: saved = 'false',
  save = browserSave,
  links: savedLinks = null,
}: Props = $props();

const signedIn = $derived(user !== null || renewing);
const choices = $derived(headerLinkChoices({ slug: user?.slug ?? null, signedIn }));
// What the bar shows now: the saved links until an edit changes them. A link that isn't on offer (Dashboard while
// signed out, or one og no longer has) drops out.
let linkIds = $derived(savedLinks ?? headerLinkPrefs.DEFAULTS);
const links = $derived(linkIds.flatMap((id) => choices.filter((choice) => choice.id === id)));
let editing = $state(false);

function changeLinks(ids: readonly string[]) {
  linkIds = ids;
  if (user) headerLinkPrefs.save(user.slug, ids);
}

afterNavigate(() => (editing = false));

const profileTabs = [
  { title: 'History', icon: clockRotateLeft },
  { title: 'Progress', icon: barsProgress },
  { title: 'Library', icon: collection, large: true },
  { title: 'Ratings', icon: heart },
  { title: 'Lists', icon: list },
  { title: 'Watchlist', icon: bookmark },
  { title: 'Comments', icon: comments, small: true },
  { title: 'Notes', icon: memo },
  { title: 'Network', icon: userGroup, small: true },
];
const profileLinks = $derived(
  user
    ? [
      { title: 'Profile', icon: circleUser, href: `/users/${user.slug}` },
      ...profileTabs.map((tab) => ({ ...tab, href: `/users/${user.slug}/${tab.title.toLowerCase()}` })),
    ]
    : [],
);
// reviewLinks lists the year, then the month.
const reviews = $derived(
  user
    ? reviewLinks({ slug: user.slug, now: new Date() }).map((link, index) => ({
      ...link,
      icon: index === 0 ? chartColumn : calendarDays,
    }))
    : [],
);

// A profile menu row is the page you're on when the path is its own or under it (`/watchlist/movies`). The profile
// row matches only itself, or it would claim every tab.
const here = (href: string, exact: boolean) => {
  const path = page.url.pathname;
  return path === href || (!exact && path.startsWith(`${href}/`)) ? 'page' : undefined;
};

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

<header class={['top-nav', { editing }]}>
  <HeaderTint />
  <a class="logo" href="/"><img src={logo} alt="Trakt" width="34" height="34" /></a>

  <!-- The magnifier sits with the links, as far from Dashboard as the links are from each other. -->
  <div class="sections">
    <HeaderSearch savedType={searchType} viewer={user?.slug ?? null} />

    <HeaderLinks {links} {choices} {editing} onchange={changeLinks}
      oncustomize={user ? () => (editing = true) : undefined} name={user?.firstName} />
  </div>

  {#if editing}
    <div class="user">
      <button type="button" class="reset" onclick={() => changeLinks(headerLinkPrefs.DEFAULTS)}
        ><Icon svg={resetIcon} />Reset</button>
      <button type="button" class="done" onclick={() => (editing = false)}><Icon svg={check} />Done</button>
    </div>
  {:else}
  <div class="user">
    <HeaderHelp />
    {#if user}
      <GettingStarted slug={user.slug} named={user.named} joinedAt={user.joinedAt} />
      {#if !user.isVip}
        <a class="get-vip" href={traktUrls.vip} target="_blank" rel="noopener"><Icon svg={rocket} /> Get VIP</a>
      {/if}
      <div class={['profile', { vip: user.isVip }]}>
        <HeaderMenu label="{user.firstName}'s menu">
          {#snippet trigger()}<img class="avatar" src={user.avatarUrl} alt="" width="36" height="36" />{/snippet}
          <p class="heading">{user.displayName}</p>
          <ul>
            {#each profileLinks as link, index (link.href)}
              <li>
                <a href={link.href} aria-current={here(link.href, index === 0)}
                  class={{ small: 'small' in link, large: 'large' in link }}>
                  <Icon svg={link.icon} fixedWidth /> {link.title}
                </a>
              </li>
            {/each}
          </ul>
          <hr />
          <p class="heading">Stats</p>
          <ul>
            {#each reviews as link (link.href)}
              <li><a href={link.href} target="_blank" rel="noopener"><Icon svg={link.icon} fixedWidth /> {link.title}</a></li>
            {/each}
          </ul>
          <hr />
          <p class="heading">Trakt Account</p>
          <ul>
            {#if user.isVip}
              <li><a href={traktUrls.vip} target="_blank" rel="noopener"><Icon svg={rocket} fixedWidth /> Manage VIP</a></li>
            {/if}
            <li>
              <button type="button" class="dark-knight" role="switch" aria-checked={dark} onclick={toggleDarkKnight}>
                <Icon svg={moon} fixedWidth /> Dark Knight
              </button>
            </li>
            <li>
              <button type="button" onclick={() => (editing = true)}><Icon svg={pen} fixedWidth /> Customize Header</button>
            </li>
            <li><a href={traktUrls.settings} target="_blank" rel="noopener"><Icon svg={gear} fixedWidth /> Settings</a></li>
          </ul>
          <hr />
          <ul>
            <li>
              <a href="/signout" onclick={authStep.signOut}><Icon svg={arrowRightFromBracket} fixedWidth /> Sign Out</a>
            </li>
          </ul>
        </HeaderMenu>
      </div>
    {:else if !renewing}
      <!-- One page signs in and signs up, so one button. -->
      <a class="sign-in" href="/signin" onclick={authStep.signIn}>Sign In</a>
    {/if}
  </div>
  {/if}
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

  /* Editing, the bar grows to fit the chips' rows, over the top of the page, on the less see-through glass. Everything
     hangs from the top with the pill-tall rows centered where the bar's one row is, so the mark, the search and the
     buttons stay put; one row of chips is the bar's own height. */
  &.editing {
    align-items: start;
    block-size: auto;
    min-block-size: var(--header-height);
    padding-block: var(--space-header-editing);
    background: var(--color-header-panel);
  }
}

.logo {
  display: flex;
  margin-inline-end: var(--space-xs-inline);
  filter: var(--shadow-header-logo);
}

.sections {
  display: flex;
  align-items: center;
  gap: var(--gap-header-links);
  min-inline-size: 0;

  .editing & {
    align-items: start;
  }
}

/* Editing, Reset and Done sit as far apart as the bar's edge is from them, like the chips. */
.editing .user {
  gap: var(--space-header-editing);
}

/* The account, pushed to the far end. */
.user {
  display: flex;
  align-items: center;
  gap: var(--space-header-user);
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

/* Get VIP is a link pill like the main nav's, in the Trakt brand violet. */
.get-vip {
  block-size: var(--header-pill-height);
  border-radius: var(--radius-header-pill);
  background-color: var(--brand-violet);
  color: var(--color-text-inverse);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-violet-darken);
    color: var(--color-text-inverse);
  }
}

/* Editing: Reset, an outlined button like the filters panel's, and Done in list management's green, pill tall so they
   line up with the chips. */
.reset,
.done {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--header-pill-height);
  min-block-size: 0;
  padding-inline: var(--space-header-pill-inline);
  border: 1px solid var(--color-header-chip-edge);
  border-radius: var(--radius-header-pill);
  background-color: var(--color-header-chip-bg);
  color: var(--color-header-text);
  font: inherit;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.reset:is(:hover, :focus-visible) {
  background-color: var(--color-header-pill);
}

.done {
  border-color: var(--color-mode-done-border);
  background-color: var(--color-mode-done-bg);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-mode-done);
    background-color: var(--color-mode-done-bg-hover);
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

/* Dark Knight on: blue on a blue tint, hovered or not. */
.profile .dark-knight[aria-checked='true'] {
  background-color: var(--color-dark-knight-on-bg);
  color: var(--color-dark-knight-on);
  font-weight: var(--font-weight-headings-heavy);
}

@media (prefers-reduced-motion: reduce) {
  .get-vip,
  .sign-in,
  .reset,
  .done {
    transition: none;
  }
}
</style>
