<!--
  A summary page's hidden extra, if it has one: typing its keys anywhere on the page loads and plays it, and Esc
  stops it. Quiet while you type in a field or hold a modifier, and a cheap no-op on pages without one.
-->
<script lang="ts">
import type { Component } from 'svelte';
import { type ExtraProps, extras } from './extras.ts';
import { typedSequence } from './typedSequence.ts';

interface Props {
  type: 'movie' | 'show';
  id: number;
}

const { type, id }: Props = $props();
const extra = $derived(extras[`${type}:${id}`]);
let typed = { keys: '', at: 0 };
let Playing = $state<Component<ExtraProps> | null>(null);

$effect(() => {
  void extra;
  return () => {
    Playing = null;
    typed = { keys: '', at: 0 };
  };
});

async function play() {
  if (!extra) return;
  const { default: Extra } = await extra.load();
  Playing = Extra;
}

function onkeydown(event: KeyboardEvent) {
  if (!extra) return;
  if (event.key === 'Escape') {
    Playing = null;
    return;
  }
  if (Playing || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return;

  typed = typedSequence(typed, event.key, event.timeStamp, extra.keys);
  if (typed.keys !== extra.keys) return;
  typed = { keys: '', at: 0 };
  play();
}
</script>

<svelte:window {onkeydown} />

{#if Playing}
  <Playing ondone={() => (Playing = null)} />
{/if}
