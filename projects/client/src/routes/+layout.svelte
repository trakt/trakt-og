<script lang="ts">
import '$lib/styles/tokens.css';
import '$lib/styles/base.css';
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import { isStandardApi } from '$lib/api/isStandardApi';
import { logHidden } from '$lib/api/logHidden';
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
import Toaster from '$lib/components/toast/Toaster.svelte';
import Nudges from '$lib/components/first-night/Nudges.svelte';
import OfflineGuard from '$lib/errors/OfflineGuard.svelte';
import WatchNowHost from '$lib/components/watchnow/WatchNowHost.svelte';
import { startOverlay } from '$lib/overlay/startOverlay';
import { toDarkKnight } from '$lib/settings/toDarkKnight';
import { toTheme } from '$lib/settings/toTheme';
import { onMount } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

let { children, data } = $props();

// The coming-soon placeholder at `/` and the design-system demos draw their own page.
const bare = $derived(page.route.id === '/' || page.route.id?.startsWith('/_design'));
// An error page fills the screen on its own, without the header and footer.
const errored = $derived(!!page.error);

// The server renders the saved theme onto <html> (hooks.server.ts); this keeps it in step when the settings reload.
// The demos pick their own theme.
const darkKnight = $derived(toDarkKnight(data.settings));
const theme = $derived(toTheme(darkKnight));
$effect(() => {
  if (!bare) document.documentElement.dataset.theme = theme;
});

// Behind the mobile splash the app doesn't render or start at all: never on a phone (the server knows from its user
// agent), and in a narrow window only once it's wide enough.
const tooSmall = new MediaQuery(TOO_SMALL_FOR_OG, data.phone);
const showApp = $derived(!bare && !tooSmall.current);
let stopApp: (() => void) | undefined;

$effect(() => {
  if (!showApp || stopApp) return;
  const manager = userManager();
  const stops = [startOverlay(manager), startCommentReactions(manager)];
  stopApp = () => stops.forEach((stop) => stop());
});

onMount(() => {
  if (isStandardApi()) logHidden('Where to Watch, streaming filters and services, the Social Feed and list collaborators');
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

{#if bare}
  {@render children()}
{:else}
  <MobileSplash platform={data.platform} phone={data.phone}>
    {#if showApp}
      {#if !errored}
        <a class="skip" href="#content">Skip to content</a>
        <Header user={data.user} renewing={data.tokenExpired || data.rateLimited} searchType={data.searchType} {darkKnight} />
      {/if}
      <main id="content" tabindex="-1">
        {@render children()}
      </main>
      {#if !errored}<Footer />{/if}
    {/if}
  </MobileSplash>
{/if}
<Toaster />
{#if showApp}<OfflineGuard />{/if}
{#if data.user && showApp}
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
