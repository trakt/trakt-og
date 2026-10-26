<!--
  A summary page's hidden extra, if it has one: typing its keys anywhere on the page, or clicking its small switch,
  loads and plays it. The switch joins something already on the page: the first segment of a bar (the tag bar over
  the title) or a row of a list (the sidebar's sections). It stays lit while it plays, and a second click or
  Esc lets it play its way out; Esc stops the others at once. Keys stay quiet
  while you type in a field or hold a modifier, and pages without an extra render nothing. Mount it last on the page,
  so the switch is the last thing Tab reaches.
-->
<script lang="ts">
import type { Component } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { type ExtraProps, extras } from './extras.ts';
import { pageKey } from './pageKey.ts';
import { typedSequence } from './typedSequence.ts';

interface Props {
  type: 'movie' | 'show';
  id: number;
  /** The signed-in viewer's username, handed to the extra. */
  viewer?: string;
}

const { type, id, viewer }: Props = $props();
const extra = $derived(extras[`${type}:${id}`]);
let typed = { keys: '', at: 0 };
let loading = false;
// Keys typed between waking an extra and it being ready, so none are lost while it loads.
let pending = '';
let Playing = $state<Component<ExtraProps> | null>(null);
let woke = $state<string>();
let stopping = $state(false);

$effect(() => {
  void extra;
  return () => {
    Playing = null;
    stopping = false;
    typed = { keys: '', at: 0 };
    pending = '';
  };
});

async function play() {
  if (!extra || loading) return;
  loading = true;
  try {
    const { default: Extra } = await extra.load();
    woke = pending;
    pending = '';
    Playing = Extra;
  } finally {
    loading = false;
  }
}

function onkeydown(event: KeyboardEvent) {
  if (!extra) return;
  if (event.key === 'Escape') {
    // A switched-on extra plays its way out, as a second click would; the others stop at once.
    if ('spot' in extra && Playing) stopping = true;
    else Playing = null;
    return;
  }
  if (Playing) return;
  const key = pageKey(event);
  if (!key) return;

  if ('spot' in extra) return;
  if ('wakes' in extra) {
    if (!extra.wakes.test(key)) return;
    pending += key;
    play();
    return;
  }
  typed = typedSequence(typed, key, event.timeStamp, extra.keys);
  if (typed.keys !== extra.keys) return;
  typed = { keys: '', at: 0 };
  play();
}
function flick() {
  if (!Playing) play();
  else stopping = true;
}

function done() {
  Playing = null;
  stopping = false;
}

// The switch joins its bar as the first segment, like a subpage's label, or its list as a row after the one it names.
// Without that on the page, there's none.
const pin: Attachment<HTMLElement> = (node) => {
  const spot = extra && 'spot' in extra ? extra.spot : undefined;
  const host = spot && document.querySelector('leads' in spot ? spot.leads : spot.follows);
  if (!spot || !host) node.hidden = true;
  else if ('leads' in spot) host.prepend(node);
  else host.after(node);
  return () => node.remove();
};
</script>

<svelte:window {onkeydown} />

{#if extra && 'spot' in extra && 'follows' in extra.spot}
  <li class="row" {@attach pin}>
    <button
      class={['spot', { on: Playing }]}
      type="button"
      aria-pressed={Boolean(Playing)}
      style:--spot={extra.spot.color}
      onclick={flick}
    >
      {extra.spot.label}
    </button>
  </li>
{:else if extra && 'spot' in extra && 'leads' in extra.spot}
  <button
    class={['spot', 'segment', { on: Playing }]}
    type="button"
    aria-label={extra.spot.label}
    aria-pressed={Boolean(Playing)}
    style:--spot={extra.spot.color}
    onclick={flick}
    {@attach pin}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d={extra.spot.path} /></svg>
  </button>
{/if}

{#if Playing}
  <Playing {woke} {viewer} stop={stopping} ondone={done} />
{/if}

<style>
.spot {
  svg {
    inline-size: 14px;
    block-size: 14px;
    filter: drop-shadow(0 0 2px var(--spot));
  }

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.3;
  }
}

/* A segment of the bar like its other parts: a quiet icon that fills on hover, and lights up while it's on. */
.segment {
  --spot-ink: #021216;
  display: inline-flex;
  align-items: center;
  block-size: 100%;
  min-block-size: 0;
  padding-block: 0;
  padding-inline: var(--title-tags-padding);
  /* Like the bar's label: the rounded end crowds the start, so the end gives a little back to read even. */
  padding-inline-end: var(--title-tags-label-padding-end);
  border: 0;
  border-inline-end: 1px solid var(--color-title-tags-divider);
  background: none;
  color: var(--spot);
  cursor: pointer;
  transition: background-color var(--transition-card), color var(--transition-card), box-shadow var(--transition-card);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-title-tags-hover);
    outline: none;
  }

  &.on {
    background-color: var(--spot);
    color: var(--spot-ink);
    box-shadow: inset 0 0 10px rgb(255 255 255 / 60%), 0 0 14px var(--spot);
  }
}

/* A row of the list like its other sections: gray capitals, turning to the hover color, and its own color while on. */
.row {
  border-block-end: 1px solid var(--color-summary-separator);

  .spot {
    display: block;
    inline-size: 100%;
    padding-block: 7px;
    padding-inline: 0;
    border: 0;
    background: none;
    color: var(--color-summary-label);
    font-family: var(--font-headings);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-headings);
    text-align: start;
    text-transform: uppercase;
    cursor: pointer;
    transition: color var(--transition-card);

    &:is(:hover, :focus-visible) {
      color: var(--color-summary-hover);
    }

    &.on {
      color: var(--spot);
    }

    &:focus-visible {
      outline: 1px solid var(--spot);
      outline-offset: 2px;
    }
  }
}
</style>
