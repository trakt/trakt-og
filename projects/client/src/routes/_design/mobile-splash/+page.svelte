<!--
  The mobile splash in small frames: a phone on iOS and on Android (Rippple is iOS only), a narrow desktop window, which
  is asked to get wider, and a tablet held upright, which is asked to turn sideways. OG had no splash, so there is no OG screenshot to sit next to.
-->
<script lang="ts">
import MobileSplash from '$lib/components/mobile-splash/MobileSplash.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';

const frames = [
  { label: 'Phone, iOS', platform: 'ios', preview: 'phone', width: 390, height: 664 },
  { label: 'Phone, Android', platform: 'android', preview: 'phone', width: 390, height: 664 },
  { label: 'Desktop window', platform: 'ios', preview: 'window', width: 700, height: 760 },
  { label: 'Tablet held upright, iOS', platform: 'ios', preview: 'tablet', width: 744, height: 1133 },
] as const;
</script>

<Specimen title="Frames" row
  note="MobileSplash wraps the app. Below 768px wide, or on a phone held sideways, it shows instead. The store follows the user agent.">
  {#each frames as frame (frame.label)}
    <Variant label="{frame.label}, {frame.width} × {frame.height}">
      <div class="frame" style:inline-size="{frame.width}px" style:block-size="{frame.height}px">
        <MobileSplash platform={frame.platform} preview={frame.preview} />
      </div>
    </Variant>
  {/each}
</Specimen>

<style>
.frame {
  max-inline-size: 100%;
  overflow: auto;
  border-radius: var(--radius-splash-sheet);
}
</style>
