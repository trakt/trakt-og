<!--
  One box in the profile's strip: 200px tall, on a colour gradient (`tone`), on fanart under OG's shade (`image`),
  or on the blurred poster placeholder of an empty box. `children` sits at the top, `bottom` is pinned to the
  bottom edge (titles over fanart), and `foot` is the ruled footer line.
-->
<script lang="ts">
import posterBg from '$lib/assets/poster-bg.jpg';
import type { Snippet } from 'svelte';

interface Props {
  tone?: 'about' | 'stats';
  /** Fanart behind the box. An empty string or `null` keeps the plain card colour. */
  image?: string | null;
  /** The empty box's blurred posters. */
  placeholder?: boolean;
  children?: Snippet;
  bottom?: Snippet;
  foot?: Snippet;
}

const { tone, image, placeholder = false, children, bottom, foot }: Props = $props();
</script>

<div class={['box', tone, { pictured: image !== undefined && !tone, placeholder }]}>
  {#if placeholder}
    <span class="backdrop blurred" style:background-image="url({posterBg})"></span>
  {:else if image}
    <img class="backdrop" src={image} alt="" decoding="async" />
  {/if}
  {#if children}<div class="top">{@render children()}</div>{/if}
  {#if bottom}<div class="bottom">{@render bottom()}</div>{/if}
  {#if foot}<p class="foot">{@render foot()}</p>{/if}
</div>

<style>
.box {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  block-size: var(--profile-box-height);
  padding: var(--profile-box-padding-block) var(--profile-box-padding);
  background-color: var(--color-card-bg);

  /* OG's .shade over the image: clear at the top, near black at the bottom. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: var(--gradient-profile-box-shade);
  }

  &.pictured {
    --color-profile-chip: var(--color-profile-chip-image);
  }

  &.placeholder::before {
    background-image: none;
  }

  &.about::before {
    background-image: var(--gradient-profile-about);
  }

  &.stats::before {
    background-image: var(--gradient-profile-stats);
  }

  :global(a) {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.blurred {
  background-color: var(--color-profile-placeholder-bg);
  background-size: var(--profile-placeholder-size);
  opacity: var(--opacity-profile-placeholder);
  filter: blur(var(--profile-placeholder-blur));
}

.bottom {
  position: absolute;
  inset: auto var(--profile-box-padding) var(--profile-box-padding-block);
}

.foot {
  position: absolute;
  inset: auto var(--profile-box-padding) var(--profile-box-foot-inset);
  margin: 0;
  padding-block-start: var(--profile-box-foot-gap);
  border-block-start: 1px solid var(--color-profile-track);
  overflow: hidden;
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
