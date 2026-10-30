<!--
  An allowlisted link in member text. A Trakt link whose path og has a page for opens that page here, in the same
  tab, and a bare URL then reads og.trakt.tv. Anything else opens in a new tab.
-->
<script lang="ts">
import { match } from '$app/paths';
import type { Snippet } from 'svelte';
import { ogLabel, ogPath } from './text/ogPath.ts';

interface Props {
  href: string;
  /** The URL as the member typed it, when the link is a bare URL rather than a `[label](url)`. */
  typed?: string;
  onclick: (event: MouseEvent) => void;
  children: Snippet;
}

const { href, typed, onclick, children }: Props = $props();

const path = $derived(ogPath(href));
let onOg = $state(false);

$effect(() => {
  const candidate = path;
  onOg = false;
  if (!candidate) return;

  let current = true;
  void match(candidate).then((route) => {
    if (current) onOg = route !== null;
  });
  return () => (current = false);
});
</script>

<!-- og's own path, which match() just confirmed. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- One line, so no stray space lands around the link text. -->
{#if onOg && path}<a href={path} {onclick}>{#if typed}{ogLabel(typed)}{:else}{@render children()}{/if}</a>{:else}<a
  {href} target="_blank" rel="ugc nofollow noopener noreferrer" {onclick}>{@render children()}</a>{/if}

<style>
a {
  text-decoration: none;
}
</style>
