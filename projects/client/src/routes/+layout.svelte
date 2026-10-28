<script lang="ts">
import '$lib/styles/fonts.css';
import '$lib/styles/tokens.css';
import '$lib/styles/base.css';
import figtreeLatin from '$lib/assets/fonts/figtree-latin.woff2';
import { invalidateAll } from '$app/navigation';
import { navigating, page } from '$app/state';
import { isStandardApi } from '$lib/api/isStandardApi';
import { logHidden } from '$lib/api/logHidden';
import { AUTH_SCENES } from '$lib/auth/authScenes';
import { authStep } from '$lib/auth/authStep.svelte';
import { isAuthStepRoute } from '$lib/auth/isAuthStepRoute';
import { syncSession } from '$lib/auth/syncSession';
import { userManager } from '$lib/auth/userManager';
import CheckinDialog from '$lib/components/checkin/CheckinDialog.svelte';
import DropNoteDialog from '$lib/components/visibility/DropNoteDialog.svelte';
import Rating10 from '$lib/extras/rating-10.svelte';
import { startCommentReactions } from '$lib/components/comments/startCommentReactions';
import Footer from '$lib/components/footer/Footer.svelte';
import Header from '$lib/components/header/Header.svelte';
import MobileSplash from '$lib/components/mobile-splash/MobileSplash.svelte';
import { TOO_SMALL_FOR_OG } from '$lib/components/mobile-splash/tooSmallForOg';
import HyperspaceLoader from '$lib/components/loading/HyperspaceLoader.svelte';
import NavigationProgress from '$lib/components/loading/NavigationProgress.svelte';
import Toaster from '$lib/components/toast/Toaster.svelte';
import Nudges from '$lib/components/first-night/Nudges.svelte';
import OfflineGuard from '$lib/errors/OfflineGuard.svelte';
import WatchNowHost from '$lib/components/watchnow/WatchNowHost.svelte';
import { startOverlay } from '$lib/overlay/startOverlay';
import { toDarkKnight } from '$lib/settings/toDarkKnight';
import { toTheme } from '$lib/settings/toTheme';
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

onMount(() => {
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
      <Header user={data.user} renewing={data.tokenExpired || data.rateLimited} searchType={data.searchType} {darkKnight} />
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
