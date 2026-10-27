<!--
  `/help`: where each kind of question goes. og's bugs and ideas go to GitHub, in public, so they come first, as the
  about page's cards. Account, VIP, billing and sync questions go to Trakt support, privately, and the community is on
  r/trakt. Dark header in both themes; the rest follows the viewer's theme.
-->
<script lang="ts">
import AboutAsk from '$lib/about/AboutAsk.svelte';
import type { AboutGithub } from '$lib/about/github/fetchAboutGithub';
import type { AboutScene } from '$lib/about/scenes/AboutScene';
import TraktLogoMark from '$lib/components/brand/TraktLogoMark.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import Icon from '$lib/icons/Icon.svelte';
import redditAlien from '$lib/icons/brands/reddit-alien.svg?raw';
import envelope from '$lib/icons/solid/envelope.svg?raw';
import lifeRing from '$lib/icons/solid/life-ring.svg?raw';
import spaceStationMoon from '$lib/icons/solid/space-station-moon.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import HelpBanner from './HelpBanner.svelte';
import HelpHero from './HelpHero.svelte';

interface Props {
  data: {
    /** Streams in after the page; null when GitHub can't be read. */
    github: Promise<AboutGithub | null>;
    scene: AboutScene['key'];
  };
}

const { data }: Props = $props();

let github = $state<AboutGithub | null>(null);
let loading = $state(true);

$effect(() => {
  const pending = data.github;
  void pending.then((read) => {
    if (pending !== data.github) return;
    github = read;
    loading = false;
  });
});

const lines = $derived(github?.commits.map(({ sha, subject }) => `${sha} ${subject}`) ?? []);
</script>

<svelte:head>
  <title>Help - Trakt</title>
  <meta
    name="description"
    content="Get help with OG Redux: report a bug or suggest a feature on GitHub, reach Trakt support about your account, VIP or syncing, and talk with other members on r/trakt."
  />
</svelte:head>

<div class="help">
  <HelpHero scene={data.scene} {github} {lines} {loading} />
  <div class="content">
    <AboutAsk />
    <HelpBanner id="help-account" tint="var(--brand-violet)" title="Your account lives on Trakt">
      {#snippet mark()}<TraktLogoMark disc />{/snippet}
      Questions about your account, VIP, billing, syncing or Plex go to <b>Trakt support</b>, privately. GitHub is
      public, so never post your email or account details there.
      {#snippet actions()}
        <LinkButton href={traktUrls.support} arrow={false}><Icon svg={lifeRing} /> Help center</LinkButton>
        <LinkButton href={traktUrls.help} variant="outline"><Icon svg={envelope} /> Email support</LinkButton>
        <LinkButton href={traktUrls.status} variant="outline" arrow={false}>
          <Icon svg={spaceStationMoon} /> Service status
        </LinkButton>
      {/snippet}
    </HelpBanner>
    <HelpBanner id="help-community" tint="var(--color-site-reddit)" title="Talk with other members">
      {#snippet mark()}<span class="reddit"><Icon svg={redditAlien} /></span>{/snippet}
      The Trakt community lives on <b>r/trakt</b>. Ask how others use Trakt, share your lists and hear about changes
      first.
      {#snippet actions()}
        <LinkButton href={traktUrls.reddit} arrow={false}><Icon svg={redditAlien} /> Visit r/trakt</LinkButton>
      {/snippet}
    </HelpBanner>
  </div>
</div>

<style>
.help {
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
}

.content {
  container-type: inline-size;
  display: grid;
  gap: var(--gutter);
  padding-block: var(--about-api-space);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
}

/* Reddit's own round mark: the alien in white on its orange disc. */
.reddit {
  display: grid;
  place-items: center;
  block-size: 100%;
  border-radius: 50%;
  background: var(--color-site-reddit);
  color: var(--color-text-inverse);
  font-size: var(--help-reddit-glyph);
}
</style>
