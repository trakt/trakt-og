<!--
  `/help`: where each kind of question goes. og's bugs and ideas go to GitHub, in public, so they come first, as the
  about page's cards, then GitHub Discussions for questions and open-ended talk about og. Account, VIP, billing and sync questions go to Trakt support, privately, and the community is on
  r/trakt. Dark header in both themes; the rest follows the viewer's theme.
-->
<script lang="ts">
import AboutAsk from '$lib/about/AboutAsk.svelte';
import type { AboutGithub } from '$lib/about/github/fetchAboutGithub';
import { ogRepoUrls } from '$lib/about/ogRepoUrls';
import type { AboutScene } from '$lib/about/scenes/AboutScene';
import TraktLogoMark from '$lib/components/brand/TraktLogoMark.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import Icon from '$lib/icons/Icon.svelte';
import githubMark from '$lib/icons/brands/github.svg?raw';
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
    content="Get help with OG Redux: report a bug, suggest a feature or join the discussion on GitHub, reach Trakt support about your account, VIP or syncing, and talk with other members on r/trakt."
  />
</svelte:head>

<div class="help">
  <HelpHero scene={data.scene} {github} {lines} {loading} />
  <div class="content">
    <AboutAsk />
    <HelpBanner id="help-discussions" tint="var(--color-site-github)" title="Talk about OG Redux">
      {#snippet mark()}<span class="disc github"><Icon svg={githubMark} /></span>{/snippet}
      Have a question, an idea that isn't a feature request yet, or something you made with og? Start a thread in
      <b>GitHub Discussions</b> and talk it through with the team and other members.
      {#snippet actions()}
        <LinkButton href={ogRepoUrls.discussions} arrow={false}><Icon svg={githubMark} /> Discussions</LinkButton>
      {/snippet}
    </HelpBanner>
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
      {#snippet mark()}<span class="disc reddit"><Icon svg={redditAlien} /></span>{/snippet}
      The Trakt community lives on <b>r/trakt</b>. Ask how others use Trakt, share your lists and hear about changes
      first.
      {#snippet actions()}
        <LinkButton href={traktUrls.reddit} arrow={false}><Icon svg={redditAlien} /> r/trakt</LinkButton>
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

/* A brand's own round mark: its glyph in white on its color's disc. */
.disc {
  display: grid;
  place-items: center;
  block-size: 100%;
  border-radius: 50%;
  color: var(--color-text-inverse);
  font-size: var(--help-mark-glyph);
}

.github {
  background: var(--color-site-github);
}

.reddit {
  background: var(--color-site-reddit);
}
</style>
