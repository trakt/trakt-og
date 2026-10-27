<!--
  OG Redux is for tablets and computers. Below 768px wide, or on a phone held sideways, this covers the app with a
  splash, over an fsociety mask from Mr. Robot that glitches now and then: Trakt's own app and Mobile Web first, then
  other apps that sync with Trakt. A tablet held upright is asked to turn sideways, and a narrow desktop window to get
  wider. CSS decides, so the first paint is already right. The app still renders under it for every user agent, so a
  search engine's phone crawler indexes the real page; `covering` makes it inert while the splash is up. The server
  picks the store from the user agent.
  `preview` forces the splash on for the design-system demo.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import fanart from '$lib/assets/mobile-splash-fsociety.jpg';
import traktTime from '$lib/assets/apps/trakt-time.svg';
import showly from '$lib/assets/apps/showly.png';
import rippple from '$lib/assets/apps/rippple.png';
import TraktLogoMark from '$lib/components/brand/TraktLogoMark.svelte';
import TraktMark from '$lib/components/brand/TraktMark.svelte';
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
  /** The app, under the splash. */
  children?: Snippet;
  /** The splash is up: keyboard focus and assistive tech can't reach the app under it. */
  covering?: boolean;
  preview?: 'phone' | 'tablet' | 'window';
}

const { platform, phone = false, children, covering = false, preview }: Props = $props();
const links = $derived(toSplashLinks(platform));
const storeIcon = $derived(platform === 'ios' ? apple : googlePlay);
const appIcons = { 'trakt-time': traktTime, showly, rippple };
const headingId = $props.id();
const GREETING = 'hello, friend.';
const TYPE_DELAY_MS = 600;
const TYPE_STEP_MS = 100;
let typed = $state(0);

/*
 * Types the greeting a letter at a time. Timers rather than one CSS animation per letter, which Safari left half typed.
 * Hidden (OG fits) or with reduced motion, it's all there at once.
 */
function typeOut(node: HTMLElement) {
  if (!node.getClientRects().length || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed = GREETING.length;
    return;
  }

  let timer = setTimeout(function next() {
    typed += 1;
    if (typed < GREETING.length) timer = setTimeout(next, TYPE_STEP_MS);
  }, TYPE_DELAY_MS);
  return () => clearTimeout(timer);
}
</script>

{#if children}
  <div class="app" inert={covering}>{@render children()}</div>
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
    <div class="fanart" aria-hidden="true"></div>
    <div class="message">
      <p class="greeting">
        <span class="visually-hidden">{GREETING}</span>
        <span class="typed" aria-hidden="true" {@attach typeOut}>{GREETING.slice(0, typed)}</span>
      </p>
      <h1 id={headingId}>
        <span class="phone">{@render ogRedux()} is made for bigger screens.</span>
        <span class="tablet">Turn your tablet sideways.</span>
        <span class="window">{@render ogRedux()} needs a wider window.</span>
      </h1>
      <p>
        <span class="phone">Open it on a tablet or computer. On your phone, try one of these.</span>
        <span class="tablet">OG Redux needs a little more width. Rotate and it opens right here.</span>
        <span class="window">Make it wider and OG Redux opens right here. Or try one of these.</span>
      </p>
    </div>
  </div>

  <div class="trakt">
    <p class="brand">
      <span class="trakt-mark"><TraktLogoMark disc /></span>
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
            <img src={appIcons[app.id]} alt="" width="34" height="34" loading="lazy" />
            <span class="name">{app.name}</span>
            <span class="tag">{app.tag}</span>
            <span class="chevron"><Icon svg={angleRight} /></span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</section>

<!-- The home page's lockup: the red mark stands in for the O. -->
{#snippet ogRedux()}
  <span class="visually-hidden">OG Redux</span>
  <span class="og-redux" aria-hidden="true">
    <svg class="mark" viewBox="0 0 98.1 98.1"><TraktMark ink="var(--brand-primary)" /></svg><span class="g">G</span>
    Redux
  </span>
{/snippet}

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
 * desktop window with the dev tools docked below keeps OG). The layout makes the app inert on the same query
 * (TOO_SMALL_FOR_OG).
 */
@media (width < 768px) or ((pointer: coarse) and (height < 500px)) {
  /*
   * The page under the splash is boxed to the screen and clipped, fixed header included. Wider than the screen, it
   * would widen a phone's layout viewport and push the splash off its right edge.
   */
  .app {
    display: block;
    block-size: 100dvh;
    overflow: clip;
    contain: paint;
  }

  .splash {
    display: flex;
  }

  /*
   * The splash covers the screen, over the app's header and a page's extras, and scrolls itself when it's taller (a
   * phone held sideways), with its scrollbar hidden. The page under it can't scroll, so a desktop set to always show
   * scrollbars draws no empty tracks.
   */
  .splash:not(.preview) {
    position: fixed;
    inset: 0;
    z-index: var(--z-mobile-splash);
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
  justify-content: flex-end;
  padding-block: var(--splash-hero-padding-block);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: var(--gradient-splash-scrim);
  }
}

/*
 * The fanart, with two tinted copies on top that flash in as red and cyan bands for a moment each cycle, like the
 * show's title cards. Only their opacity and transform change, so a glitch costs no repaint.
 */
.fanart {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: hidden;
  background: var(--splash-fanart) var(--splash-fanart-position) / cover no-repeat;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: inherit;
    background-blend-mode: multiply;
    mix-blend-mode: screen;
    opacity: 0;
    animation: glitch var(--splash-glitch-cycle) steps(1) infinite;
  }

  &::before {
    background-color: var(--color-splash-glitch-red);
    clip-path: var(--splash-glitch-bands-red);
  }

  &::after {
    background-color: var(--color-splash-glitch-cyan);
    clip-path: var(--splash-glitch-bands-cyan);
    animation-delay: var(--splash-glitch-lag);
  }
}

