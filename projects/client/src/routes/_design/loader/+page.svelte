<!--
  The liquid-fill loader at every size we use, its reduced-motion breathe, static/loader.svg for places outside Svelte,
  and the shimmering bars that hold a number's or a name's place. Each on a light and a dark ground.
-->
<script lang="ts">
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import TraktLoader from '$lib/components/loading/TraktLoader.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
import type { Snippet } from 'svelte';

const sizes = [16, 32, 64, 128];
const schemes = ['light', 'dark'] as const;
</script>

{#snippet grounds(row: string, sample: Snippet)}
  <div class="grounds">
    {#each schemes as scheme (scheme)}
      <div class="ground" style:color-scheme={scheme} data-row={row}>{@render sample()}</div>
    {/each}
  </div>
{/snippet}

{#snippet animated()}{#each sizes as size (size)}<TraktLoader {size} label="Loading at {size}px" />{/each}{/snippet}
{#snippet reduced()}
  {#each sizes as size (size)}<TraktLoader {size} reducedMotion label="Loading at {size}px" />{/each}
{/snippet}
{#snippet still()}
  {#each sizes as size (size)}<img src="/loader.svg" width={size} height={size} alt="Loading" />{/each}
{/snippet}
{#snippet shimmer()}
  <Shimmer inline="var(--home-flag-size)" block="var(--home-flag-size)" round />
  <Shimmer inline="var(--home-rank-shimmer-name-width)" block="var(--font-size-home-rank-name)" />
  <Shimmer inline="var(--home-live-shimmer-pill-width)" block="var(--home-live-shimmer-pill-height)" />
{/snippet}

<DemoSection title="Animated"
  note="TraktLoader: red rises in a wave behind the monogram until the disc is full, then drains. Below 24px the surface rises flat.">
  {@render grounds('animated', animated)}
</DemoSection>

<DemoSection title="Reduced motion" note="With reduced motion, or reducedMotion, the full mark breathes instead.">
  {@render grounds('reduced', reduced)}
</DemoSection>

<DemoSection title="Static SVG" note="static/loader.svg as a plain img, for places outside Svelte.">
  {@render grounds('static', still)}
</DemoSection>

<DemoSection title="Shimmer" note="Holds a flag's, a name's or a pill's place while it loads.">
  {@render grounds('shimmer', shimmer)}
</DemoSection>

<style>
.grounds {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
  border-radius: var(--radius-object);
  overflow: hidden;
  border: 1px solid var(--color-separator);
}

.ground {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gutter);
  padding: var(--gutter);
  background-color: var(--color-surface);
  color: var(--color-text);
}
</style>
