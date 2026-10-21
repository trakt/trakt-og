<!--
  OG's `#summary-wrapper`: the full-bleed fanart at the top of every movie, show, season, episode and person page.
  It runs under the fixed site header, so its height includes --header-height. `children` is the title block,
  pinned to the bottom of the page container; `stats` is the dark strip along the bottom edge; `edges` sits over the
  whole header, for the previous and next arrows.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { headerArt } from '$lib/components/header/headerArt';

interface Props {
  image?: string;
  /** Episodes use a sufficiently large screenshot, falling back to show fanart on failure. */
  screenshot?: string;
  /** Subpages ("Comments") use the short header. */
  slim?: boolean;
  /** Where the fanart's crop sits, as a `background-position`. Left out, near the top, like OG. */
  position?: string;
  dropped?: boolean;
  /** Bottom right, over the art: where the fanart is from (the person page's tag bar). Hidden on phones. */
  caption?: Snippet;
  children: Snippet;
  stats?: Snippet;
  /** Stats pages for seasons and episodes have a 55px ratings strip. */
  statsHeight?: string;
  /** A toolbar runs right under the header (the season links, a subpage's filters), so the strip's dividers take its
   color instead of the page's. */
  subnav?: boolean;
  edges?: Snippet;
}

const {
  image,
  screenshot,
  slim = false,
  position,
  dropped = false,
  caption,
  children,
  stats,
  statsHeight,
  subnav = false,
  edges,
}: Props = $props();
let loadedScreenshot = $state<string>();
const loadScreenshot: Attachment<HTMLElement> = () => {
  loadedScreenshot = undefined;
  if (!screenshot) return;
  const candidate = new Image();
  candidate.onload = () => {
    if (candidate.naturalWidth >= 1024 || candidate.naturalHeight >= 720 || matchMedia('(width < 768px)').matches) {
      loadedScreenshot = screenshot;
    }
  };
  candidate.src = screenshot;
  return () => {
    candidate.onload = null;
  };
};
const backdrop = $derived(loadedScreenshot ?? image);
</script>

<section
  class={['fanart-header', { slim, dropped, 'with-stats': stats }]}
  style:--stats-height={statsHeight}
  style:--color-strip-divider={subnav ? 'var(--color-toolbar-bg)' : undefined}
  style:background-image={backdrop ? `url("${backdrop}")` : undefined}
  style:background-position={position}
  {@attach loadScreenshot}
  {@attach headerArt(backdrop)}
>
  {#if dropped}<span class="dropped-layer"></span>{/if}
  <div class="shadow-base">
  </div>
  {@render edges?.()}
  <div class="summary">
    {@render children()}
    {#if caption}<div class="caption">{@render caption()}</div>{/if}
  </div>
  {#if stats}
    <div class="stats">
      <div class="stats-inner">{@render stats()}</div>
    </div>
  {/if}
</section>

<style>
.fanart-header {
  --stats-height: 60px;
  --item-nav-band: 0px; /* what the previous and next arrows center above: the strip, when there is one */
  --stats-padding-block: 10px; /* above and below the strip's content; a full-height divider reaches past it */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  block-size: calc(var(--fanart-header-height) + var(--header-height));
  background-color: var(--color-page);
  background-position: 50% 10%;
  background-size: cover;
  color: var(--color-card-text);

  &.slim {
    block-size: calc(var(--fanart-header-height-slim) + var(--header-height));
  }

  &.with-stats {
    --item-nav-band: var(--stats-height);
  }

  &.slim.with-stats {
    block-size: calc(var(--fanart-header-height-slim) + var(--stats-height) + var(--header-height));
  }
}

.dropped-layer {
  position: absolute;
  inset: 0;
  background: var(--gradient-dropped);
}

.shadow-base {
  position: absolute;
  inset-inline: 0;
  inset-block-end: var(--stats-height);
  block-size: 120px;
  background: var(--gradient-shadow-header);

  .fanart-header:not(.with-stats) & {
    inset-block-end: 0;
  }
}

/* OG's #fanart-info, hidden on phones. */
/* At the bottom right of the title block, so it lines up with the content column's right edge. */
.caption {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: calc(var(--gutter) / 2);
  max-inline-size: var(--fanart-caption-max-width);

  /* A tag bar sits on the corner, not above a title. */
  & :global(.title-tags) {
    margin: 0;
  }

  @media (width < 768px) {
    display: none;
  }
}

/* OG pinned the title block 70px above the bottom edge (10px on a slim header without stats). */
.summary {
  position: relative;
  inline-size: 100%;
  max-inline-size: var(--container-lg);
  margin-inline: auto;
  margin-block-end: 70px;
  padding-inline: calc(var(--gutter) / 2);

  .fanart-header:not(.with-stats) & {
    margin-block-end: 10px;
  }

  & :global(h1) {
    margin: 0;
    line-height: 1.2;
    text-shadow: var(--text-shadow-headings);
  }
}

/* A size container, so the ratings strip inside can reach the page edge (`100cqi`) past the content column. */
.stats {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  container-type: inline-size;
  background-color: var(--color-stats-bar);
}

.stats-inner {
  max-inline-size: var(--container-lg);
  min-block-size: var(--stats-height);
  margin-inline: auto;
  padding: var(--stats-padding-block) calc(var(--gutter) / 2);
}

@media (width < 1200px) {
  .summary,
  .stats-inner {
    max-inline-size: var(--container-md);
  }
}

@media (width < 992px) {
  .summary,
  .stats-inner {
    max-inline-size: var(--container-sm);
  }
}
</style>
