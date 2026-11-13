<script lang="ts">
import '#lib/styles/fonts.css';
import '#lib/styles/tokens.css';
import '#lib/styles/base.css';
import figtreeLatin from '#lib/assets/fonts/figtree-latin.woff2';
import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import Analytics from '#lib/analytics/Analytics.svelte';
import { navigating, page } from '$app/state';
import { isStandardApi } from '#lib/api/isStandardApi.ts';
import { logHidden } from '#lib/api/logHidden.ts';
import { AUTH_SCENES } from '#lib/auth/authScenes.ts';
import { authStep } from '#lib/auth/authStep.svelte.ts';
import { isAuthStepRoute } from '#lib/auth/isAuthStepRoute.ts';
import { isGuestGated } from '#lib/auth/isGuestGated.ts';
import { signInHref } from '#lib/auth/signInHref.ts';
import { syncSession } from '#lib/auth/syncSession.ts';
import { userManager } from '#lib/auth/userManager.ts';
import CheckinDialog from '#lib/components/checkin/CheckinDialog.svelte';
import DropNoteDialog from '#lib/components/visibility/DropNoteDialog.svelte';
import Rating10 from '#lib/extras/rating-10.svelte';
import HeaderExtras from '#lib/extras/HeaderExtras.svelte';
import { startCommentReactions } from '#lib/components/comments/startCommentReactions.ts';
import Footer from '#lib/components/footer/Footer.svelte';
import Header from '#lib/components/header/Header.svelte';
import MobileSplash from '#lib/components/mobile-splash/MobileSplash.svelte';
import { TOO_SMALL_FOR_OG } from '#lib/components/mobile-splash/tooSmallForOg.ts';
import HyperspaceLoader from '#lib/components/loading/HyperspaceLoader.svelte';
import NavigationProgress from '#lib/components/loading/NavigationProgress.svelte';
import Toaster from '#lib/components/toast/Toaster.svelte';
import Nudges from '#lib/components/first-night/Nudges.svelte';
import OfflineGuard from '#lib/errors/OfflineGuard.svelte';
import WatchNowHost from '#lib/components/watchnow/WatchNowHost.svelte';
import { startBrokenImages } from '#lib/images/brokenImageFallback.ts';
import { startOverlay } from '#lib/overlay/startOverlay.ts';
import { pollWatching } from '#lib/dashboard/pollWatching.ts';
import { fetchViewerWatching } from '#lib/users/fetchViewerWatching.ts';
import { viewerWatching } from '#lib/users/viewerWatching.svelte.ts';
import { browserTimeZone } from '#lib/settings/browserTimeZone.ts';
import { toDarkKnight } from '#lib/settings/toDarkKnight.ts';
import { toTheme } from '#lib/settings/toTheme.ts';
import { onMount, untrack } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

let { children, data } = $props();

// The design-system demos draw their own page, and the sign-in and sign-out steps show og's loader alone.
const bare = $derived(page.route.id?.startsWith('/_design') || isAuthStepRoute(page.route.id));
// An error page fills the screen on its own, without the header and footer.
const errored = $derived(!!page.error);
// The next page's data is loading, while this one stays up.
const leaving = $derived(navigating.to !== null);

// The server renders the saved theme onto <html> (hooks.server.ts); this keeps it in step when the settings reload.
// The demos pick their own theme.
const darkKnight = $derived(toDarkKnight(data.settings));
const theme = $derived(toTheme(darkKnight));
$effect(() => {
  if (!bare) document.documentElement.dataset.theme = theme;
});

// Every user agent gets the whole page, so a search engine's phone crawler indexes it. Under the mobile splash it's
// inert and the app's background work doesn't start: never on a phone (the server knows from its user agent, so
// hydration agrees with the server's HTML), and in a narrow window only once it's wide enough.
// A visit keeps its user agent, so reading `phone` once is enough.
const tooSmall = new MediaQuery(TOO_SMALL_FOR_OG, untrack(() => data.phone));
const awake = $derived(!bare && !tooSmall.current);
let stopApp: (() => void) | undefined;

