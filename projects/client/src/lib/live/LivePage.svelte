<!--
  `/live`, for directors while it's tried out: the world map as big as the screen allows, with every country in a
  scrolling column beside it. It opens on the home page's snapshot; the socket then brings a new count every few
  seconds, so dots fade, pings ring out, rows slide and shares roll as they change. Ready for VIPs later: a viewer
  without VIP keeps the still map, with a way to VIP.
  Four toggles, all off until turned on: Night shading dims where it's night, Tour when idle walks the top countries'
  cards after 10 seconds without the mouse, Keep screen on holds off the screen's sleep, and Full screen shows only
  the map and the countries.
-->
<script lang="ts">
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import LinkButton from '#lib/components/button/LinkButton.svelte';
import PanelHeading from '#lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '#lib/components/dashboard/PanelHelp.svelte';
import StatusDot from '#lib/components/status/StatusDot.svelte';
import CountryRanking from '#lib/components/worldmap/CountryRanking.svelte';
import WorldMap from '#lib/components/worldmap/WorldMap.svelte';
import worldDotsFine from '#lib/components/worldmap/worldDotsFine.json' with { type: 'json' };
import type { HomeLive } from '#lib/home/live/toHomeLive.ts';
import globe from '#lib/icons/solid/globe.svg?raw';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { staticSeo } from '#lib/seo/pages/staticSeo.ts';
import { traktUrls } from '#lib/traktUrls.ts';
import { onMount } from 'svelte';
import { createLiveSocket } from './createLiveSocket.svelte.ts';

interface Props {
  data: { vip: boolean; live: Promise<HomeLive | null> };
}

const { data }: Props = $props();
const TOUR_IDLE_MS = 10_000;
const TOUR_STEP_MS = 4000;
const TOUR_COUNTRIES = 8;
const SECOND_MS = 1000;
/** Shares on this page keep a place after the point, so a small change still shows. */
const DIGITS = 1;

const socket = createLiveSocket();
let snapshot = $state.raw<HomeLive | null>(null);
$effect(() => {
  const pending = data.live;
  void pending.then((next) => {
    if (pending === data.live && next) snapshot = next;
  });
});
$effect(() => (data.vip ? socket.connect() : undefined));
const live = $derived(socket.live ?? snapshot);
const countries = $derived(live?.countries ?? null);

onMount(() => {
  if (!data.vip) useTrack(AnalyticsEvent.VipGate).track({ feature: 'live' });
});

const count = new Intl.NumberFormat('en-US');

let now = $state(Date.now());
$effect(() => {
  if (!data.vip) return;
  const clock = setInterval(() => (now = Date.now()), SECOND_MS);
  return () => clearInterval(clock);
});
const updated = $derived.by(() => {
  if (!data.vip) return 'Updated every 15 minutes';
  if (socket.status === 'offline') return 'Reconnecting…';
  if (socket.at === null) return 'Connecting…';
  const seconds = Math.max(0, Math.floor((now - socket.at) / SECOND_MS));
  return seconds < 2 ? 'Updated just now' : `Updated ${seconds}s ago`;
});

let lit = $state<string | null>(null);
let night = $state(false);
let tour = $state(false);
let awake = $state(false);
let full = $state(false);
let page = $state<HTMLElement>();

// Tour when idle: after 10 seconds without the mouse, the top countries' cards take turns; moving it stops them.
let touring = false;
let movedAt = Date.now();
function moved() {
  movedAt = Date.now();
  if (!touring) return;
  touring = false;
  lit = null;
}
$effect(() => {
  if (!tour) return;
  movedAt = Date.now();
  addEventListener('pointermove', moved);
  let turn = 0;
  const step = setInterval(() => {
    if (Date.now() - movedAt < TOUR_IDLE_MS) return;
    const top = (countries ?? []).filter(({ watching }) => watching).slice(0, TOUR_COUNTRIES);
    const next = top.at(turn % Math.max(top.length, 1));
    turn += 1;
    touring = next !== undefined;
    lit = next?.code ?? null;
  }, TOUR_STEP_MS);
  return () => {
    clearInterval(step);
    removeEventListener('pointermove', moved);
    if (touring) lit = null;
    touring = false;
  };
});

// Keep screen on: a wake lock while the page is visible; the browser drops it when the tab hides, so it asks again.
$effect(() => {
  if (!awake) return;
  let lock: WakeLockSentinel | null = null;
  let stopped = false;
  const hold = () => {
    if (document.hidden) return;
    navigator.wakeLock
      ?.request('screen')
      .then((held) => {
        if (stopped) void held.release();
        else lock = held;
      })
      .catch(() => (awake = false));
  };
  hold();
  document.addEventListener('visibilitychange', hold);
  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', hold);
    void lock?.release();
  };
});

