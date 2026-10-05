<!--
  OG is for tablets and computers. Below 768px wide, or on a phone held sideways, this hides the app and shows a splash
  instead: Trakt's own app and Mobile Web first, then other apps that sync with Trakt. A tablet held upright is asked
  to turn sideways, and a narrow desktop window to get wider. CSS decides, so the first paint is already right; the server picks the store from the user agent.
  `preview` forces the splash on for the design-system demo.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import logo from '$lib/assets/trakt-wide-red-white.svg';
import fanart from '$lib/assets/mobile-splash-fanart.jpg';
import traktMark from '$lib/assets/apps/trakt.svg';
import traktTime from '$lib/assets/apps/trakt-time.svg';
import showly from '$lib/assets/apps/showly.png';
import rippple from '$lib/assets/apps/rippple.png';
import Icon from '$lib/icons/Icon.svelte';
import apple from '$lib/icons/brands/apple.svg?raw';
import googlePlay from '$lib/icons/brands/google-play.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import type { MobilePlatform } from './MobilePlatform.ts';
import { toSplashLinks } from './toSplashLinks.ts';

interface Props {
  platform: MobilePlatform;
  /** A phone's user agent: phone wording even with a mouse, as in a browser's device mode. */
  phone?: boolean;
  /** The app, shown everywhere the splash isn't. */
  children?: Snippet;
  preview?: 'phone' | 'tablet' | 'window';
}

const { platform, phone = false, children, preview }: Props = $props();
const links = $derived(toSplashLinks(platform));
const storeIcon = $derived(platform === 'ios' ? apple : googlePlay);
const appIcons = { 'trakt-time': traktTime, showly, rippple };
const headingId = $props.id();
</script>

