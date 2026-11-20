<script lang="ts">
import { afterNavigate, invalidateAll } from '$app/navigation';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import { trackUpsellImpression } from '#lib/analytics/trackUpsellImpression.ts';
import { page } from '$app/state';
import logo from '#lib/assets/trakt-logo-red.png';
import Icon from '#lib/icons/Icon.svelte';
import arrowRightFromBracket from '#lib/icons/solid/arrow-right-from-bracket.svg?raw';
import barsProgress from '#lib/icons/solid/bars-progress.svg?raw';
import bookmark from '#lib/icons/solid/bookmark.svg?raw';
import calendarDays from '#lib/icons/solid/calendar-days.svg?raw';
import chartColumn from '#lib/icons/solid/chart-column.svg?raw';
import circleUser from '#lib/icons/solid/circle-user.svg?raw';
import clockRotateLeft from '#lib/icons/solid/clock-rotate-left.svg?raw';
import comments from '#lib/icons/solid/comments.svg?raw';
import gear from '#lib/icons/solid/gear.svg?raw';
import heart from '#lib/icons/solid/heart.svg?raw';
import list from '#lib/icons/solid/list.svg?raw';
import memo from '#lib/icons/solid/memo.svg?raw';
import moon from '#lib/icons/solid/moon.svg?raw';
import resetIcon from '#lib/icons/regular/arrow-rotate-left.svg?raw';
import check from '#lib/icons/solid/check.svg?raw';
import rocket from '#lib/icons/solid/rocket.svg?raw';
import collection from '#lib/icons/trakt/collection-thick.svg?raw';
import userGroup from '#lib/icons/solid/user-group.svg?raw';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import type { DarkKnight } from '#lib/settings/DarkKnight.ts';
import { saveSettings, type SaveSettingsResult } from '#lib/settings/saveSettings.ts';
import { setDarkKnight } from '#lib/settings/setDarkKnight.ts';
import { settingsRequest } from '#lib/settings/settingsRequest.ts';
import { showsDark } from '#lib/settings/showsDark.ts';
import type { SettingsBody } from '#lib/settings/SettingsBody.ts';
import { traktUrls } from '#lib/traktUrls.ts';
import { canSeeLive } from '#lib/live/canSeeLive.ts';
import { MediaQuery } from 'svelte/reactivity';
import HeaderHelp from './HeaderHelp.svelte';
import HeaderWatching from './HeaderWatching.svelte';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { headerLinkChoices } from './headerLinkChoices.ts';
import { headerLinkPrefs } from './headerLinkPrefs.ts';
import HeaderLinks from './HeaderLinks.svelte';
import HeaderMenu from './HeaderMenu.svelte';
import GettingStarted from '#lib/components/first-night/GettingStarted.svelte';
import HeaderSearch from './HeaderSearch.svelte';
import HeaderTint from './HeaderTint.svelte';
import type { HeaderUser } from './HeaderUser.ts';
import { offerLines } from '#lib/promotions/promotionCopy.ts';
import type { Promotion } from '#lib/promotions/Promotion.ts';
import PromotionTag from '#lib/promotions/PromotionTag.svelte';
import { reviewLinks } from './reviewLinks.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';
import { authStep } from '../../auth/authStep.svelte.ts';
import { signInHref } from '../../auth/signInHref.ts';

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
  /** What the member is checked in to or scrobbling, for the dot left of Help. */
  watching?: WatchingNow | null;
  /** The offer running now. The Get VIP pill shows it in place of the plain label. */
  promotion?: Promotion | null;
  }

  const { track: trackVipUpsell } = useTrack(AnalyticsEvent.VipUpsell);

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
  watching = null,
  promotion = null,
  }: Props = $props();

  const vipSource = $derived(promotion ? `promotion-${promotion.id}` : 'navbar');
  const vipHref = $derived(promotion ? traktUrls.vipPromotion(promotion) : traktUrls.vipFor('navbar'));

  const signedIn = $derived(user !== null || renewing);
  const choices = $derived(
    headerLinkChoices({ slug: user?.slug ?? null, signedIn, live: canSeeLive(user) }),
  );
  // What the bar shows now: the saved links until an edit changes them. A link that isn't on offer (Dashboard while
  // signed out, or one og no longer has) drops out.
  let linkIds = $derived(savedLinks ?? headerLinkPrefs.DEFAULTS);
  const links = $derived(linkIds.flatMap((id) => choices.filter((choice) => choice.id === id)));
  let editing = $state(false);

  function changeLinks(ids: readonly string[]) {
    linkIds = ids;
    if (user) headerLinkPrefs.save(user.slug, ids);
  }

  // The links' pencil fades in while the mouse is anywhere on the bar.
  let hovering = $state(false);
  const trackHover = (bar: HTMLElement) => {
    const enter = (event: PointerEvent) => (hovering = event.pointerType === 'mouse');
    const leave = () => (hovering = false);
    bar.addEventListener('pointerenter', enter);
    bar.addEventListener('pointerleave', leave);
    return () => {
      bar.removeEventListener('pointerenter', enter);
      bar.removeEventListener('pointerleave', leave);
    };
  };

  afterNavigate(({ shallow, type }) => {
    if (shallow && type === 'goto') return;

    return editing = false;
  });

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
    : []);

  const reviews = $derived(user
    ? reviewLinks({ slug: user.slug, now: new Date() }).map((link, index) => ({ ...link, icon: index === 0 ? chartColumn : calendarDays }))
    : []);

  const here = (href: string, exact: boolean) => {
    const path = page.url.pathname;
    return path === href || !exact && path.startsWith(`${href}/`) ? 'page' : undefined;
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

<!--
  The fixed top bar, on dark glass tinted by the page's backdrop (HeaderTint): the Trakt mark, the search icon and the
  main links on the left, and on the right what the member is watching (HeaderWatching), the help menu and the account: Get VIP and the profile menu, or one Sign
  In button.
  While an expired session renews, it keeps the signed-in links and leaves the account empty until the user loads.
  A member picks their own links: the pencil after them, which fades in while the mouse is on the bar, turns the bar
  into an editor (HeaderLinks),
  with Reset (back to the default links) and a green Done, list management's, in place of the account. Each change saves to this browser (headerLinkPrefs).
-->
<!-- Links point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<header class={['top-nav', { editing }]} {@attach trackHover}>
  <HeaderTint />
  <a class="logo" href="/"><img src={logo} alt="Trakt" width="34" height="34" /></a>

  <!-- The magnifier sits with the links, as far from Dashboard as the links are from each other. -->
  <div class="sections">
    <HeaderSearch savedType={searchType} viewer={user?.slug ?? null} />

    <HeaderLinks
      links={links}
      choices={choices}
      editing={editing}
      onchange={changeLinks}
      oncustomize={user ? () => editing = true : undefined}
      reveal={hovering}
      name={user?.firstName}
    />
  </div>

  {#if editing}
    <div class="user">
      <button type="button" class="reset" onclick={() => changeLinks(headerLinkPrefs.DEFAULTS)}
      ><Icon svg={resetIcon} />Reset</button>

      <button
        type="button"
        class="done"
        onclick={() => editing = false}
      ><Icon svg={check} />Done</button>
    </div>
  {:else}
    {#snippet getVip()}
      <a class={['get-vip', { offer: promotion }]} href={vipHref} target="_blank" rel="noopener"
        onclick={() => trackVipUpsell({ source: vipSource })} {@attach trackUpsellImpression(vipSource)}>
        {#if promotion}
          {@const lines = offerLines(promotion)}
          <PromotionTag label={promotion.name} />
          <span class="offer-lines">
            <span>{lines.term} of <strong>VIP</strong></span>
            <span>for only <strong>{lines.price}</strong></span>
          </span>
        {:else}
          <Icon svg={rocket} /> Get VIP
        {/if}
      </a>
    {/snippet}
    <!-- Cancelling a check-in from the watching card puts focus on the next control here (Help). -->
    <div class="user" data-refocus>
      {#if user && watching}<HeaderWatching {watching} />{/if}
      <HeaderHelp />
      {#if user}
      <GettingStarted slug={user.slug} named={user.named} joinedAt={user.joinedAt} />
        {#if !user.isVip}{@render getVip()}{/if}
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
              <li><a href={traktUrls.vipFor('profile-settings-manage')} target="_blank" rel="noopener"><Icon svg={rocket} fixedWidth /> Manage VIP</a></li>
              {/if}
              <li>
              <button type="button" class="dark-knight" role="switch" aria-checked={dark} onclick={toggleDarkKnight}>
                <Icon svg={moon} fixedWidth /> Dark Knight
              </button>
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
        {@render getVip()}
        <!-- One page signs in and signs up, so one button. -->
      <a class="sign-in" href={signInHref(page.url)} onclick={authStep.signIn('navbar')}>Sign In</a>
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

/* Get VIP and Sign In are link pills like the main nav's: the same height, corners and padding. */
.get-vip,
.sign-in {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--header-pill-height);
  padding-inline: var(--space-header-pill-inline);
  border-radius: var(--radius-header-pill);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
}

  /* Get VIP is in the Trakt brand violet. */
  .get-vip {
    background-color: var(--brand-violet);
    color: var(--color-text-inverse);

    &:is(:hover, :focus-visible) {
      background-color: var(--brand-violet-darken);
      color: var(--color-text-inverse);
    }
  }

  /* With an offer the pill takes a violet gradient whose glow breathes. The white tag sits inset by a thin violet
     edge, and the offer runs on two short lines so the pill stays as tall as the others. */
  .get-vip.offer {
    align-items: stretch;
    padding-block: var(--promotion-tag-inset);
    padding-inline-start: var(--promotion-tag-inset);
    background: var(--color-promotion-pill);
    animation: offer-glow var(--promotion-glow-duration) ease-in-out infinite;

    &:is(:hover, :focus-visible) {
      background: var(--color-promotion-pill-hover);
    }
  }

  .offer-lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: var(--font-size-promotion-pill);
    font-weight: var(--font-weight-headings-light);
    line-height: 1.05;

    strong {
      font-weight: var(--font-weight-headings-heavy);
    }
  }

  @keyframes offer-glow {
    0%,
    100% {
      box-shadow: 0 0 0 0 transparent;
    }

    50% {
      box-shadow: 0 0 var(--promotion-glow-blur) var(--promotion-glow-spread) var(--color-promotion-glow);
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
  .profile .dark-knight[aria-checked="true"] {
    background-color: var(--color-dark-knight-on-bg);
    color: var(--color-dark-knight-on);
    font-weight: var(--font-weight-headings-heavy);
  }

  @media (prefers-reduced-motion: reduce) {
    .get-vip.offer {
      animation: none;
    }

    .get-vip,
    .sign-in,
    .reset,
    .done {
      transition: none;
    }
  }
</style>
