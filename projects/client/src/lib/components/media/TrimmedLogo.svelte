<!--
  A show or movie logo cut to its lettering (trimLogo), sitting at the bottom left of its space. While it's trimmed a
  short shimmering bar holds its place; then the space grows to the logo's height and the logo fades in. Where it goes
  sets its size, room and shadow with custom properties on a parent: `--trimmed-logo-width`, `--trimmed-logo-height`,
  `--trimmed-logo-margin-start`, `--trimmed-logo-margin-end` and `--trimmed-logo-filter`. `src` must be same-origin
  (`proxiedLogoUrl`), or it shows as it is.
    <TrimmedLogo src={proxiedLogoUrl(card.logo)} alt={card.title} />
-->
<script lang="ts">
import { trimLogo } from '$lib/utils/trimLogo';

interface Props {
  src: string;
  /** The title the logo spells. */
  alt: string;
  loading?: 'eager' | 'lazy';
}

const { src, alt, loading = 'eager' }: Props = $props();
</script>

<img class="trimmed-logo" {src} {alt} {loading} decoding="async" data-trim {@attach trimLogo(src)} />

<style>
.trimmed-logo {
  display: block;
  margin-block: var(--trimmed-logo-margin-start, 0) var(--trimmed-logo-margin-end, 0);
  max-inline-size: var(--trimmed-logo-width, 100%);
  max-block-size: var(--trimmed-logo-height, none);
  object-fit: contain;
  object-position: left bottom;
  filter: var(--trimmed-logo-filter, none);
}

/*
  Waiting to be trimmed: a short bar in the logo's place, its own pixels moved out of the box so only the shimmer
  shows. Without a script it turns into the logo as it is after a while.
*/
.trimmed-logo[data-trim] {
  inline-size: var(--trimmed-logo-placeholder-width);
  block-size: var(--trimmed-logo-placeholder-height);
  border-radius: var(--radius-tag);
  background: var(--trimmed-logo-shimmer) 0 0 / 200% 100%;
  object-position: var(--trimmed-logo-offstage);
  filter: none;
  animation:
    shimmer var(--trimmed-logo-shimmer-duration) linear infinite,
    fallback 0s var(--trimmed-logo-fallback) forwards;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}

@keyframes fallback {
  to {
    inline-size: auto;
    block-size: auto;
    background: none;
    object-position: left bottom;
    filter: var(--trimmed-logo-filter, none);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trimmed-logo[data-trim] {
    animation: fallback 0s var(--trimmed-logo-fallback) forwards;
  }
}
</style>
