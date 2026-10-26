<!--
  The about page's header, laid out like the repo's GitHub page: the repo line, the title, what OG Redux is and the
  repo's counts on the left, a terminal with the README's commands to run it locally on the right. Behind it, one of three
  film-inspired scenes, picked in the browser so the server render and the first paint agree; until then, a quiet red
  glow.
-->
<script lang="ts">
import ProjectLink from '$lib/components/brand/ProjectLink.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import Icon from '$lib/icons/Icon.svelte';
import githubMark from '$lib/icons/brands/github.svg?raw';
import circleCheck from '$lib/icons/regular/circle-check.svg?raw';
import circleDot from '$lib/icons/regular/circle-dot.svg?raw';
import codeCommit from '$lib/icons/regular/code-commit.svg?raw';
import codeFork from '$lib/icons/regular/code-fork.svg?raw';
import star from '$lib/icons/regular/star.svg?raw';
import { prefersReducedMotion } from 'svelte/motion';
import type { AboutGithub } from './github/fetchAboutGithub.ts';
import { ogRepoUrls } from './ogRepoUrls.ts';
import { playScene } from './playScene.ts';
import type { AboutScene } from './scenes/AboutScene.ts';
import { aboutScenes } from './scenes/aboutScenes.ts';

interface Props {
  /** The repo's GitHub numbers, null until they load in the browser. */
  github: AboutGithub | null;
  /** Recent changes as `sha type(scope): subject`, for the terminal scene. */
  lines: readonly string[];
  /** GitHub is still answering: the counts shimmer in their places, so the page doesn't move when they land. */
  loading: boolean;
}

const { github, lines, loading }: Props = $props();

/** One shimmer per count, each as wide as its pill: stars, forks, commits, open and closed. */
const SHIMMERS = [1, 2, 3, 4, 5];

// The README's setup, after creating a Trakt app for its client ID.
const COMMANDS = [
  `git clone ${ogRepoUrls.clone}`,
  'cd trakt-og',
  'bun run install:frozen',
  'bun run client:setup [your client id]',
  'bun run client:dev',
];

let scene = $state<AboutScene | null>(null);
let copied = $state(false);

/** Picks the scene once the header is in the browser, so the server render and the first paint agree. */
const pickScene = () => {
  scene = aboutScenes[Math.floor(Math.random() * aboutScenes.length)] ?? null;
};

// GitHub's own colors for each count, each linking to that list on GitHub.
const counts = $derived([
  ...(github?.stars != null
    ? [{
      icon: star,
      tint: 'var(--color-github-star)',
      href: ogRepoUrls.stargazers,
      lead: github.stars.toLocaleString(),
      text: github.stars === 1 ? 'star' : 'stars',
    }]
    : []),
  ...(github?.forks != null
    ? [{
      icon: codeFork,
      tint: 'var(--color-github-forks)',
      href: ogRepoUrls.forks,
      lead: github.forks.toLocaleString(),
      text: github.forks === 1 ? 'fork' : 'forks',
    }]
    : []),
  ...(github?.commitCount
    ? [{
      icon: codeCommit,
      tint: 'var(--color-github-commits)',
      href: ogRepoUrls.commits,
      lead: github.commitCount.toLocaleString(),
      text: github.commitCount === 1 ? 'commit' : 'commits',
    }]
    : []),
  ...(github?.open
    ? [{
      icon: circleDot,
      tint: 'var(--color-github-open)',
      href: ogRepoUrls.openIssues,
      lead: github.open.total.toLocaleString(),
      text: github.open.total === 1 ? 'open issue' : 'open issues',
    }]
    : []),
  ...(github?.closed
    ? [{
      icon: circleCheck,
      tint: 'var(--color-github-closed)',
      href: ogRepoUrls.closedIssues,
      lead: github.closed.total.toLocaleString(),
      text: github.closed.total === 1 ? 'closed issue' : 'closed issues',
    }]
    : []),
]);

async function copyCommands() {
  await navigator.clipboard.writeText(COMMANDS.join('\n')).catch(() => undefined);
  copied = true;
}
</script>

