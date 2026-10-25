<!--
  The design shell's sidebar: every demo by group, a filter over them, the open demo's sections, and the theme. It
  folds to a rail, remembered with the theme. On screens wide enough for the section list beside the demo
  (SectionList), the sections leave the sidebar.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import logo from '$lib/assets/trakt-logo-red.png';
import Icon from '$lib/icons/Icon.svelte';
import search from '$lib/icons/light/magnifying-glass.svg?raw';
import sidebar from '$lib/icons/regular/sidebar.svg?raw';
import { designCatalog } from './designCatalog.ts';
import type { DesignPrefs } from './designPrefs.ts';
import type { DesignTocEntry } from './designToc.svelte.ts';
import ThemeSwitch from './ThemeSwitch.svelte';

interface Props {
  current: string | undefined;
  sections: readonly DesignTocEntry[];
  section: string | undefined;
  prefs: DesignPrefs;
  onchange: (prefs: DesignPrefs) => void;
}

const { current, sections, section, prefs, onchange }: Props = $props();
const index = resolve('/_design');

let query = $state('');
const groups = $derived.by(() => {
  const terms = query.trim().toLowerCase();
  if (!terms) return designCatalog;

  return designCatalog
    .map(({ name, demos }) => ({
      name,
      demos: demos.filter((demo) =>
        [name, demo.title, demo.summary, demo.source].some((text) => text.toLowerCase().includes(terms))
      ),
    }))
    .filter(({ demos }) => demos.length > 0);
});
</script>

<!-- Each demo is its own static route under the resolved index, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if prefs.collapsed}
  <nav class="rail" aria-label="Design system">
  <button type="button" aria-expanded="false" aria-controls="design-nav"
    onclick={() => onchange({ ...prefs, collapsed: false })}>
    <Icon svg={sidebar} label="Show the demo list" />
  </button>
</nav>
{:else}
  <nav class="nav" id="design-nav" aria-label="Design system">
  <div class="top">
    <a class="home" href={index} aria-current={current ? undefined : 'page'}>
      <img src={logo} alt="" width="26" height="26" />
      <span>og <b>design system</b></span>
    </a>
    <button type="button" class="fold" aria-expanded="true" aria-controls="design-nav"
      onclick={() => onchange({ ...prefs, collapsed: true })}>
      <Icon svg={sidebar} label="Hide the demo list" />
    </button>
  </div>

  <label class="filter">
    <Icon svg={search} />
    <span class="visually-hidden">Filter demos</span>
    <input type="search" placeholder="Filter demos" bind:value={query} />
  </label>

  <div class="groups">
      {#each groups as group (group.name)}
        <h2>{group.name}</h2>
        <ul>
          {#each group.demos as demo (demo.slug)}
            {@const open = demo.slug === current}
            <li>
              <a href="{index}/{demo.slug}" aria-current={open ? 'page' : undefined}>
                {demo.title}
              </a>
              {#if open && sections.length > 0}
                <ul class="sections">
                  {#each sections as entry (entry.id)}
                    <li>
                      <a href="#{entry.id}" aria-current={entry.id === section ? 'location' : undefined}>
                        {entry.title}
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">No demos match "{query}".</p>
      {/each}
    </div>

  <div class="bottom">
    <ThemeSwitch theme={prefs.theme} onchange={(theme) => onchange({ ...prefs, theme })} />
  </div>
</nav>
{/if}

<style>
.nav,
.rail {
  position: sticky;
  inset-block-start: 0;
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  background-color: var(--color-design-nav-bg);
  color: var(--color-design-nav-text);
  border-inline-end: 1px solid var(--color-design-nav-border);
  color-scheme: dark;
}

.rail {
  align-items: center;
  padding-block: var(--space-lg-block);
}

button {
  display: grid;
  place-items: center;
  inline-size: 32px;
  block-size: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-tag);
  background: none;
  color: var(--color-design-nav-muted);
  font-size: var(--font-size-large);
  cursor: pointer;

  &:hover {
    background-color: var(--color-design-nav-hover);
    color: var(--color-design-nav-active);
  }
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  padding: var(--space-lg-block) var(--space-sm-inline) var(--space-lg-block) var(--gutter);
}

.home {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  color: var(--color-design-nav-active);
  font-family: var(--font-headings);
  font-size: var(--font-size-design-lead);
  text-decoration: none;
  white-space: nowrap;

  & b {
    font-weight: var(--font-weight-headings-light);
    color: var(--color-design-nav-text);
  }
}

.filter {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin: 0 var(--space-sm-inline) var(--space-sm-block);
  padding-inline: var(--space-sm-inline);
  border: 1px solid var(--color-design-nav-border);
  border-radius: var(--radius-tag);
  background-color: var(--color-design-nav-input);
  color: var(--color-design-nav-muted);

  &:focus-within {
    border-color: var(--color-input-border-focus);
  }

  & input {
    flex: 1;
    min-inline-size: 0;
    padding-block: var(--space-sm-block);
    border: 0;
    background: none;
    box-shadow: none;
    color: var(--color-design-nav-active);
    outline: none;
  }
}

.groups {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-sm-inline) var(--gutter);
  scrollbar-width: thin;
}

h2 {
  margin: var(--gutter) 0 var(--space-sm-block);
  padding-inline: var(--space-sm-inline);
  color: var(--color-design-nav-muted);
  font-size: var(--font-size-design-eyebrow);
  letter-spacing: var(--letter-spacing-design-eyebrow);
  text-transform: uppercase;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.groups a {
  display: block;
  padding: var(--space-sm-block) var(--space-sm-inline);
  border-radius: var(--radius-tag);
  color: inherit;
  text-decoration: none;

  &:hover {
    background-color: var(--color-design-nav-hover);
    color: var(--color-design-nav-active);
  }

  &[aria-current='page'] {
    background-color: var(--color-design-nav-hover);
    box-shadow: inset 3px 0 var(--brand-primary);
    color: var(--color-design-nav-active);
    font-weight: var(--font-weight-headings);
  }
}

.sections {
  margin-block: var(--space-xs-block) var(--space-sm-block);
  margin-inline-start: var(--space-sm-inline);
  border-inline-start: 1px solid var(--color-design-nav-border);

  /* The section list beside the demo takes over from here (the layout's breakpoint for it). */
  @media (min-width: 1680px) {
    display: none;
  }

  & a {
    padding-block: var(--space-xs-inline);
    color: var(--color-design-nav-muted);
    font-size: var(--font-size-small);

    &[aria-current='location'] {
      color: var(--color-design-nav-active);
    }
  }
}

.none {
  padding: var(--gutter) var(--space-sm-inline);
  color: var(--color-design-nav-muted);
}

.bottom {
  padding: var(--space-lg-block) var(--gutter);
  border-block-start: 1px solid var(--color-design-nav-border);
}
</style>
