<!--
  Frankenstein's monster for the coming-soon card: a square green head with flat-top hair and neck bolts, wearing the
  Trakt mark as its face. Pure artwork, so its colors stay in the SVG.
-->
<script lang="ts">
import TraktMark from '$lib/components/brand/TraktMark.svelte';
</script>

<svg
  role="img"
  aria-label="Frankenstein's monster with a square green head, flat-top hair and neck bolts. His face is the round Trakt logo."
  viewBox="20 20 480 380"
>
  <radialGradient id="reanimated-rays" cx="250" cy="280" r="250" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ed1c24" stop-opacity="0.75" />
    <stop offset="0.65" stop-color="#ed1c24" stop-opacity="0.45" />
    <stop offset="1" stop-color="#ed1c24" stop-opacity="0" />
  </radialGradient>
  <g fill="url(#reanimated-rays)">
    <path d="M250 280 L60 0 L140 0Z" />
    <path d="M250 280 L300 0 L380 0Z" />
    <path d="M250 280 L500 60 L500 140Z" />
    <path d="M250 280 L500 360 L500 440Z" />
    <path d="M250 280 L0 120 L0 200Z" />
    <path d="M250 280 L0 420 L0 500Z" />
  </g>
  <g class="zap" fill="#f0ad4e" stroke="#111" stroke-width="4" stroke-linejoin="round">
    <path d="M60 30 L120 30 L90 110 L130 110 L40 240 L68 140 L30 140Z" />
    <path d="M430 40 L480 40 L456 104 L490 104 L410 214 L432 132 L400 132Z" />
  </g>
  <g stroke="#111" stroke-width="5">
    <rect x="62" y="222" width="40" height="44" rx="4" fill="#6e7a83" />
    <rect x="38" y="232" width="28" height="24" rx="3" fill="#aaa" />
    <rect x="398" y="222" width="40" height="44" rx="4" fill="#6e7a83" />
    <rect x="434" y="232" width="28" height="24" rx="3" fill="#aaa" />
  </g>
  <rect x="100" y="70" width="300" height="300" rx="22" fill="#16a085" stroke="#111" stroke-width="5" />
  <rect x="112" y="134" width="276" height="18" rx="8" fill="#0f7a64" />
  <g transform="translate(250 262) scale(2) translate(-49.05 -49.05)">
    <TraktMark face="#c8eadf" ink="#0f5e4e" />
  </g>
  <path
    fill="#111"
    d="M92 128 L92 46 L408 46 L408 128 L392 110 L374 134 L354 106 L334 136 L314 106 L294 136 L274 106 L254 136 L234 106 L214 136 L194 106 L174 136 L154 106 L134 134 L116 110Z"
  />
  <g stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none">
    <path
      d="M118 296 L146 352 M116.6 310.8 L130.6 303.6 M125 327.6 L139 320.4 M133.4 344.4 L147.4 337.2"
    />
    <path d="M382 166 L382 232 M374 178 h16 M374 199 h16 M374 220 h16" />
  </g>
</svg>

<style>
svg {
  display: block;
  inline-size: 100%;
  block-size: auto;
}

/* The lightning stutters like a bad bulb. */
.zap {
  animation: zap 4s linear infinite;
}

@keyframes zap {
  0%,
  100% {
    opacity: 1;
  }
  6% {
    opacity: 0.2;
  }
  8% {
    opacity: 1;
  }
  11% {
    opacity: 0.4;
  }
  13% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .zap {
    animation: none;
  }
}
</style>
