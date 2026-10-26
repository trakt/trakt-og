<!--
  A project named in a hero's intro: its mark, then its name in bold in its own color, linking out. Hovering underlines
  the name. og is the red Trakt logo and links to og's repo, web is trakt-web's violet disc, api is the developer
  site's round blue blueprint, and github is GitHub's mark, linking to og's repo.
    It runs on the <ProjectLink kind="api">Trakt API</ProjectLink>.
-->
<script lang="ts">
import traktDeveloper from '$lib/assets/trakt-developer.svg';
import traktLogo from '$lib/assets/trakt-logo-red.png';
import Icon from '$lib/icons/Icon.svelte';
import githubMark from '$lib/icons/brands/github.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import type { Snippet } from 'svelte';
import TraktLogoMark from './TraktLogoMark.svelte';

export type ProjectKind = 'og' | 'web' | 'api' | 'github';

interface Props {
  kind: ProjectKind;
  children: Snippet;
}

const { kind, children }: Props = $props();

const HREFS: Readonly<Record<ProjectKind, string>> = {
  og: traktUrls.github,
  web: traktUrls.webRepo,
  api: traktUrls.developer,
  github: traktUrls.github,
};
</script>

<!-- Every project's link leaves og, and resolve() only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<a class={['project', kind]} href={HREFS[kind]} target="_blank" rel="noopener"
  ><span class="mark">
    {#if kind === 'og'}
      <img src={traktLogo} alt="" />
    {:else if kind === 'web'}
      <TraktLogoMark disc />
    {:else if kind === 'api'}
      <img src={traktDeveloper} alt="" />
    {:else}
      <Icon svg={githubMark} />
    {/if}
  </span><b>{@render children()}</b></a
>

<style>
/* Inline, not a flex box, so the comma or period after it stays on its line; the mark never parts from the name. */
.project {
  color: var(--color-lede-link);
  text-decoration: none;
  white-space: nowrap;

  &:is(:hover, :focus-visible) b {
    text-decoration: underline;
    text-underline-offset: var(--lede-link-underline);
  }
}

.og {
  color: var(--brand-primary);
}

.web {
  color: var(--color-lede-web-name);
}

.api {
  color: var(--color-lede-api-name);
}

/* The mark's own font size sets its box, so GitHub's icon font glyph fills it like the image marks. */
.mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 1em;
  block-size: 1em;
  margin-inline-end: var(--lede-name-mark-gap);
  font-size: var(--lede-name-mark);
  vertical-align: var(--lede-name-mark-align);
  color: var(--color-lede-link);

  & img {
    inline-size: 100%;
    block-size: 100%;
  }
}

b {
  font-weight: var(--font-weight-headings-heavy);
}
</style>
