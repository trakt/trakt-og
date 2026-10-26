<!--
  A summary page's hidden extra, if it has one: typing its keys anywhere on the page loads and plays it, and Esc
  stops it. Quiet while you type in a field or hold a modifier, and a cheap no-op on pages without one.
-->
<script lang="ts">
import type { Component } from 'svelte';
import { type ExtraProps, extras } from './extras.ts';
import { pageKey } from './pageKey.ts';
import { typedSequence } from './typedSequence.ts';

interface Props {
  type: 'movie' | 'show';
  id: number;
}

const { type, id }: Props = $props();
const extra = $derived(extras[`${type}:${id}`]);
let typed = { keys: '', at: 0 };
let loading = false;
// Keys typed between waking an extra and it being ready, so none are lost while it loads.
let pending = '';
let Playing = $state<Component<ExtraProps> | null>(null);
let woke = $state<string>();

$effect(() => {
  void extra;
  return () => {
    Playing = null;
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
    Playing = null;
    return;
  }
  if (Playing) return;
  const key = pageKey(event);
  if (!key) return;

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
</script>

<svelte:window {onkeydown} />

{#if Playing}
  <Playing {woke} ondone={() => (Playing = null)} />
{/if}
