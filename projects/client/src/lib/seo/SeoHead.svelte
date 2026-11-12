<!--
  The one head every page renders: its title, description, robots, canonical URL, Open Graph and Twitter tags, and
  its structured data. Robots come from the route (`toRobots.ts`), so a page only says when its own content isn't
  public. The site-wide tags (`og:site_name`, `og:locale`, `twitter:site`, `twitter:card`) live in app.html.
-->
<script lang="ts">
import { page } from '$app/state';
import type { SeoMeta } from './SeoMeta.ts';
import SeoTags from './SeoTags.svelte';
import { toSeoTags } from './toSeoTags.ts';

const meta: SeoMeta = $props();
const tags = $derived(toSeoTags(meta, { url: page.url, routeId: page.route.id, status: page.status }));
</script>

<SeoTags {tags} jsonLd={meta.jsonLd} />
