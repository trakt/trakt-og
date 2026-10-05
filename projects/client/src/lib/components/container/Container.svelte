<!--
  OG's fixed-width page column:
  full width with a half-gutter each side on phones, then 740, 960 and 1160px wide from 768, 992 and 1200px, and
  never wider. Pages put their content in one of these inside the layout's <main>. Only OG's frame pages (the
  sidebar lists) ran full width; they don't use this.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { children }: { children: Snippet } = $props();
</script>

<div class="container">
  {@render children()}
</div>

<style>
.container {
  margin-inline: auto;
  padding-inline: calc(var(--gutter) / 2);

  @media (min-width: 768px) {
    inline-size: var(--container-sm);
  }

  @media (min-width: 992px) {
    inline-size: var(--container-md);
  }

  @media (min-width: 1200px) {
    inline-size: var(--container-lg);
  }
}
</style>