{#if children}
  <div class="app">{@render children()}</div>
{/if}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section
  class={['splash', { preview }]}
  data-preview={preview}
  data-phone={phone || undefined}
  data-mobile-splash={preview ? undefined : ''}
  style:--splash-fanart="url('{fanart}')"
  aria-labelledby={headingId}
>
  <div class="hero">
    <img class="logo" src={logo} alt="Trakt" width="289" height="98" />
    <div class="message">
      <h1 id={headingId}>
        <span class="phone">OG is made for bigger screens.</span>
        <span class="tablet">Turn your tablet sideways.</span>
        <span class="window">OG needs a wider window.</span>
      </h1>
      <p>
        <span class="phone">Open it on a tablet or computer. On your phone, try one of these.</span>
        <span class="tablet">OG needs a little more width. Rotate and it opens right here.</span>
        <span class="window">Make it wider and OG opens right here. Or try one of these.</span>
      </p>
    </div>
  </div>

  <div class="trakt">
    <p class="brand">
      <img src={traktMark} alt="" width="40" height="40" />
      <span><strong>Trakt</strong> Same account, made for any screen</span>
    </p>
    <div class="actions">
      <a class="button store" href={links.store.href} target="_blank" rel="noopener"><Icon svg={storeIcon} />
        {links.store.name}</a>
      <a class="button web" href={traktUrls.web} target="_blank" rel="noopener">Mobile Web</a>
    </div>
  </div>

  <div class="apps">
    <h2>More apps that sync with Trakt</h2>
    <ul>
      {#each links.apps as app (app.id)}
        <li>
          <a href={app.href} target="_blank" rel="noopener">
            <img src={appIcons[app.id]} alt="" width="34" height="34" />
            <span class="name">{app.name}</span>
            <span class="tag">{app.tag}</span>
            <span class="chevron"><Icon svg={angleRight} /></span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
.app {
  display: contents;
}

.splash {
  display: none;
  flex-direction: column;
  color-scheme: dark;
  background: var(--color-splash-bg);
  color: var(--color-splash-text);
  font-family: var(--font-body);
}

/*
 * Too small for OG: narrower than sm (768px), or a phone held sideways (its short height, on a touch screen, so a
 * desktop window with the dev tools docked below keeps OG).
 */
@media (width < 768px) or ((pointer: coarse) and (height < 500px)) {
  .app {
    display: none;
  }

  .splash {
    display: flex;
  }

  /*
   * The splash covers the screen and scrolls itself when it's taller (a phone held sideways), with its scrollbar
   * hidden. The page under it can't scroll, so a desktop set to always show scrollbars draws no empty tracks.
   */
  .splash:not(.preview) {
    position: fixed;
    inset: 0;
    overflow: hidden auto;
    overscroll-behavior: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  :global(html:has([data-mobile-splash])) {
    overflow: hidden;
  }
}

.preview {
  display: flex;
  min-block-size: 100%;
}

/* Phone copy by default. A tablet held upright is asked to turn sideways, a desktop window to get wider. */
.tablet,
.window {
  display: none;
}

@media (pointer: coarse) and (orientation: portrait) and (width >= 600px) {
  .splash:not([data-preview]) {
    .phone {
      display: none;
    }

    .tablet {
      display: inline;
    }
  }
}

@media (pointer: fine) {
  .splash:not([data-preview], [data-phone]) {
    .phone {
      display: none;
    }

    .window {
      display: inline;
    }
  }
}

[data-preview='tablet'] {
  .phone {
    display: none;
  }

  .tablet {
    display: inline;
  }
}

[data-preview='window'] {
  .phone {
    display: none;
  }

  .window {
    display: inline;
  }
}

/* The column is the screen on a phone and a centered measure on a tablet. */
.hero,
.trakt,
.apps {
  padding-inline: max(var(--splash-gutter), (100% - var(--splash-content-width)) / 2);
}

.hero {
  position: relative;
  isolation: isolate;
  flex: 1 0 var(--splash-hero-min);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-block: var(--splash-hero-padding-block);
  background: var(--splash-fanart) var(--splash-fanart-position) / cover no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: var(--gradient-splash-scrim);
  }
}

.logo {
  align-self: flex-start;
  block-size: var(--splash-logo-height);
  inline-size: auto;
}

.message {
  display: grid;
  gap: var(--splash-message-gap);
  text-shadow: var(--text-shadow-headings);
}

h1 {
  max-inline-size: var(--splash-title-measure);
  margin: 0;
  color: inherit;
  font-family: var(--font-headings);
  font-size: var(--font-size-splash-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  letter-spacing: var(--splash-title-tracking);
  text-wrap: balance;
}

.message p {
  max-inline-size: var(--splash-lede-measure);
  margin: 0;
  color: var(--color-splash-lede);
  font-size: var(--font-size-splash-lede);
  text-wrap: balance;
}

.trakt {
  display: grid;
  gap: var(--splash-panel-gap);
  padding-block: var(--splash-panel-padding-block);
  border-start-start-radius: var(--radius-splash-sheet);
  border-start-end-radius: var(--radius-splash-sheet);
  background: var(--color-splash-trakt-bg);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--splash-brand-gap);
  margin: 0;
  color: var(--color-splash-muted);
  font-size: var(--font-size-small);

  img {
    inline-size: var(--splash-mark-size);
    block-size: var(--splash-mark-size);
  }

  strong {
    display: block;
    color: var(--color-splash-text);
    font-family: var(--font-headings);
    font-size: var(--font-size-splash-brand);
    font-weight: var(--font-weight-headings);
  }
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--splash-button-gap);
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm-inline);
  min-block-size: var(--splash-button-height);
  border: var(--splash-border-width) solid var(--color-splash-outline);
  border-radius: var(--radius-sm);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-splash-button);
  font-weight: var(--font-weight-headings);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    filter: brightness(0.9);
    text-decoration: none;
  }
}

/* OG's primary red one step darker, so the white label reads at this size. */
.store {
  border-color: var(--color-btn-primary-border);
  background: var(--brand-primary-darken);
}

.apps {
  flex-shrink: 0;
  padding-block: var(--splash-panel-padding-block);
  background: var(--color-splash-apps-bg);

  h2 {
    margin: 0 0 var(--splash-label-gap);
    color: var(--color-splash-muted);
    font-family: var(--font-headings);
    font-size: var(--font-size-splash-label);
    font-weight: var(--font-weight-headings-light);
    letter-spacing: var(--splash-label-tracking);
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    display: flex;
    align-items: center;
    gap: var(--splash-row-gap);
    min-block-size: var(--splash-row-height);
    color: var(--color-splash-text);
    text-decoration: none;
  }

  img {
    flex-shrink: 0;
    inline-size: var(--splash-app-icon);
    block-size: var(--splash-app-icon);
    border-radius: var(--radius-splash-app-icon);
  }
}

.name {
  flex: 1;
  font-family: var(--font-headings);
  font-size: var(--font-size-splash-app);
  font-weight: var(--font-weight-headings);
}

.tag {
  padding: var(--splash-tag-padding);
  border: var(--splash-border-width) solid var(--color-splash-tag-border);
  border-radius: var(--radius-code);
  color: var(--color-splash-muted);
  font-size: var(--font-size-splash-tag);
}

.chevron {
  color: var(--color-splash-chevron);
}
</style>
