<!--
  The design system shell: the demo list, then the open demo's title and summary from the catalog over its cards, in
  the theme the switch picks. Wide screens list the demo's sections beside it.
-->
<script lang="ts">
import { page } from '$app/state';
import DesignIntro from '$lib/design/DesignIntro.svelte';
import DesignNav from '$lib/design/DesignNav.svelte';
import SectionList from '$lib/design/SectionList.svelte';
import { type DesignPrefs, designPrefs } from '$lib/design/designPrefs';
import { designToc } from '$lib/design/designToc.svelte';
import { findDesignDemo } from '$lib/design/findDesignDemo';
import { guardWrites } from '$lib/design/guardWrites';
import { toast } from '$lib/components/toast/toast.svelte';
import { countLabel } from '$lib/utils/countLabel';

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

// While a demo is open, saves stay on the page: nothing it does reaches the API.
$effect(() => {
  const real = window.fetch;
  window.fetch = guardWrites({
    fetch: real,
    origin: location.origin,
    onblock: () => toast.success('Demo: saved on this page only, not sent to Trakt.'),
  });
  return () => {
    window.fetch = real;
  };
});

$effect(() => {
  document.documentElement.dataset.theme = prefs.theme;
});
</script>

<svelte:head>
  <title>{demo ? `${demo.title} · ` : ''}og design system</title>
</svelte:head>

<div class={['shell', { collapsed: prefs.collapsed }]}>
  <DesignNav current={demo?.slug} sections={toc.entries} section={toc.current} {prefs} onchange={save} />
  <main id="content" tabindex="-1">
    <div class="column">
      {#if demo}
        <DesignIntro tag={demo.group} title={demo.title}
          facts={[countLabel(toc.entries.length, 'section'), `$lib/${demo.source}`]}>
          {#snippet lead()}{demo.summary}{/snippet}
        </DesignIntro>
      {/if}
      {@render children()}
    </div>
    {#if demo}
      <aside class="toc"><SectionList sections={toc.entries} current={toc.current} /></aside>
    {/if}
  </main>
</div>

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
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--design-stage-gap);
  align-items: start;
  padding: calc(var(--design-stage-gap) * 2) var(--design-stage-padding) calc(var(--design-stage-gap) * 4);
  background-color: var(--color-design-ground);
  color: var(--color-text);
  outline: none;

  /* Room for the section list beside the cards. DesignNav hides its own copy from here. */
  @media (min-width: 1680px) {
    grid-template-columns: minmax(0, 1fr) var(--design-toc-width);
  }
}

.column {
  display: grid;
  gap: var(--design-stage-gap);
  min-inline-size: 0;
}

.toc {
  display: none;
  block-size: 100%;

  @media (min-width: 1680px) {
    display: block;
  }
}
</style>
