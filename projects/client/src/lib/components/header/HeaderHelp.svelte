<!--
  The header's help menu, a signpost beside the account, signed in or out. Under an OG Redux heading, og's own
  rows: a bug report with the page's link filled in, and a feature request, both on GitHub. Under Trakt Account, the
  help center, email support and the status page. Under Community, r/trakt. Last, on its own, /help, which explains
  the difference: GitHub is public, Trakt support is private.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { ogRepoUrls } from '$lib/about/ogRepoUrls';
import Signpost from '$lib/components/signpost/Signpost.svelte';
import { newBugUrl } from '$lib/help/newBugUrl';
import Icon from '$lib/icons/Icon.svelte';
import redditAlien from '$lib/icons/brands/reddit-alien.svg?raw';
import bug from '$lib/icons/solid/bug.svg?raw';
import envelope from '$lib/icons/solid/envelope.svg?raw';
import lifeRing from '$lib/icons/solid/life-ring.svg?raw';
import lightbulb from '$lib/icons/solid/lightbulb.svg?raw';
import spaceStationMoon from '$lib/icons/solid/space-station-moon.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import HeaderMenu from './HeaderMenu.svelte';

const og = $derived([
  { title: 'Report a bug', icon: bug, href: newBugUrl(page.url.href) },
  { title: 'Suggest a feature', icon: lightbulb, href: ogRepoUrls.newFeature },
]);

const trakt = [
  { title: 'Help center', icon: lifeRing, href: traktUrls.support },
  { title: 'Email support', icon: envelope, href: traktUrls.help },
  { title: 'Service status', icon: spaceStationMoon, href: traktUrls.status },
];

const community = [{ title: 'r/trakt', icon: redditAlien, href: traktUrls.reddit }];

const sections = $derived([
  { heading: 'OG Redux', links: og },
  { heading: 'Trakt Account', links: trakt },
  { heading: 'Community', links: community },
]);
</script>

<!-- Every row but /help leaves og, and resolve() only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="help">
  <HeaderMenu label="Help">
    {#snippet trigger()}<Signpost />{/snippet}
    {#each sections as section (section.heading)}
      <p class="heading">{section.heading}</p>
      <ul>
        {#each section.links as link (link.title)}
          <li>
            <a href={link.href} target="_blank" rel="noopener"><Icon svg={link.icon} fixedWidth /> {link.title}</a>
          </li>
        {/each}
      </ul>
      <hr />
    {/each}
    <ul>
      <li><a href={resolve('/help')}><span class="fixed-width"><Signpost /></span> All help</a></li>
    </ul>
  </HeaderMenu>
</div>

<style>
/* The menu's arrow points at the middle of the trigger. */
.help {
  --header-menu-arrow-end: calc(var(--header-pill-height) / 2);
}

/* A loose pill like the magnifier, lit while its menu is open. */
.help :global(.trigger) {
  justify-content: center;
  inline-size: var(--header-pill-height);
  block-size: var(--header-pill-height);
  padding: 0;
  border-radius: var(--radius-header-pill);
  color: var(--color-header-muted);
  font-size: var(--font-size-header-link);
  text-shadow: none;

  &:hover {
    background-color: var(--color-header-pill);
    color: var(--color-header-text);
  }
}

.help :global(.header-menu:has(.menu:popover-open) .trigger) {
  background-color: var(--color-header-pill);
  color: var(--color-header-text);
}

/* The dropdowns' section heading. */
.heading {
  margin: 0;
  padding: var(--space-menu-header);
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;

  &:first-child {
    padding-block-start: var(--space-menu-offset);
  }
}

.help :global(.signpost) {
  font-size: var(--header-signpost);
}

/* The signpost as wide as the other rows' fixed-width icons, so the labels line up. */
.fixed-width {
  display: grid;
  place-items: center;
  inline-size: var(--header-help-icon-width);
}

/* The icon close to its label, not pushed apart like a check. */
.help :global(.menu a) {
  justify-content: start;
  gap: var(--space-menu-icon);
}
</style>
