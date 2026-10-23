<!--
  An empty dashboard panel's prompt: a film line over that film's fanart, what fills the panel, and one thing to do.
  With `picks`, the quote stacks on the left and the picks fill the right, so the panel can be filled in place.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { type PanelQuote, quoteFanart } from '$lib/firstNight/panelQuotes';

interface Props {
  quote: PanelQuote;
  text: string;
  actions?: Snippet;
  picks?: Snippet;
  /** A taller banner, for a panel with nothing beside it. */
  tall?: boolean;
  /** More room under it, for a panel with no footer below. */
  roomy?: boolean;
}

const { quote, text, actions, picks, tall = false, roomy = false }: Props = $props();

let art = $state<string>();
$effect(() => {
  let current = true;
  void quoteFanart(quote).then((url) => {
    if (current) art = url;
  });
  return () => {
    current = false;
  };
});
</script>

<div class={['frame', { roomy }]}>
  <div class={['panel-prompt', { stacked: !!picks, tall }]}>
  <figure class="quote" style:--focus={quote.focus}>
    {#if art}<img src={art} alt="" loading="lazy" />{/if}
    <span class="veil"></span>
    <figcaption>
      <span class="film">{quote.film}</span>
      <q>{quote.quote}</q>
      <span class="text">{text}</span>
      {#if actions}<span class="actions">{@render actions()}</span>{/if}
    </figcaption>
  </figure>
  {#if picks}
    <div class="picks">{@render picks()}</div>
  {/if}
  </div>
</div>

<style>
/* Every panel's prompt leaves the same room under it. */
.frame {
  container-type: inline-size;
  margin-block-end: var(--panel-prompt-bottom);

  /* The same room under the content in all, less whatever padding the panel already keeps there. */
  &.roomy {
    margin-block-end: calc(var(--panel-prompt-bottom-roomy) - var(--panel-prompt-offset, 0px));
  }
}

.panel-prompt {
  display: grid;
  gap: var(--gutter);
  padding-block-start: var(--gutter);

  &.stacked {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: stretch;

    @container (width < 760px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

.quote {
  position: relative;
  display: grid;
  align-content: center;
  min-block-size: var(--panel-prompt-min-height);
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-object);
  background: var(--color-first-night-bg);
  color: var(--color-first-night-text);

  img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    object-position: var(--focus, center);
  }

  .stacked & {
    align-content: end;
  }

  /* A tall banner keeps its text at the bottom, like the ones beside picks. */
  .tall & {
    align-content: end;
    min-block-size: var(--panel-prompt-tall-height);
  }
}

.veil {
  position: absolute;
  inset: 0;
  background: var(--panel-prompt-veil);

  .stacked & {
    background: var(--panel-prompt-veil-stacked);
  }
}

figcaption {
  position: relative;
  display: grid;
  gap: 8px;
  max-inline-size: var(--panel-prompt-text-width);
  padding: var(--panel-prompt-padding);
}

.film {
  color: var(--color-first-night-gold);
  font-size: var(--font-size-first-night-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
}

q {
  font-family: var(--font-headings);
  font-size: var(--font-size-panel-prompt-quote);
  font-weight: 800;
  line-height: 1.08;
  quotes: '\201C' '\201D';

  .stacked & {
    font-size: var(--font-size-panel-prompt-quote-stacked);
  }
}

.text {
  color: var(--color-first-night-muted);
  font-size: var(--font-size-panel-prompt-text);
  text-wrap: balance;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-block-start: 4px;
}

.picks {
  container-type: inline-size;
  min-inline-size: 0;

  & :global(.poster-grid-frame) {
    margin-block-end: 0;
  }

  & :global(.poster-grid) {
    padding-block-start: 0;
  }
}
</style>
