<!--
  Mounted once in the root layout: on an item's pages that have a header extra, it loads it and plays it for as long
  as the viewer stays under that item. Other pages load nothing.
-->
<script lang="ts">
import { page } from '$app/state';
import { headerExtra } from './headerExtras.ts';

const load = $derived(headerExtra(page.url.pathname));
</script>

{#if load}
  {#await load() then { default: Extra }}<Extra />{/await}
{/if}
