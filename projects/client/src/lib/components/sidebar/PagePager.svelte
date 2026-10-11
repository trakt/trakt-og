<!--
  A paged list's line in a SidebarFrame sidebar, a SidebarPager: back, "Page 2 of 20" as a menu of OG's page window
  (the first and last pages and the ones around this one), forward.
    <PagePager current={2} total={20} href={(n) => pageHref(page.url, n)} />
-->
<script lang="ts">
import { type PageSlot, pageWindow } from '$lib/components/pagination/pageWindow';
import SidebarPager from './SidebarPager.svelte';

interface Props {
  current: number;
  total: number;
  href: (page: number) => string;
}

const { current, total, href }: Props = $props();

// The window's runs of pages, split where it skips some.
const runs = $derived(
  pageWindow(current, total).reduce<number[][]>(
    (all, slot: PageSlot) => slot === 'gap' ? [...all, []] : [...all.slice(0, -1), [...(all.at(-1) ?? []), slot]],
    [[]],
  ),
);
const format = (n: number) => n.toLocaleString('en-US');
</script>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarPager unit="page" label="Page {format(current)} of {format(total)}" menuLabel="Pick a page"
  prevHref={current > 1 ? href(current - 1) : undefined} nextHref={current < total ? href(current + 1) : undefined}>
  {#each runs as run, i (run.at(0))}
    {#if i > 0}<hr />{/if}
    <ul>
      {#each run as n (n)}
        <li><a href={href(n)} aria-current={n === current ? 'page' : undefined}>Page {format(n)}</a></li>
      {/each}
    </ul>
  {/each}
</SidebarPager>