$effect(() => {
  const changed = () => (full = document.fullscreenElement === page);
  document.addEventListener('fullscreenchange', changed);
  return () => document.removeEventListener('fullscreenchange', changed);
});
function toggleFull() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void page?.requestFullscreen().catch(() => undefined);
}
</script>

<SeoHead {...staticSeo['/live']} />

<div class="live" bind:this={page}>
  <div class="frame">
  <section class="world" aria-labelledby="live-title" aria-busy={!live}>
    <!-- The home band's heading and help line; the page's own h1 is for screen readers. -->
    <h1 class="said">Trakt Worldwide, live</h1>
    <header>
      <PanelHeading id="live-title" title="Trakt Worldwide" icon={globe}>
        {#snippet aside()}
          <p class="status">{#if data.vip}<StatusDot kind="live" />{/if}{updated}</p>
        {/snippet}
      </PanelHeading>
      <PanelHelp>
        {#if live}
          Watching right now in {count.format(live.countries.length)} countries.
        {:else}
          Watching right now…
        {/if}
      </PanelHelp>
    </header>

    {#if !data.vip}
      <p class="gate">
        Watching it change as it happens is for VIP members. This is the map from the last 15 minutes.
        <LinkButton href={traktUrls.vipFor('live')}>Go VIP</LinkButton>
      </p>
    {/if}

    <div class="map">
      <WorldMap
        {countries}
        bind:lit
        digits={DIGITS}
        {night}
        fit
        ambient={socket.status === 'live'}
        world={worldDotsFine}
        label="World map of where people are watching right now"
      >
        {#snippet tools()}
          <div class="tools" role="group" aria-label="Map options">
            <LinkButton variant="outline" pressed={night} onclick={() => (night = !night)}>Night shading</LinkButton>
            <LinkButton variant="outline" pressed={tour} onclick={() => (tour = !tour)}>Tour when idle</LinkButton>
            <LinkButton variant="outline" pressed={awake} onclick={() => (awake = !awake)}>Keep screen on</LinkButton>
            <LinkButton variant="outline" pressed={full} onclick={toggleFull}>Full screen</LinkButton>
          </div>
        {/snippet}
      </WorldMap>
    </div>
  </section>

  <aside class="side" aria-label="Countries, by share of everyone on the map">
    <div class="list">
      <CountryRanking {countries} bind:lit digits={DIGITS} />
    </div>
  </aside>
  </div>
</div>

<style>
.live {
  container-type: inline-size;
  padding-block-start: var(--header-height);
  background: var(--color-home-band);
  color: var(--color-home-text);

  &:fullscreen {
    padding-block-start: 0;
  }
}

.frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--live-side-width);
  block-size: calc(100dvh - var(--header-height));
}

.live:fullscreen .frame {
  block-size: 100dvh;
}

/* A section, which og's base styles fill with the surface gray; the page keeps the home band's. */
.world {
  background: var(--color-home-band);
  display: flex;
  flex-direction: column;
  gap: var(--live-gap);
  min-inline-size: 0;
  min-block-size: 0;
  padding-block: var(--live-padding-block);
  padding-inline: var(--live-gutter) var(--space-lg-inline);
}

/* Said to screen readers only; the band's heading shows it. */
.said {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.gate {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline) var(--space-md-inline);
  align-items: center;
  margin: 0;
  color: var(--color-home-muted);
}

.status {
  display: inline-flex;
  gap: var(--space-sm-inline);
  align-items: center;
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--color-home-muted);
  font-variant-numeric: tabular-nums;
}

.map {
  display: grid;
  flex: 1;
  min-block-size: 0;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--live-tools-gap);
}

.side {
  display: grid;
  min-block-size: 0;
  border-inline-start: 1px solid var(--color-home-line);
}

.list {
  min-block-size: 0;
  padding: var(--live-side-list-padding);
  overflow-y: auto;
  scrollbar-width: thin;
}

/* A tablet stacks the countries under the map, which takes its own shape. */
@container (width < 900px) {
  .frame {
    grid-template-columns: minmax(0, 1fr);
    block-size: auto;
  }

  .map {
    block-size: var(--live-stacked-map-height);
  }

  .side {
    border-inline-start: 0;
    border-block-start: 1px solid var(--color-home-line);
  }
}
</style>
