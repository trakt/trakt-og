<!--
  The current Trakt logo mark, from Trakt's branding page: the stroked mark in white on a brand violet rounded square.
  The about page's Trakt API banner and the mobile splash's Trakt app use it; og's own pages keep the classic red mark
  (TraktMark). `disc` is the branding page's round version, for beside a name in running text.
-->
<script lang="ts">
const { label, disc = false }: { label?: string; disc?: boolean } = $props();
</script>

<svg
  class="trakt-logo-mark"
  viewBox="0 0 48 48"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#if disc}<circle cx="24" cy="24" r="24" />{:else}<rect width="48" height="48" rx="10.8" />{/if}
  <g transform="translate(9.6 9.6) scale(0.47213)">
    <path d="M56.00 38.95A27.5 27.5 0 1 1 36.19 3.20" />
    <path d="M16.93 27.11L35.82 42.96M29.92 34.75L53.89 6.17M56.69 18.31L42.49 35.24M26.88 22.41L23.36 19.45" />
  </g>
</svg>

<style>
svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

rect,
circle {
  fill: var(--brand-violet);
}

g {
  fill: none;
  stroke: var(--color-text-inverse);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
