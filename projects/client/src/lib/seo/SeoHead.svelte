<!--
  The one head every page renders: its title, description, robots, canonical URL, Open Graph and Twitter tags. Robots come from
  the route (`toRobots.ts`), so a page only says when its own content isn't public. The site-wide tags
  (`og:site_name`, `og:locale`, `twitter:site`, `twitter:card`) live in app.html.
-->
<script lang="ts">
import { page } from '$app/state';
import type { SeoMeta } from './SeoMeta.ts';
import { toSeoTags } from './toSeoTags.ts';

const meta: SeoMeta = $props();
const tags = $derived(toSeoTags(meta, { url: page.url, routeId: page.route.id, status: page.status }));
</script>

<svelte:head>
  <title>{tags.title}</title>
  <meta name="description" content={tags.description} />
  <meta name="robots" content={tags.robots} />
  {#if tags.canonical}<link rel="canonical" href={tags.canonical} />{/if}
  <meta property="og:type" content={tags.og.type} />
  <meta property="og:title" content={tags.og.title} />
  <meta property="og:description" content={tags.og.description} />
  <meta property="og:url" content={tags.og.url} />
  <meta name="twitter:title" content={tags.og.title} />
  <meta name="twitter:description" content={tags.og.description} />
  <meta property="og:image" content={tags.image.url} />
  {#if 'width' in tags.image}
    <meta property="og:image:width" content={String(tags.image.width)} />
    <meta property="og:image:height" content={String(tags.image.height)} />
  {/if}
  <meta property="og:image:alt" content={tags.image.alt} />
  <meta name="twitter:image" content={tags.image.url} />
  <meta name="twitter:image:alt" content={tags.image.alt} />
</svelte:head>
