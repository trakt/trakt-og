<!--
  The profile's section tabs: a twin of the site header, in the same tinted glass with the same loose link pills, the
  current one solid red, lined up with the page column. It sits in the flow at the foot of the profile cover.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import HeaderTint from '$lib/components/header/HeaderTint.svelte';
import type { ProfileTab } from '$lib/users/profileTabs';

const { tabs }: { tabs: readonly ProfileTab[] } = $props();
</script>

<!-- Tabs point at profile subpages other issues build, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<nav class="profile-tabs" aria-label="Profile">
  <HeaderTint />
  <Container>
    <div class="links">
      {#each tabs as tab (tab.href)}
        <a href={tab.href} aria-current={tab.current ? 'page' : undefined}>{tab.label}</a>
      {/each}
    </div>
  </Container>
</nav>

<style>
.profile-tabs {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  block-size: var(--profile-tabs-height);
  background: var(--color-header-glass);
  backdrop-filter: var(--blur-header-glass);
  box-shadow: inset 0 1px 0 var(--color-header-edge);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

/* The current pill's glow needs room above and below, so the row is as tall as the bar. */
.links {
  display: flex;
  align-items: center;
  gap: var(--gap-header-links);
  block-size: var(--profile-tabs-height);
  overflow-x: auto;
  font-size: var(--font-size-header-link);
  scrollbar-width: none;
}

a {
  display: flex;
  align-items: center;
  block-size: var(--header-pill-height);
  padding-inline: var(--space-header-pill-inline);
  border-radius: var(--radius-header-pill);
  color: var(--color-header-muted);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;

  &:is(:hover, :focus) {
    background-color: var(--color-header-pill);
    color: var(--color-header-text);
    text-decoration: none;
  }

  &[aria-current='page'] {
    background-color: var(--brand-primary);
    color: var(--color-text-inverse);
    box-shadow: var(--shadow-header-current);
  }
}

@media (prefers-reduced-motion: reduce) {
  a {
    transition: none;
  }
}

/* Tablets: the header's tighter pills, so every tab still fits. */
@media (width <= 1200px) {
  a {
    padding-inline: var(--space-sm-inline);
  }
}
</style>
