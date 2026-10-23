<!--
  In place of the stat boxes when you view your own profile with nothing watched or collected: the profile as a
  movie poster that's still "coming soon", beside the getting-started book's six tickets in the same order and names.
  Each is admitted from the member's own data as they go; a name set here retitles the poster. Skip this hides it
  here, and the book offers it back while you're on your profile.
-->
<script lang="ts">
import { browser } from '$app/environment';
import Container from '$lib/components/container/Container.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import TeamQuickFollow from '$lib/components/first-night/TeamQuickFollow.svelte';
import NamePrompt from '$lib/components/first-night/NamePrompt.svelte';
import jellyfin from '$lib/assets/apps/jellyfin.svg?raw';
import { gettingStartedSteps, type StartStep } from '$lib/firstNight/gettingStarted';
import { liveMarks } from '$lib/firstNight/liveMarks.svelte';
import { savedName } from '$lib/firstNight/savedName.svelte';
import { wallClosed } from '$lib/firstNight/wallClosed.svelte';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import Icon from '$lib/icons/Icon.svelte';
import apple from '$lib/icons/brands/apple.svg?raw';
import ban from '$lib/icons/regular/ban.svg?raw';
import googlePlay from '$lib/icons/brands/google-play.svg?raw';
import check from '$lib/icons/solid/check.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import listThick from '$lib/icons/trakt/list-thick.svg?raw';
import plex from '$lib/icons/trakt/plex.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  /** The poster's title: the display name, else the username. */
  displayName: string;
  /** Whether a display name is set; until then the hero asks for one. */
  named: boolean;
  slug: string;
}

const { displayName, named, slug }: Props = $props();
const id = $props.id();

const title = $derived(savedName.value ?? displayName);
const steps = $derived(
  browser
    ? gettingStartedSteps({
      slices: overlay.slices(),
      slug,
      named: named || !!savedName.value,
      marks: liveMarks.get(slug),
    })
    : null,
);
const skipped = $derived(browser && !!liveMarks.get(slug).heroHidden);

/** The Remote Control step's ways in, each opening the app store or the sync settings. */
const crew = [
  { label: 'Trakt for iOS', icon: apple, href: traktUrls.appStore },
  { label: 'Trakt for Android', icon: googlePlay, href: traktUrls.googlePlay, color: 'var(--color-site-google-play)' },
  { label: 'Connect Plex', icon: plex, href: traktUrls.syncSettings, color: 'var(--color-site-plex)' },
  { label: 'Connect Jellyfin', icon: jellyfin, href: traktUrls.syncSettings, color: 'var(--color-site-jellyfin)' },
];

const openedApps = () => liveMarks.mark(slug, { apps: true });

// With the welcome wall closed, "What have you seen?" goes to the trending shows instead.
const wallGone = $derived(browser && wallClosed.value(dashboardPrefs.load(slug).hide_first_night));

/** Each credit's button in its action's color: watched purple, watchlist blue, ratings red. */
const tints: Partial<Record<StartStep['key'], { color: string; icon: string }>> = {
  pilot: { color: 'var(--brand-tertiary)', icon: checkThick },
  watchlist: { color: 'var(--brand-secondary)', icon: listThick },
  ratings: { color: 'var(--brand-primary)', icon: heart },
};
</script>

