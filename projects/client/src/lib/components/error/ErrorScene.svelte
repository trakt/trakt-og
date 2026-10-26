<!--
  A full-screen error, dressed as a show or movie: the copy on the theme's tint at the left, the still fading in from
  30% across with one animated layer over it (snow, falling code, scanlines...). The big code is decoration; the label
  above it is the heading. Under the quote, the source's tag links to its page, a summary's tag bar with the speaker
  after the slash. The caller's actions lead the button row, then Trakt's status and support pages, tinted in the
  theme's accent. `preview` fills its frame instead of the screen, for the design-system demo.
    <ErrorScene theme={matrix} code="500" label="Error 500 · Something broke" body="...">
      {#snippet actions()}<LinkButton onclick={retry}>Try again</LinkButton>{/snippet}
    </ErrorScene>
-->
<script lang="ts">
import LinkButton from '$lib/components/button/LinkButton.svelte';
import TitleTags from '$lib/components/summary/TitleTags.svelte';
import Icon from '$lib/icons/Icon.svelte';
import lifeRing from '$lib/icons/solid/life-ring.svg?raw';
import spaceStationMoon from '$lib/icons/solid/space-station-moon.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import type { Snippet } from 'svelte';
import type { ErrorSceneTheme } from './ErrorSceneTheme.ts';
import { animateScene } from './animateScene.ts';

interface Props {
  theme: ErrorSceneTheme;
  /** The status code, or a word ("Offline") when there's none. */
  code: string;
  label: string;
  body: string;
  actions: Snippet;
  preview?: boolean;
}

const { theme, code, label, body, actions, preview = false }: Props = $props();
const headingId = $props.id();
const word = $derived(!/^\d+$/.test(code));
const source = $derived([
  { title: theme.source, href: theme.href },
  ...(theme.speaker ? [{ title: theme.speaker }] : []),
]);
</script>

<section
  class={['error-scene', { preview }]}
  style:--error-scene-tint="var({theme.tint})"
  style:--error-scene-accent="var({theme.accent})"
  style:--error-scene-art={theme.art ? `url('${theme.art}')` : undefined}
  style:--error-scene-art-position={theme.artPosition}
  aria-labelledby={headingId}
>
  <div class="art" aria-hidden="true">
    {#key theme.motion}<canvas {@attach animateScene(theme.motion)}></canvas>{/key}
  </div>

  <div class="copy">
    <div class="message">
      <h1 id={headingId}>{label}</h1>
      <p class={['code', { word }]} aria-hidden="true">{code}</p>
      <figure>
        <blockquote><p>“{theme.quote}”</p></blockquote>
        <figcaption><TitleTags links={source} /></figcaption>
      </figure>
      <p class="body">{body}</p>
      <div class="actions">
        {@render actions()}
        <LinkButton href={traktUrls.status} variant="tinted" arrow={false}>
          <span class="tint"><Icon svg={spaceStationMoon} /></span> Status
        </LinkButton>
        <LinkButton href={traktUrls.support} variant="tinted" arrow={false}>
          <span class="tint"><Icon svg={lifeRing} /></span> Support
        </LinkButton>
      </div>
    </div>
  </div>
</section>

<style>
.error-scene {
  position: relative;
  isolation: isolate;
  display: flex;
  min-block-size: 100dvh;
  overflow: hidden;
  color-scheme: dark;
  background: var(--error-scene-tint);
  color: var(--color-error-scene-text);
  font-family: var(--font-body);
}

.preview {
  min-block-size: 100%;
}

/* The still and its motion, dissolving into the tint through two eased masks: in from the left, out at the bottom. */
.art {
  position: absolute;
  inset: 0 0 0 var(--error-scene-art-start);
  z-index: -1;
  background: var(--error-scene-art, none) var(--error-scene-art-position, center) / cover no-repeat;
  mask-image: var(--error-scene-fade-x), var(--error-scene-fade-y);
  mask-composite: intersect;
}

canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  color: var(--error-scene-accent);
}

.copy {
  display: grid;
  inline-size: min(var(--error-scene-copy-width), var(--error-scene-copy-share));
  box-sizing: content-box;
  padding: var(--error-scene-padding-block) var(--error-scene-padding-inline);
}


.message {
  display: grid;
  align-content: center;
  gap: var(--error-scene-gap);
}

h1 {
  margin: 0;
  color: var(--error-scene-accent);
  font-family: var(--font-mono);
  font-size: var(--font-size-error-scene-label);
  font-weight: normal;
  letter-spacing: var(--error-scene-label-tracking);
  text-transform: uppercase;
}

.code {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-error-scene-code);
  font-weight: bold;
  line-height: 0.85;
  letter-spacing: var(--error-scene-code-tracking);
  color: transparent;
  -webkit-text-stroke: var(--error-scene-code-stroke) var(--color-error-scene-text);

  &.word {
    font-size: var(--font-size-error-scene-code-word);
  }
}

figure {
  display: grid;
  gap: var(--error-scene-gap);
  margin: 0;
}

blockquote {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--font-size-error-scene-quote);
  font-style: italic;
  line-height: var(--line-height-error-scene-quote);
  text-wrap: balance;

  p {
    margin: 0;
  }
}

.body {
  color: var(--color-error-scene-muted);
}

figcaption {
  display: flex;
}

.body {
  max-inline-size: var(--error-scene-body-measure);
  margin: 0;
  font-size: var(--font-size-error-scene-body);
  text-wrap: balance;
}

.actions {
  --link-button-tint: var(--error-scene-accent);

  display: flex;
  flex-wrap: wrap;
  gap: var(--error-scene-actions-gap);
}

.tint {
  display: contents;
  color: var(--error-scene-accent);
}
</style>
