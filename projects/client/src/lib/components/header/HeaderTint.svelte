<!--
  The color layer behind the header's glass: the page's backdrop (`--header-art`, set by headerArt) blurred and darkened
  until it's a wash of the art's colors. It fills its positioned parent and sits under the parent's content. Pages
  without art leave it empty, so the glass stays neutral.
-->
<span class="header-tint" aria-hidden="true"></span>

<style>
.header-tint {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: -60px;
    background: var(--header-art, none) center 25% / cover no-repeat;
    filter: var(--blur-header-art);
    opacity: var(--opacity-header-art);
  }
}
</style>