<!-- The repo's links leave og, and resolve() only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section class="hero" aria-labelledby="about-title" data-shade={scene?.shade ?? 'quiet'} {@attach pickScene}>
  {#if scene}
    <canvas aria-hidden="true" {@attach playScene({ scene, lines, still: prefersReducedMotion.current })}></canvas>
  {/if}

  <div class="stage">
    <div class="copy">
      <p class="repo">
        <a href={ogRepoUrls.repo} target="_blank" rel="noopener">
          <Icon svg={githubMark} />
          <span>trakt /</span>
          <b>trakt-og</b>
        </a>
        <TagPills tags={[{ text: 'Public', kind: 'badge' }]} />
      </p>
      <h1 id="about-title">OG Redux is <em>open source.</em></h1>
      <p class="lede">
        <ProjectLink kind="og">OG Redux</ProjectLink> is the next chapter of <b>Trakt OG</b>, the classic site longtime
        members love, rebuilt for today's big screens. It's a fork of <ProjectLink kind="web">trakt-web</ProjectLink>,
        the code behind Trakt's v3 web app, and it runs entirely on the <ProjectLink kind="api">Trakt API</ProjectLink>.
        Every line of it is on <ProjectLink kind="github">GitHub</ProjectLink>, built in the open.
      </p>
      {#if loading}
        <span class="shimmers" aria-label="Loading the repo's numbers">
          {#each SHIMMERS as n (n)}
            <Shimmer inline="var(--about-count-shimmer-{n})" block="var(--about-count-shimmer-height)" />
          {/each}
        </span>
      {:else if counts.length > 0}
        <TagPills tags={counts} large />
      {/if}
    </div>

    <div class="terminal">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <pre><code><span class="comment"># run OG Redux locally
# full setup in the <a href={ogRepoUrls.readme} target="_blank" rel="noopener">README</a></span>
{#each COMMANDS as command (command)}<span class="prompt" aria-hidden="true">$</span> {command}
{/each}</code></pre>
      <button type="button" class="copy-button" onclick={copyCommands}>{copied ? 'Copied' : 'Copy'}</button>
    </div>
  </div>

</section>

<style>
/* Dark in either theme, over its film scenes. Its text color is set again so it resolves dark here too. */
.hero {
  color-scheme: dark;
  color: var(--color-home-text);
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  overflow: hidden;
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

  &[data-shade='grid']::before {
    background: var(--about-hero-shade-grid);
  }

  &[data-shade='quiet']::before {
    background: var(--about-hero-shade-quiet);
  }
}

canvas {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
}

.stage {
  display: grid;
  grid-template-columns: var(--about-hero-columns);
  gap: var(--about-hero-gap);
  align-items: center;
}

.copy {
  display: grid;
  justify-items: start;
}

.repo {
  display: flex;
  align-items: center;
  gap: var(--about-repo-gap);
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  color: var(--color-home-muted);

  & a {
    display: inline-flex;
    align-items: center;
    gap: var(--about-repo-gap);
    color: inherit;

    &:is(:hover, :focus-visible) {
      color: var(--color-home-text);
      text-decoration: none;
    }
  }

  & :global(svg) {
    inline-size: var(--about-repo-icon);
    block-size: var(--about-repo-icon);
    color: var(--color-home-text);
  }

  /* Bold in the line's own monospace, not the headings face base.css gives every <b>. */
  & b {
    font-family: inherit;
    color: var(--color-home-text);
  }
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

.terminal {
  display: grid;
  gap: var(--about-terminal-gap);
  padding: var(--about-terminal-padding);
  border-radius: var(--about-banner-radius);
  background: var(--color-about-terminal-bg);
  box-shadow: 0 0 0 1px var(--color-home-line), var(--shadow-about-terminal);
  backdrop-filter: blur(var(--about-terminal-blur));
}

.dots {
  display: flex;
  gap: var(--about-repo-gap);

  & i {
    inline-size: var(--about-terminal-dot);
    block-size: var(--about-terminal-dot);
    border-radius: 50%;
    background: var(--color-about-terminal-dot);
  }
}

pre {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  border: 0;
  background: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  line-height: var(--line-height-about-terminal);
  color: var(--color-home-soft);
}

code {
  padding: 0;
  border: 0;
  background: none;
  font-size: inherit;
  color: inherit;
}

.comment {
  color: var(--color-about-terminal-comment);

  & a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: var(--about-link-underline);

    &:is(:hover, :focus-visible) {
      color: var(--color-home-text);
    }
  }
}

.prompt {
  color: var(--brand-primary);
}

.copy-button {
  justify-self: end;
  block-size: var(--about-copy-height);
  padding-inline: var(--about-copy-inline);
  border: 1px solid var(--color-home-line);
  border-radius: var(--radius-tag);
  background: var(--color-home-bg);
  color: var(--color-home-text);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    border-color: var(--color-home-button-line);
  }
}

/* Tablets: the terminal drops under the copy. */
@container (width < 1000px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
