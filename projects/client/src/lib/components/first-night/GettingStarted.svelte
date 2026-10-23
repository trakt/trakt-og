<!--
  The header's getting-started pill for a member's first 30 days: a ring and "2 of 6", opening a ticket book of six
  things to do. Each ticket is stamped from the member's own data as they go. It leaves once all six are stamped,
  or when the member hides it.
-->
<script lang="ts">
import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import PromptPopover from '$lib/components/prompt/PromptPopover.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import eye from '$lib/icons/regular/eye.svg?raw';
import restore from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import { gettingStartedSteps, isRecentMember, type StartMarks, type StartStep } from '$lib/firstNight/gettingStarted';
import { pickBookQuote } from '$lib/firstNight/bookQuotes';
import { savedName } from '$lib/firstNight/savedName.svelte';
import { wallClosed } from '$lib/firstNight/wallClosed.svelte';
import { liveMarks } from '$lib/firstNight/liveMarks.svelte';
import { overlay } from '$lib/overlay/overlay';

interface Props {
  slug: string;
  named: boolean;
  joinedAt: string | null;
}

const { slug, named, joinedAt }: Props = $props();
const uid = $props.id();
// A new line each time the page loads; the book only renders in the browser, so the server never picks one.
const line = pickBookQuote();
const anchor = `--getting-started-${uid}`;

const marks = $derived<StartMarks>(browser ? liveMarks.get(slug) : {});
const steps = $derived(
  gettingStartedSteps({ slices: overlay.slices(), slug, named: named || !!savedName.value, marks }),
);
const doneCount = $derived(steps?.filter((step) => step.done).length ?? 0);
const shown = $derived(
  browser && !!steps && isRecentMember(joinedAt) && !marks.hidden && doneCount < (steps?.length ?? 0),
);
const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
let popover = $state<HTMLDivElement>();

function mark(next: StartMarks) {
  liveMarks.mark(slug, next);
}

// Each page's welcome comes back from here once skipped, and only on its own page: the wall on the dashboard,
// the tickets on your profile.
const saved = $derived(browser ? dashboardPrefs.load(slug).hide_first_night : false);
const onDashboard = $derived(page.url.pathname === '/dashboard');
const onProfile = $derived(['/users/me', `/users/${slug}`].includes(page.url.pathname));
const reopen = $derived(
  onDashboard && wallClosed.value(saved)
    ? { label: 'Show the welcome wall', icon: eye, run: reopenWall }
    : onProfile && marks.heroHidden
    ? { label: 'Show my tickets', icon: restore, run: reopenHero }
    : null,
);

async function reopenWall() {
  dashboardPrefs.save(slug, { ...dashboardPrefs.load(slug), hide_first_night: false });
  wallClosed.set(false);
  popover?.hidePopover();
  await invalidateAll();
}

function reopenHero() {
  mark({ heroHidden: false });
  popover?.hidePopover();
}

function open(step: StartStep) {
  if (step.key === 'apps') mark({ apps: true });
  popover?.hidePopover();
}
</script>