@keyframes glitch {
  0%,
  88%,
  93% {
    opacity: 0;
    transform: none;
  }

  89% {
    opacity: var(--splash-glitch-opacity);
    transform: translate(calc(-1 * var(--splash-glitch-shift)), 0);
  }

  90% {
    opacity: var(--splash-glitch-opacity);
    transform: translate(var(--splash-glitch-shift), var(--splash-glitch-drop));
  }

  91% {
    opacity: var(--splash-glitch-opacity);
    transform: translate(calc(-0.5 * var(--splash-glitch-shift)), calc(-1 * var(--splash-glitch-drop)));
  }

  92% {
    opacity: var(--splash-glitch-fade);
    transform: translate(calc(0.3 * var(--splash-glitch-shift)), calc(2 * var(--splash-glitch-drop)));
  }
}

/* "hello, friend." types itself once (typeOut), then the cursor keeps blinking. */
.greeting {
  margin: 0;
  color: var(--color-splash-lede);
  font-family: var(--font-mono);
  font-size: var(--font-size-splash-greeting);
}

.typed {
  white-space: pre;

  &::after {
    content: '';
    display: inline-block;
    inline-size: var(--splash-cursor-width);
    block-size: var(--splash-cursor-height);
    vertical-align: var(--splash-cursor-baseline);
    background: var(--brand-primary);
    animation: blink var(--splash-cursor-blink) steps(1) infinite;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fanart::before,
  .fanart::after,
  .typed::after,
  .og-redux {
    animation: none;
  }
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

/* The home page's lockup at headline size, jolted along with the glitch. */
.og-redux {
  display: inline-block;
  white-space: nowrap;
  animation: glitch-lockup var(--splash-glitch-cycle) steps(1) infinite;
}

.mark {
  inline-size: var(--home-mark-size);
  block-size: var(--home-mark-size);
  margin-inline-end: var(--home-mark-gap);
  vertical-align: var(--splash-og-mark-baseline);
}

.g {
  color: var(--brand-primary);
}

@keyframes glitch-lockup {
  0%,
  88%,
  92% {
    transform: none;
  }

  89% {
    transform: translateX(calc(-0.5 * var(--splash-glitch-shift)));
  }

  90% {
    transform: translateX(calc(0.3 * var(--splash-glitch-shift)));
  }
}

.message p:not(.greeting) {
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

  strong {
    display: block;
    color: var(--color-splash-text);
    font-family: var(--font-headings);
    font-size: var(--font-size-splash-brand);
    font-weight: var(--font-weight-headings);
  }
}

.trakt-mark {
  flex-shrink: 0;
  inline-size: var(--splash-mark-size);
  block-size: var(--splash-mark-size);
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

/* Trakt's violet, like the Trakt app it opens. */
.store {
  border-color: var(--brand-violet);
  background: var(--brand-violet);
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
