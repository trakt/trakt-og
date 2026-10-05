<!--
  The mobile splash in small frames: a phone on iOS and on Android (Rippple is iOS only), a narrow desktop window, which
  is asked to get wider, and a tablet held upright, which is asked to turn sideways. OG had no splash, so there is no OG screenshot to sit next to.
-->
<script lang="ts">
import MobileSplash from '$lib/components/mobile-splash/MobileSplash.svelte';

const frames = [
  { label: 'Phone, iOS', platform: 'ios', preview: 'phone', width: 390, height: 664 },
  { label: 'Phone, Android', platform: 'android', preview: 'phone', width: 390, height: 664 },
  { label: 'Desktop window', platform: 'ios', preview: 'window', width: 700, height: 760 },
  { label: 'Tablet held upright, iOS', platform: 'ios', preview: 'tablet', width: 744, height: 1133 },
] as const;
</script>

<svelte:head>
  <title>Mobile splash · og design system</title>
</svelte:head>

<main>
  <div class="intro">
    <h1>Mobile splash</h1>
    <p>
      <code>MobileSplash</code> wraps the app. Below 768px wide, or on a phone held sideways, it shows instead. The
      store follows the user agent.
    </p>
  </div>

  <div class="frames">
    {#each frames as frame (frame.label)}
      <figure>
        <figcaption>{frame.label}, {frame.width} × {frame.height}</figcaption>
        <div class="frame" style:inline-size="{frame.width}px" style:block-size="{frame.height}px">
          <MobileSplash platform={frame.platform} preview={frame.preview} />
        </div>
      </figure>
    {/each}
  </div>
</main>

<style>
main {
  padding: var(--gutter);
  background: var(--color-page);
  color: var(--color-splash-text);
}

.frames {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--gutter);
}

figure {
  margin: 0;
}

figcaption {
  margin-block-end: var(--space-sm-block);
  color: var(--color-splash-muted);
}

.frame {
  max-inline-size: 100%;
  overflow: auto;
  border-radius: var(--radius-splash-sheet);
}
</style>