<!-- A film or TV line about getting to work, and whose it is. -->
{#snippet heading()}
  <span class="heading"><q>{line.quote}</q><small>{line.from}</small></span>
{/snippet}


<!-- A ticket links to a step's page or an external app page, from a string resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if shown && steps}
  <button type="button" class="pill" popovertarget="getting-started-{uid}" style:anchor-name={anchor}>
    <svg class="ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="track" cx="12" cy="12" r={RADIUS}></circle>
      <circle class="value" cx="12" cy="12" r={RADIUS} stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={CIRCUMFERENCE * (1 - doneCount / steps.length)}></circle>
    </svg>
    Getting started · {doneCount} of {steps.length}
  </button>
  <PromptPopover id="getting-started-{uid}" {anchor} title={heading} tone="brand" size="book" arrow
  bind:element={popover}>
    <ol class="book">
      {#each steps as step (step.key)}
        <li class={['ticket', { done: step.done }]}>
          <a href={step.href} target={step.external ? '_blank' : undefined} rel={step.external ? 'noopener' : undefined}
            onclick={() => open(step)}>
            <span class="admit">Admit one</span>
            <span class="name">{step.name}</span>
            <span class="text">{step.text}</span>
          </a>
          {#if step.done}<span class="stamp" aria-label="Done">Admitted</span>{/if}
        </li>
      {/each}
    </ol>
    {#snippet footer()}
      {#if reopen}
        <span class="reopen">
          <GlassAction card glass icon={reopen.icon} onclick={reopen.run}>{reopen.label}</GlassAction>
        </span>
      {/if}
      <GlassAction card glass icon={ban} onclick={() => mark({ hidden: true })}>Skip this</GlassAction>
    {/snippet}
  </PromptPopover>
{/if}

<style>
/* A link pill like the main nav's, the ring in front of the label. */
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--header-pill-height);
  padding-inline: var(--space-header-pill-inline);
  border: 0;
  border-radius: var(--radius-header-pill);
  background: var(--color-getting-started-pill);
  color: var(--color-getting-started-pill-text);
  font: inherit;
  font-size: var(--font-size-getting-started-pill);
  font-weight: var(--font-weight-headings-heavy);
  white-space: nowrap;
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--color-getting-started-pill-hover);
  }
}

.ring {
  inline-size: 22px;
  block-size: 22px;
  rotate: -90deg;

  circle {
    fill: none;
    stroke-width: 4;
  }

  .track {
    stroke: var(--color-getting-started-ring-track);
  }

  .value {
    stroke: var(--brand-primary);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.3s ease;
  }
}

.book {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 12px;
  list-style: none;
}

/* A ticket stub: notches cut from both sides. */
.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs-inline) var(--space-sm-inline);

  q {
    quotes: '\201C' '\201D';
  }

  small {
    color: var(--color-getting-started-muted);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    letter-spacing: var(--letter-spacing-first-night-label);
    text-transform: uppercase;
  }
}

/* Bringing a welcome back leads the footer, apart from Skip this at its end. */
.reopen {
  display: contents;

  /* The page's control, washed in the brand red over its own fill so it reads in either theme. */
  & > :global(*) {
    margin-inline-end: auto;
    border-color: color-mix(in srgb, var(--brand-primary) var(--reopen-tint-line), var(--color-control-border));
    background: color-mix(in srgb, var(--brand-primary) var(--reopen-tint), var(--color-control-bg));
    color: var(--color-control-text);
  }

  & > :global(*:is(:hover, :focus-visible)) {
    background: color-mix(in srgb, var(--brand-primary) var(--reopen-tint-hover), var(--color-control-bg));
  }

  & :global(svg) {
    color: var(--brand-primary);
  }
}

.ticket {
  position: relative;
  border-radius: 8px;
  background: var(--color-ticket);
  color: var(--color-ticket-text);
  mask:
    radial-gradient(circle 7px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
    radial-gradient(circle 7px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;

  a {
    display: grid;
    gap: 2px;
    padding: 12px 14px 12px 18px;
    color: inherit;
    text-decoration: none;
  }

  &:not(.done) a:is(:hover, :focus-visible) {
    background: var(--color-ticket-hover);
  }

  /* A stamped ticket goes grey, a step off the book's own background so it doesn't sink into it. */
  &.done {
    background: var(--color-ticket-used);
    color: var(--color-ticket-used-text);
  }
}

.admit {
  color: var(--color-ticket-admit);
  font-size: 11px;
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.12em;
  text-transform: uppercase;

  .done & {
    color: inherit;
  }
}

.name {
  font-weight: var(--font-weight-headings-heavy);
}

.text {
  font-size: var(--font-size-small);
}

.stamp {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-end: 10px;
  padding-inline: 5px;
  border: 2px solid var(--brand-primary);
  border-radius: 4px;
  color: var(--brand-primary);
  font-size: 12px;
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  rotate: -8deg;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .ring .value {
    transition: none;
  }
}
</style>
