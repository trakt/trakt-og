<!--
  The page's footer: the site links as the header's muted pills, the apps and community as ghost logo squares that
  take their brand's color under the pointer (like a summary's links out), then the mark and copyright. Dark on every
  theme, like the header.
-->
<script lang="ts">
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import apple from '$lib/icons/brands/apple.svg?raw';
import github from '$lib/icons/brands/github.svg?raw';
import googlePlay from '$lib/icons/brands/google-play.svg?raw';
import redditAlien from '$lib/icons/brands/reddit-alien.svg?raw';
import youtube from '$lib/icons/brands/youtube.svg?raw';
import spaceStationMoon from '$lib/icons/solid/space-station-moon.svg?raw';
import { resolve } from '$app/paths';
import { traktUrls } from '$lib/traktUrls';

const pages = [
  { title: 'Support', href: traktUrls.support },
  { title: 'VIP', href: traktUrls.vip },
  { title: 'Developer', href: traktUrls.developer },
  { title: 'Terms', href: traktUrls.terms },
  { title: 'Privacy', href: traktUrls.privacy },
  { title: 'Branding', href: traktUrls.branding },
];

const social = [
  { title: 'Trakt for iOS', href: traktUrls.appStore, icon: apple },
  { title: 'Trakt for Android', href: traktUrls.googlePlay, icon: googlePlay, color: 'var(--color-site-google-play)' },
  { title: 'Reddit', href: traktUrls.reddit, icon: redditAlien, color: 'var(--color-site-reddit)' },
  { title: 'YouTube', href: traktUrls.youtube, icon: youtube, color: 'var(--color-site-youtube)' },
  { title: 'GitHub', href: traktUrls.github, icon: github },
  { title: 'Status', href: traktUrls.status, icon: spaceStationMoon, color: 'var(--color-site-status)' },
];
</script>

<!-- Every link but About leaves og (v3 web, the app stores, community sites), so each opens in a new tab. resolve()
     only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<footer>
  <div class="links">
    <nav aria-label="Footer">
      <ul>
        <li><a href={resolve('/about')}>About</a></li>
        {#each pages as link (link.title)}
          <li><a href={link.href} target="_blank" rel="noopener">{link.title}</a></li>
        {/each}
      </ul>
    </nav>
    <ul class="social">
      {#each social as link (link.title)}
        <li style:--glass-action-ghost-hover-icon={link.color}>
          <Tooltip text={link.title}>
            {#snippet trigger(tooltip)}
              <GlassAction card ghost square icon={link.icon} href={link.href} target="_blank" rel="noopener"
                aria-label={link.title} {...tooltip} />
            {/snippet}
          </Tooltip>
        </li>
      {/each}
    </ul>
  </div>
  <p class="copyright">
    <svg class="mark" viewBox="0 0 98.1 98.1" aria-hidden="true">
      <TraktMark ink="currentColor" />
    </svg>
    <span>&copy; 2010-{new Date().getFullYear()} trakt, inc. All rights reserved.<br />Hand crafted around the world.</span>
  </p>
</footer>

<style>
footer {
  color-scheme: dark;
  display: grid;
  gap: var(--footer-gap);
  padding: var(--footer-padding);
  border-block-start: 1px solid var(--color-header-edge);
  background: var(--color-page);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

ul {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

.links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gutter);
}

/* The header's links: muted until the pointer brings a soft glass pill. The first pill's text lines up with the
   copyright under it. */
nav ul {
  gap: var(--gap-header-links);
  margin-inline-start: calc(-1 * var(--space-header-pill-inline));
  font-size: var(--font-size-header-link);

  & a {
    display: flex;
    align-items: center;
    block-size: var(--header-pill-height);
    padding-inline: var(--space-header-pill-inline);
    border-radius: var(--radius-header-pill);
    color: var(--color-header-muted);
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s;

    &:is(:hover, :focus-visible) {
      background-color: var(--color-header-pill);
      color: var(--color-header-text);
    }
  }
}

.social {
  flex-wrap: nowrap;
  gap: var(--footer-social-gap);
}

.copyright {
  display: flex;
  align-items: center;
  gap: var(--footer-mark-gap);
  margin: 0;
  color: var(--color-footer-muted);
  font-size: var(--font-size-footer-small);
  line-height: var(--line-height-footer-copyright);
}

.mark {
  flex: none;
  inline-size: var(--footer-mark-size);
  block-size: var(--footer-mark-size);
  opacity: var(--opacity-footer-mark);
}

@media (width < 768px) {
  .links {
    flex-direction: column;
    align-items: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  nav a {
    transition: none;
  }
}
</style>
