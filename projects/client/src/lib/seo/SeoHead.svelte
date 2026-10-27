<!--
  The one head every page renders: its title, description, robots, Open Graph and Twitter tags. Robots come from
  the route (`toRobots.ts`), so a page only says when its own content isn't public. The site-wide tags
  (`og:site_name`, `og:locale`, `twitter:site`, `twitter:card`) live in app.html.
-->
<script lang="ts">
import { page } from '$app/state';
import type { SeoMeta } from './SeoMeta.ts';
import { toSeoTags } from './toSeoTags.ts';

const meta: SeoMeta = $props();
const tags = $derived(toSeoTags(meta, { routeId: page.route.id, status: page.status }));
</script>

<svelte:head>
  <title>{tags.title}</title>
  <meta name="description" content={tags.description} />
  <meta name="robots" content={tags.robots} />
  <meta property="og:type" content={tags.og.type} />
  <meta property="og:title" content={tags.og.title} />
  <meta property="og:description" content={tags.og.description} />
  <meta name="twitter:title" content={tags.og.title} />
  <meta name="twitter:description" content={tags.og.description} />
  {#if tags.image}
    <meta property="og:image" content={tags.image.url} />
    <meta property="og:image:alt" content={tags.image.alt} />
    <meta name="twitter:image" content={tags.image.url} />
    <meta name="twitter:image:alt" content={tags.image.alt} />
  {/if}
</svelte:head>
