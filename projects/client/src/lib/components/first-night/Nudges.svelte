<!--
  A new member's next-step nudges: a small card in the corner right after they cross a threshold (their first
  watch, three watchlisted, five ratings, 25 titles) or come back on a later day. One at a time, each only once,
  and only in their first 30 days. "Pick services" opens the taste picker in place.
-->
<script lang="ts">
import { browser } from '$app/environment';
import { isRecentMember } from '$lib/firstNight/gettingStarted';
import { nextNudge, type Nudge, type NudgeCounts, nudgeCounts, nudgeMemory, welcomeBack } from '$lib/firstNight/nudges';
import { overlay } from '$lib/overlay/overlay';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import CtaLink from './CtaLink.svelte';

interface Props {
  slug: string;
  firstName: string;
  joinedAt: string | null;
  taste: { country: string; services: readonly string[]; genres: readonly string[] };
}

const { slug, firstName, joinedAt, taste }: Props = $props();

const active = $derived(browser && isRecentMember(joinedAt));
let current = $state<Nudge | null>(null);
let tuning = $state(false);
let tasteWanted = $state(false);
let before: NudgeCounts | null = null;

function show(nudge: Nudge) {
  // The welcome wall has its own counter, so the first-watch nudge waits for a tap somewhere else.
  if (nudge.key === 'first-watch' && document.querySelector('.first-night')) return;
  const memory = nudgeMemory.read(slug);
  if (memory.seen.includes(nudge.key)) return;
  nudgeMemory.write(slug, { ...memory, seen: [...memory.seen, nudge.key] });
  current = nudge;
}

// A later day's first visit says welcome back; every visit records the day.
$effect(() => {
  if (!active) return;
  const today = new Date().toISOString().slice(0, 10);
  const memory = nudgeMemory.read(slug);
  if (memory.lastVisit && memory.lastVisit !== today) show(welcomeBack(firstName));
  nudgeMemory.write(slug, { ...nudgeMemory.read(slug), lastVisit: today });
});

// The first counts are the baseline; only what changes after that can earn a nudge.
$effect(() => {
  if (!active) return;
  const after = nudgeCounts(overlay.slices());
  if (!after) return;
  if (before) {
    const nudge = nextNudge({ before, after, hasServices: taste.services.length > 0, slug });
    if (nudge) show(nudge);
  }
  before = after;
});

function act() {
  if (!current?.action.href) {
    tasteWanted = true;
    tuning = true;
  }
  current = null;
}
</script>

{#if current}
  <aside class="nudge" aria-live="polite" aria-label="Next step">
  <button type="button" class="close" aria-label="Dismiss"
    onclick={() => (current = null)}><Icon svg={xmark} /></button>
  <p class="when">{current.when}</p>
  <p class="title">{current.title}</p>
  <p class="text">{current.text}</p>
  <CtaLink href={current.action.href} external={current.action.external} onclick={act}>{current.action.label}</CtaLink>
</aside>
{/if}

{#if active && tasteWanted}
  {#await import('./TasteSetup.svelte') then { default: TasteSetup }}
    <TasteSetup bind:open={tuning} country={taste.country} services={taste.services} genres={taste.genres} />
  {/await}
{/if}

<style>
.nudge {
  position: fixed;
  inset-block-end: var(--gutter);
  inset-inline-start: var(--gutter);
  z-index: var(--z-header);
  display: grid;
  gap: 6px;
  justify-items: start;
  inline-size: min(var(--nudge-width), calc(100vw - 2 * var(--gutter)));
  padding: 16px 18px;
  border-radius: var(--radius-object);
  background: var(--first-night-glow), var(--color-first-night-side);
  box-shadow: var(--nudge-shadow);
  color: var(--color-first-night-text);
  animation: rise 0.3s ease-out;

  p {
    margin: 0;
  }
}

.close {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  padding: 4px;
  border: 0;
  background: none;
  color: var(--color-first-night-dim);
  cursor: pointer;
}

.when {
  color: var(--color-first-night-gold);
  font-size: var(--font-size-first-night-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
}

.title {
  font-size: var(--font-size-large);
  font-weight: 800;
}

.text {
  margin-block-end: 6px;
  color: var(--color-first-night-muted);
}

@keyframes rise {
  from {
    opacity: 0;
    translate: 0 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nudge {
    animation: none;
  }
}
</style>
