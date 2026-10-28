<!--
  The page loader as lists and progress pages show it, the line along the top while the next page loads, the starfield while og signs in or out, the shimmering bars
  that hold a number's or a name's place on the home page, the shimmering cards that hold a dashboard panel's place,
  and a picker's shimmering option rows.
-->
<script lang="ts">
import { AUTH_FAILURE_MESSAGE } from '$lib/auth/authFailure';
import { AUTH_SCENES } from '$lib/auth/authScenes';
import HyperspaceLoader from '$lib/components/loading/HyperspaceLoader.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import NavigationProgress from '$lib/components/loading/NavigationProgress.svelte';
import CardShimmerRow from '$lib/components/loading/CardShimmerRow.svelte';
import OptionRowShimmers from '$lib/components/loading/OptionRowShimmers.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import DemoToggle from '$lib/design/DemoToggle.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';

let leaving = $state(true);
</script>

<Specimen title="Page loader" bleed
  note="LoadingOverlay over a list while it loads or saves: TraktLoader at 64px on the backdrop. Red rises in a wave until the disc is full, then drains. With the OS set to reduce motion, the mark breathes instead.">
  <div class="viewport">
    <LoadingOverlay visible />
  </div>
</Specimen>

<Specimen title="Navigation progress" bleed
  note="NavigationProgress along the top of the window, over the header, while the next page's data loads. It waits 150ms, so a quick page never shows it, then creeps toward the end. Turn Loading off and it runs to the end and fades; turn it on and it waits again. With the OS set to reduce motion, it fades in at full width and holds still.">
  <div class="knob"><DemoToggle bind:checked={leaving}>Loading</DemoToggle></div>
  <div class="viewport header"><NavigationProgress active={leaving} /></div>
</Specimen>

<Specimen title="Sign-in loader"
  note="HyperspaceLoader on /signin, /callback and /signout, and over the page when Sign In or Sign Out is clicked, with a Han Solo line for each step. Stars stream out from behind the mark as it signs in and fall back into it as it signs out, easing up to a slow cruise. When a step fails, its notice sits under the line. With the OS set to reduce motion, the stars hold still.">
  <Variant label="Signing in">
    <div class="viewport"><HyperspaceLoader {...AUTH_SCENES.signIn} /></div>
  </Variant>
  <Variant label="Signing out">
    <div class="viewport"><HyperspaceLoader {...AUTH_SCENES.signOut} reverse /></div>
  </Variant>
  <Variant label="Rate limited on the way back">
    <div class="viewport">
      <HyperspaceLoader {...AUTH_SCENES.return}>
        <p class="notice">{AUTH_FAILURE_MESSAGE.return.rateLimited} Trying again in 24s.</p>
      </HyperspaceLoader>
    </div>
  </Variant>
</Specimen>

<Specimen title="Shimmer" row note="Holds a flag's, a name's or a pill's place on the home page while it loads.">
  <Variant label="Flag">
    <span class="home"><Shimmer inline="var(--home-flag-size)" block="var(--home-flag-size)" round /></span>
  </Variant>
  <Variant label="Name">
    <span class="home">
      <Shimmer inline="var(--home-rank-shimmer-name-width)" block="var(--font-size-home-rank-name)" />
    </span>
  </Variant>
  <Variant label="Pill">
    <span class="home">
      <Shimmer inline="var(--home-live-shimmer-pill-width)" block="var(--home-live-shimmer-pill-height)" />
    </span>
  </Variant>
</Specimen>

<Specimen title="Card shimmer"
  note="CardShimmerRow while a dashboard panel streams in: one row of the panel's cards, posters with their titles or fanart with the art's own. Narrow the window and it stays one row.">
  <Variant label="Posters, as Up Next, Watchlist and the Social Feed load">
    <CardShimmerRow columns={6} ratio="poster" />
  </Variant>
  <Variant label="Fanart, as Recently Watched loads">
    <CardShimmerRow columns={3} phoneColumns={1} ratio="fanart" />
  </Variant>
</Specimen>

<Specimen title="Option row shimmers" row
  note="OptionRowShimmers while a picker's options load, in the loaded rows' height so the list keeps its size.">
  <Variant label="A filters panel field, as Genres loads">
    <ul class="menu">
      <OptionRowShimmers rows={4} text="var(--font-size-menu)" height="var(--filter-option-shimmer-row)"
        inset="0 var(--filter-option-shimmer-inset)" gap="var(--filter-option-shimmer-gap)"
        before={[{ inline: 'var(--filter-option-shimmer-icon)', block: 'var(--filter-option-shimmer-icon)', round: true }]}
        after={{ inline: 'var(--filter-option-shimmer-icon)', block: 'var(--filter-option-shimmer-icon)', round: true }} />
    </ul>
  </Variant>
  <Variant label="The streaming filter, as its services load">
    <ul class="menu">
      <OptionRowShimmers rows={4} text="var(--font-size-menu)" inset="var(--space-service-row-padding)"
        gap="var(--space-service-row)"
        before={[{ inline: 'var(--service-mini-width)', block: 'var(--service-mini-height)' }]} />
    </ul>
  </Variant>
</Specimen>

<style>
/* Paint containment makes the overlay's fixed position fill this box instead of the window. */
.viewport {
  contain: paint;
  aspect-ratio: var(--ratio-fanart);
}

/* As tall and as dark as the header, which the line runs along on the site. */
.header {
  aspect-ratio: auto;
  block-size: var(--header-height);
  background-color: var(--color-frame);
}

.knob {
  padding: var(--design-canvas-padding);
}

.menu {
  inline-size: var(--filter-picker-width);
  margin: 0;
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
}

.notice {
  margin: 0;
}

.home {
  display: flex;
  padding: var(--gutter);
  border-radius: var(--radius-object);
  background-color: var(--color-home-bg);
}
</style>
