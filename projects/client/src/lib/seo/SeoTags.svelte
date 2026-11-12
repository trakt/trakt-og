<!--
  The head's tags, from `toSeoTags`. `SeoHead` renders them on every page; link-preview bots get them alone
  (`crawl/previewHead.ts`).
-->
<script lang="ts">
import type { JsonLd } from './jsonLd/JsonLd.ts';
import { toJsonLdScript } from './toJsonLdScript.ts';
import type { toSeoTags } from './toSeoTags.ts';

type Props = { tags: ReturnType<typeof toSeoTags>; jsonLd?: readonly JsonLd[] };

const { tags, jsonLd = [] }: Props = $props();
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
  {#each jsonLd as data, i (i)}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- toJsonLdScript escapes everything that could end the tag. -->
    {@html toJsonLdScript(data)}
  {/each}
</svelte:head>