{#snippet action(step: StartStep)}
  {#if step.done}
    <span class="stamp">Admitted</span>
  {:else if step.key === 'name'}
    <NamePrompt quiet onsaved={() => {}} />
  {:else if step.key === 'apps'}
    <!-- The footer's ghost logo buttons, each lit in its brand's color under the pointer. -->
    <ul class="crew">
      {#each crew as way (way.label)}
        <li style:--glass-action-ghost-hover-icon={way.color}>
          <Tooltip text={way.label}>
            {#snippet trigger(tooltip)}
              <GlassAction card ghost square icon={way.icon} href={way.href} target="_blank" rel="noopener"
                aria-label={way.label} onclick={openedApps} {...tooltip} />
            {/snippet}
          </Tooltip>
        </li>
      {/each}
    </ul>
  {:else if step.key === 'follows'}
    <TeamQuickFollow />
  {:else}
    {@const tint = tints[step.key]}
    <GlassAction href={step.key === 'pilot' && wallGone ? '/shows/trending' : step.href} color={tint?.color}
  icon={tint?.icon} target={step.external ? '_blank' : undefined} rel={step.external ? 'noopener' : undefined}>
      {step.action}
    </GlassAction>
  {/if}
{/snippet}

{#if !skipped}
  <section class="welcome" aria-labelledby={id}>
  <Container>
    <div class="layout">
      <div class="one-sheet" role="img" aria-label="Your profile as a movie poster, coming soon">
        <span class="frame" aria-hidden="true"></span>
        <span class="presents">Trakt Pictures presents</span>
        <span class="title">{title}<small>a watch history</small></span>
        <span class="billing">
            Starring every show you finish · with the movies you swore you'd see · and the episodes you watched at 2am ·
            rated PG for pretty good taste
          </span>
        <span class="soon">Coming soon</span>
      </div>
      <div class="credits">
          <div class="head">
            <h2 {id}>Six tickets to opening night.</h2>
            <GlassAction card glass icon={ban} onclick={() => liveMarks.mark(slug, { heroHidden: true })}>
              Skip this
            </GlassAction>
          </div>
          {#if steps}
            <dl>
              {#each steps as step (step.key)}
                <div class={['credit', { done: step.done }]}>
                  <span class="tick" aria-hidden="true">{#if step.done}<Icon svg={check} />{/if}</span>
                  <div class="what">
                    <dt>{step.name}</dt>
                    <dd class="part">{step.text}{#if step.done}<span class="visually-hidden"> (done)</span>{/if}</dd>
                  </div>
                  <dd class="do">{@render action(step)}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
    </div>
  </Container>
</section>
{/if}

<style>
/* Always the dark one-sheet, so its glass buttons are the dark ones in either theme. */
.welcome {
  color-scheme: dark;
  padding-block: calc(var(--gutter) * 1.5);
  background: var(--one-sheet-backdrop);
  color: var(--color-first-night-text);
}

.layout {
  display: grid;
  grid-template-columns: var(--one-sheet-width) minmax(0, 1fr);
  gap: calc(var(--gutter) * 1.5);
  align-items: center;

  @media (width < 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.one-sheet {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 8px;
  inline-size: 100%;
  max-inline-size: var(--one-sheet-width);
  aspect-ratio: 2 / 3;
  padding: 24px 22px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--radius-object);
  background: var(--one-sheet-beams), var(--one-sheet-spot), var(--one-sheet-bg);
  box-shadow: var(--one-sheet-shadow);
  text-align: center;

  /* The sunburst behind the title, then halftone and grain over it all. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--one-sheet-rays);
    mask: var(--one-sheet-rays-mask);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--one-sheet-grain), var(--one-sheet-halftone);
    mix-blend-mode: overlay;
  }

  /* A gold double rule inset from the edge, like a printed border. */
  & > .frame {
    position: absolute;
    inset: var(--one-sheet-frame-inset);
    z-index: -1;
    border: 1px solid var(--one-sheet-frame);
    outline: 1px solid var(--one-sheet-frame);
    outline-offset: -4px;
    pointer-events: none;
  }
}

.presents {
  color: var(--color-first-night-gold);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.title {
  align-self: center;
  display: grid;
  gap: 6px;
  font-size: var(--font-size-one-sheet-title);
  font-weight: 800;
  line-height: 0.95;
  text-transform: uppercase;
  overflow-wrap: anywhere;

  small {
    color: var(--color-one-sheet-tagline);
    font-size: 14px;
    letter-spacing: 0.2em;
  }
}

.billing {
  color: var(--color-one-sheet-billing);
  font-size: 9px;
  line-height: 1.5;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.soon {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.credits {
  display: grid;
  gap: 40px;
  min-inline-size: 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
}

h2 {
  margin: 0;
  color: inherit;
  font-size: var(--font-size-first-night-title);
  font-weight: 800;
  line-height: 1.05;
}

/* Ruled above the first ticket as between the rest. */
dl {
  margin: 0;
  border-block-start: 1px solid var(--color-one-sheet-rule);
}

/* The tick, the credit's name with what it asks under it, and its action at the end. */
.credit {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding-block: 10px;
  border-block-end: 1px solid var(--color-one-sheet-rule);

  @media (width < 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.what {
  display: grid;
  gap: 2px;
  min-inline-size: 0;
}

dt {
  color: var(--color-first-night-dim);
  font-size: var(--font-size-first-night-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
}

dd {
  margin: 0;
}

.part {
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-base);

  .done & {
    color: var(--color-first-night-dim);
  }
}

.do {
  display: flex;
  justify-content: flex-end;
}

/* A credit's tick: an empty ring until it's done, then filled green with a check. */
.tick {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--one-sheet-tick);
  block-size: var(--one-sheet-tick);
  border: 2px solid var(--color-first-night-track);
  border-radius: 50%;
  color: var(--color-text-inverse);
  font-size: var(--font-size-one-sheet-tick);

  .done & {
    border-color: var(--color-first-night-done);
    background: var(--color-first-night-done);
  }
}

.done dt {
  color: var(--color-first-night-done);
}

/* An admitted ticket's stamp, as in the book. */
.stamp {
  padding-inline: 5px;
  border: 2px solid var(--brand-primary);
  border-radius: 4px;
  color: var(--brand-primary);
  font-size: 12px;
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  rotate: -8deg;
}

/* Remote Control's ways in, as icon buttons. */
.crew {
  display: flex;
  gap: var(--footer-social-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
