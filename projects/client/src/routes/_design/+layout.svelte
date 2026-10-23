<!--
  The design system shell: the demo list beside the open demo, its title and summary from the catalog, in the theme
  the switch picks. A demo that draws the site header runs full width, with a small pill back to the list.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import { page } from '$app/state';
import DesignIntro from '$lib/design/DesignIntro.svelte';
import DesignNav from '$lib/design/DesignNav.svelte';
import { type DesignPrefs, designPrefs } from '$lib/design/designPrefs';
import { designToc } from '$lib/design/designToc.svelte';
import { findDesignDemo } from '$lib/design/findDesignDemo';
import ThemeSwitch from '$lib/design/ThemeSwitch.svelte';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';

const { children, data } = $props();

const demo = $derived(findDesignDemo(page.url.pathname));
const toc = designToc.create();
designToc.set(toc);

let picked = $state<DesignPrefs>();
const prefs = $derived(picked ?? data.designPrefs);

function save(next: DesignPrefs) {
  picked = next;
  document.cookie = designPrefs.serialize(next);
}

$effect(() => {
  if (demo?.ownTheme) return;
  document.documentElement.dataset.theme = prefs.theme;
});
</script>

<svelte:head>
  <title>{demo ? `${demo.title} · ` : ''}og design system</title>
</svelte:head>

{#if demo?.page}
  {@render children()}
  <nav class="pill" aria-label="Design system">
    <a href={resolve('/_design')}><Icon svg={angleLeft} /> Design system</a>
    <span>{demo.title}</span>
    {#if !demo.ownTheme}
      <ThemeSwitch theme={prefs.theme} onchange={(theme) => save({ ...prefs, theme })} />
    {/if}
  </nav>
{:else}
  <div class={['shell', { collapsed: prefs.collapsed }]}>
  <DesignNav current={demo?.slug} sections={toc.entries} {prefs} onchange={save} />
  <main id="content" tabindex="-1">
      {#if demo}
        <DesignIntro eyebrow={demo.group} title={demo.title}>
          {#snippet lead()}{demo.summary}{/snippet}
          Lives in <code>$lib/{demo.source}</code>
        </DesignIntro>
      {/if}
      {@render children()}
    </main>
</div>
{/if}

<style>
.shell {
  display: grid;
  grid-template-columns: var(--design-nav-width) minmax(0, 1fr);
  min-block-size: 100dvh;

  &.collapsed {
    grid-template-columns: var(--design-rail-width) minmax(0, 1fr);
  }
}

main {
  display: flow-root;
  padding-block-end: calc(var(--design-section-gap) * 2);
  background-color: var(--color-surface);
  color: var(--color-text);
  outline: none;
}

/* Over a full-page demo: bottom right, clear of the page sidebars' footers and the toasts up top. */
.pill {
  position: fixed;
  inset-block-end: var(--gutter);
  inset-inline-end: var(--gutter);
  z-index: var(--z-navbar-fixed);
  display: flex;
  align-items: center;
  gap: var(--space-base-inline);
  padding: var(--space-sm-block) var(--space-sm-block) var(--space-sm-block) var(--space-base-inline);
  border: 1px solid var(--color-design-nav-border);
  border-radius: var(--radius-round);
  background-color: var(--color-design-nav-bg);
  color: var(--color-design-nav-muted);
  box-shadow: var(--shadow-design-pill);
  color-scheme: dark;

  & a {
    color: var(--color-design-nav-active);
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings);
    text-decoration: none;
  }
}
</style>
