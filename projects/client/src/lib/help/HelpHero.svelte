<!--
  The help page's header: where each kind of question goes, over one of three films about sending a signal and getting
  an answer, with a title that quotes it. The server picks it, so the title is in the first paint. The copy stays on
  the left so the scene plays on the right. The repo's open and closed issues sit under it, shimmering in
  their places until GitHub answers.
-->
<script lang="ts">
import type { AboutGithub } from '$lib/about/github/fetchAboutGithub';
import { playScene } from '$lib/about/playScene';
import type { AboutScene } from '$lib/about/scenes/AboutScene';
import { toAboutCounts } from '$lib/about/toAboutCounts';
import ProjectLink from '$lib/components/brand/ProjectLink.svelte';
import Signpost from '$lib/components/signpost/Signpost.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { helpScenes } from './scenes/helpScenes.ts';

interface Props {
  scene: AboutScene['key'];
  /** The repo's GitHub numbers, null until they load in the browser. */
  github: AboutGithub | null;
  /** Recent changes as `sha type(scope): subject`, for mission control's resolved rows. */
  lines: readonly string[];
  loading: boolean;
}

const { scene: key, github, lines, loading }: Props = $props();

/** The about header's open and closed shimmers, as wide as their pills. */
const SHIMMERS = [4, 5];

const counts = $derived(toAboutCounts(github, ['open', 'closed']));

const picked = $derived(helpScenes.find(({ scene }) => scene.key === key) ?? helpScenes[0]);
</script>

<section class="hero" aria-labelledby="help-title">
  {#if picked}
    <canvas aria-hidden="true" {@attach playScene({ scene: picked.scene, lines, still: prefersReducedMotion.current })}
    ></canvas>
  {/if}

  <p class="kicker"><Signpost /> Help</p>
  <h1 id="help-title">{picked?.lead ?? 'Stuck?'} <em>{picked?.accent ?? 'We can help.'}</em></h1>
  <p class="lede">
    Bugs and ideas for <ProjectLink kind="og">OG Redux</ProjectLink> go to <ProjectLink kind="github">GitHub</ProjectLink>,
    where the team works in the open. Anything about your <b>Trakt account</b>, VIP or syncing goes to Trakt support,
    privately.
  </p>
  {#if loading}
    <span class="shimmers" aria-label="Loading the repo's issues">
      {#each SHIMMERS as n (n)}
        <Shimmer inline="var(--about-count-shimmer-{n})" block="var(--about-count-shimmer-height)" />
      {/each}
    </span>
  {:else if counts.length > 0}
    <TagPills tags={counts} large />
  {/if}
</section>

<style>
/* Dark in either theme, over its scene, like the about page's header. */
.hero {
  color-scheme: dark;
  color: var(--color-home-text);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  justify-items: start;
  padding-block: calc(var(--header-height) + var(--about-hero-top)) var(--about-hero-bottom);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  border-block-end: 1px solid var(--color-home-line);
  background-color: var(--color-about-hero-bg);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--about-hero-shade);
  }
}

canvas {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
}

.kicker {
  display: flex;
  align-items: center;
  gap: var(--about-repo-gap);
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  color: var(--color-home-text);
}

h1 {
  margin-block: var(--about-title-space);
  font-size: var(--font-size-about-title);
  font-weight: var(--font-weight-home-display);
  line-height: 1;
  letter-spacing: var(--letter-spacing-about-title);
  text-wrap: balance;
  color: var(--color-home-text);

  & em {
    font-style: normal;
    color: var(--brand-primary);
  }
}

.lede {
  max-inline-size: var(--about-lede-width);
  margin: 0 0 var(--about-stats-space);
  font-size: var(--font-size-lede);
  line-height: var(--line-height-lede);
  color: var(--color-home-soft);

  & > b {
    color: var(--color-lede-link);
  }
}
.shimmers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tag-pill-large-gap);
}
</style>
