<!--
  OG's footer: site links, social links, copyright.
-->
<script lang="ts">
import logo from '$lib/assets/trakt-logo-mini-white.png';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import apple from '$lib/icons/brands/apple.svg?raw';
import github from '$lib/icons/brands/github.svg?raw';
import googlePlay from '$lib/icons/brands/google-play.svg?raw';
import redditAlien from '$lib/icons/brands/reddit-alien.svg?raw';
import spaceStationMoon from '$lib/icons/solid/space-station-moon.svg?raw';
import { traktUrls } from '$lib/traktUrls';

const pages = [
  { title: 'About', href: traktUrls.about },
  { title: 'VIP', href: traktUrls.vip },
  { title: 'Developer', href: traktUrls.developer },
  { title: 'Forums', href: traktUrls.forums },
  { title: 'Terms', href: traktUrls.terms },
  { title: 'Privacy', href: traktUrls.privacy },
  { title: 'Branding', href: traktUrls.branding },
];

const social = [
  { title: 'Trakt for iOS', href: traktUrls.appStore, icon: apple },
  { title: 'Trakt for Android', href: traktUrls.googlePlay, icon: googlePlay },
  { title: 'Reddit', href: traktUrls.reddit, icon: redditAlien },
  { title: 'GitHub', href: traktUrls.github, icon: github },
  { title: 'Status', href: traktUrls.status, icon: spaceStationMoon },
];
</script>

<!-- Every link leaves og (v3 web, the app stores, community sites), so each opens in a new tab. resolve() only takes og's
     own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<footer>
  <div class="links">
    <nav aria-label="Footer">
      <ul>
        {#each pages as link (link.title)}
          <li><a href={link.href} target="_blank" rel="noopener">{link.title}</a></li>
        {/each}
      </ul>
    </nav>
    <ul class="social">
      {#each social as link (link.title)}
        <li>
          <Tooltip text={link.title}>
            {#snippet trigger(tooltip)}
              <a href={link.href} target="_blank" rel="noopener" {...tooltip}><Icon svg={link.icon} label={link.title} /></a>
            {/snippet}
          </Tooltip>
        </li>
      {/each}
    </ul>
  </div>
  <p class="copyright">
    <img src={logo} alt="" height="30" width="30" />
    <span>&copy; 2010-{new Date().getFullYear()} trakt, inc. All rights reserved.<br />Hand crafted around the world.</span>
  </p>
</footer>

<style>
footer {
  padding: var(--gutter);
  background: var(--color-page);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-footer);
}

a {
  color: inherit;

  &:is(:hover, :focus) {
    color: var(--brand-primary);
    text-decoration: none;
  }
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
  align-items: start;
  gap: var(--gutter);
  margin-block-end: var(--gutter);

  & nav li {
    padding-inline-end: 30px;
    text-transform: uppercase;
  }
}

.social {
  flex-wrap: nowrap;
  gap: var(--space-sm-inline);

  & :global(svg) {
    font-size: var(--font-size-nav);
    vertical-align: middle;
  }
}

.copyright {
  display: flex;
  align-items: start;
  gap: 13px;
  margin: 0;
  color: var(--color-footer-muted);
  font-size: var(--font-size-footer-small);

  & img {
    opacity: 0.3;
  }
}

@media (width < 768px) {
  .links {
    flex-direction: column;
  }
}
</style>
