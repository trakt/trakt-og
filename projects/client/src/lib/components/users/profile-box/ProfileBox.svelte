<!--
  One card in the profile's strip: 200px tall, on a colour gradient (`tone`), on fanart under OG's shade (`image`), or
  plain. The `label` (Title Case, drawn in caps) sits at the top with at most one `pill` beside it (its scope or count,
  as a TagPill) or an `aside` of its own, which can stand alone (Watch Time's tabs); with neither, there's no head. `top` sits under the label; everything else, `children` sits on the bottom edge, over the
  `foot`: a tinted, blurred band the full width of the box.
  A colour box can set a `mark`, its icon faint behind the corner, and draws its text without shadows. Fanart, or
  anything a box marks `zoom`, grows a little under the pointer.
-->
<script lang="ts">
import TagPills from '#lib/components/labels/TagPills.svelte';
import BoxLabel from './BoxLabel.svelte';
import Icon from '#lib/icons/Icon.svelte';
import type { Snippet } from 'svelte';

interface Props {
  label?: string;
  /** One TagPill beside the label: "Last 30 Days", "2,310 rated", "Today". */
  pill?: string | null;
  /** Something other than a pill beside the label: Featured List's poster count. */
  aside?: Snippet;
  tone?: 'about' | 'stats' | 'binge' | 'ratings' | 'finished' | 'genre';
  /** A raw icon SVG, from `#lib/icons`, faint behind a colour box's corner. */
  mark?: string;
  /** Fanart behind the box. Left out or `null`, the plain card colour. */
  image?: string | null;
  /** Content that hangs from the label instead of sitting on the bottom edge. */
  top?: Snippet;
  children?: Snippet;
  foot?: Snippet;
}

const { label, pill, aside, tone, mark, image, top, children, foot }: Props = $props();
</script>

<div class={['box', tone, { toned: tone }]}>
  {#if image}<img class="backdrop zoom" src={image} alt="" decoding="async" />{/if}
  {#if mark}<span class="mark"><Icon svg={mark} /></span>{/if}
  {#if label || aside || pill}
    <div class="head">
      {#if label}<BoxLabel text={label} />{/if}
      {#if aside}{@render aside()}{:else if pill}<TagPills tags={[{ text: pill }]} />{/if}
    </div>
  {/if}
  {#if top}{@render top()}{/if}
  <div class="body">
    {#if children}{@render children()}{/if}
    {#if foot}<div class="foot">{@render foot()}</div>{/if}
  </div>
</div>

<style>
.box {
  --color-tag-pill-bg: var(--color-profile-box-pill-bg);
  /* Stats at the boxes' small size: icons and numbers under titles and charts. */
  --font-size-stat-number: var(--font-size-small);
  --font-size-stat-noun: var(--font-size-small);
  --font-size-stat-icon: var(--font-size-small);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  block-size: var(--profile-box-height);
  padding: var(--profile-box-padding-top) var(--profile-box-padding) var(--profile-box-padding-block);
  border-radius: var(--radius-profile-box);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-profile-box-edge);
  color: var(--color-card-text);
  /* Dark in both themes, like the strip, so the pills and stats take their dark colours. */
  color-scheme: dark;

  /* OG's .shade over the image: a touch at the top for the label, near black at the bottom. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: var(--gradient-profile-box-shade);
  }

  /* Flat colour needs no shadow to stay readable, and a stat's colour icon would sink into it: white instead. */
  &.toned {
    --text-shadow-headings: none;
    --text-shadow-profile-label: none;
    --color-stat-count: var(--color-profile-ink-soft);
    --color-stat-watched: var(--color-profile-ink-soft);
    --color-stat-noun: var(--color-profile-ink-soft);
  }

  /* Only art needs frosting: on flat colour the blur would pull in what's around the card. */
  &:not(.toned) .foot {
    backdrop-filter: blur(var(--profile-box-band-blur));
  }

  &.about::before {
    background-image: var(--gradient-profile-about);
  }

  &.stats::before {
    background-image: var(--gradient-profile-stats);
  }

  &.binge::before {
    background-image: var(--gradient-profile-binge);
  }

  &.ratings::before {
    background-image: var(--gradient-profile-ratings);
  }

  &.finished::before {
    background-image: var(--gradient-profile-finished);
  }

  &.genre::before {
    background-image: var(--gradient-profile-genre);
  }

  :global(a) {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }

  :global(.zoom) {
    transition: scale var(--transition-profile-box-zoom);
  }

  &:hover :global(.zoom) {
    scale: var(--scale-profile-box-zoom);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.zoom) {
      transition: none;
    }
  }
}

.head {
  display: flex;
  align-items: center;
  min-block-size: var(--profile-box-head-height);
  justify-content: space-between;
  gap: var(--profile-box-head-gap);
}


.body {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  margin-block-start: auto;
}

.mark {
  position: absolute;
  inset-block-start: var(--profile-box-watermark-top);
  inset-inline-end: var(--profile-box-watermark-end);
  z-index: -1;
  color: var(--color-profile-watermark);
  font-size: var(--profile-box-watermark-size);
  line-height: 1;
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.foot {
  margin: var(--profile-box-band-gap) calc(-1 * var(--profile-box-padding))
    calc(-1 * var(--profile-box-padding-block));
  padding: var(--profile-box-band-padding) var(--profile-box-padding);
  overflow: hidden;
  background-color: var(--color-profile-box-band);
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-small);
  white-space: nowrap;
  text-overflow: ellipsis;

  :global(b) {
    color: var(--color-card-text);
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings);
  }
}
</style>