$effect(() => {
  if (!awake || stopApp) return;
  const manager = userManager();
  const stops = [startOverlay(manager), startCommentReactions(manager)];
  stopApp = () => stops.forEach((stop) => stop());
});

// A page whose server load read what you're watching hands it over first, so the poll below doesn't ask again.
$effect.pre(() => {
  const seed = page.data.viewerWatching;
  if (seed !== undefined) viewerWatching.seed(seed);
});

// The header's watching dot: asked every 2 minutes while the tab shows, skipped when a page or a check-in just said.
const viewer = $derived(data.user?.slug ?? null);
$effect(() => {
  if (!awake || !viewer) return;
  return pollWatching({
    load: () => viewerWatching.refresh({ load: fetchViewerWatching, maxAge: 60_000 }),
    onupdate: () => {},
  });
});

onMount(startBrokenImages);

// A guest sees the page a link brought them to; clicking on to another signs them in first, then opens it
// (`isGuestGated`).
beforeNavigate((navigation) => {
  const { to } = navigation;
  if (!to || !isGuestGated({ hasSession: data.hasSession, navigation })) return;
  navigation.cancel();
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- signInHref builds og's own sign-in path
  void goto(signInHref(to.url));
});

onMount(() => {
  // The server only knows the browser's zone from its cookie, so a first visit, or one from a new zone, reloads the
  // data once to redo its dates.
  if (browserTimeZone.save() !== data.datePreferences.timeZone) void invalidateAll();
  if (isStandardApi()) logHidden('Watch Now, streaming filters and services, the Social Feed and list collaborators');
  const stopSession = syncSession({
    manager: userManager(),
    hasSession: data.hasSession,
    tokenExpired: data.tokenExpired,
    reload: invalidateAll,
  });

  return () => {
    stopSession();
    stopApp?.();
  };
});
</script>

<svelte:window onpageshow={(event) => event.persisted && authStep.clear()} />
<Analytics user={data.user} />

<svelte:head>
  <!-- Every page sets Latin text in Figtree first, so fetch it with the page instead of after the CSS. -->
  <link rel="preload" href={figtreeLatin} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{#if bare}
  {@render children()}
{:else}
  <MobileSplash platform={data.platform} phone={data.phone} covering={tooSmall.current}>
    <NavigationProgress active={leaving} />
    {#if !errored}
      <a class="skip" href="#content">Skip to content</a>
      <Header user={data.user} renewing={data.tokenExpired || data.rateLimited} searchType={data.searchType} {darkKnight}
        links={data.headerLinks} watching={viewerWatching.latest(page.data.viewerWatching ?? null)} />
    {/if}
    <main id="content" tabindex="-1" aria-busy={leaving || undefined}>
      {@render children()}
    </main>
    {#if !errored}<Footer />{/if}
  </MobileSplash>
{/if}
{#if authStep.current}
  <HyperspaceLoader {...AUTH_SCENES[authStep.current]} reverse={authStep.current === 'signOut'} />
{/if}
<Toaster />
{#if awake}<OfflineGuard />{/if}
{#if data.user && awake}
  <Nudges slug={data.user.slug} firstName={data.user.firstName} joinedAt={data.user.joinedAt} taste={{
    country: data.settings?.browsing?.watchnow?.country?.toLowerCase() || 'us',
    services: data.settings?.browsing?.watchnow?.favorites ?? [],
    genres: data.settings?.browsing?.genres?.favorites ?? [],
  }} />
{/if}
<WatchNowHost />
<CheckinDialog />
<Rating10 />
<HeaderExtras />
<DropNoteDialog />

<style>
/* Off-screen until focused, then over the fixed header's logo. */
.skip {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: calc(var(--z-header) + 1);
  padding: var(--space-lg-block) var(--space-lg-inline);
  background: var(--color-surface);
  translate: 0 -100%;

  &:focus {
    translate: none;
  }
}

main:focus {
  outline: none;
}
</style>
