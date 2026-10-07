<!--
  Discover's upcoming premieres, never edited by hand: the most anticipated new series and returning seasons from the
  hot premieres feed and the anticipated chart, with toggles for all, new series and returning seasons. Each is its
  own rounded fanart card, two wide then three a row: the show's logo centred over its dimmed fanart (its name when
  there's no logo yet), a calendar chip with the day, pills for the kind of premiere, the network and the lists it's
  on, how many days are left (on the day itself, "Today" on fire, and the card glows), and og's quick-action bar.
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Icon from '$lib/icons/Icon.svelte';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import fire from '$lib/icons/solid/fire.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { countLabel } from '$lib/utils/countLabel';
import type { Premiere } from './toPremieres.ts';
import ToggleChips from './ToggleChips.svelte';

interface Props {
  premieres: readonly Premiere[];
  today: string;
  datePreferences: DatePreferences;
}

const { premieres, today, datePreferences }: Props = $props();
const SHOWN = 8;
const groups = $derived(
  [
    { id: 'all', label: 'All Premieres', items: premieres },
    { id: 'series', label: 'New Series', items: premieres.filter(({ kind }) => kind === 'series') },
    { id: 'season', label: 'Returning Seasons', items: premieres.filter(({ kind }) => kind === 'season') },
  ].filter((group) => group.items.length > 0),
);
let selected = $state('all');
const shown = $derived((groups.find(({ id }) => id === selected) ?? groups.at(0))?.items.slice(0, SHOWN) ?? []);

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const daysAway = (day: string) => Math.max(0, Math.round((utc(day).getTime() - utc(today).getTime()) / 86_400_000));
function soon(days: number) {
  if (days === 0) return 'Premieres today';
  if (days === 1) return 'Premieres tomorrow';
  return `Premieres in ${days} days`;
}
</script>

<!-- Show hrefs point at routes resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if groups.length > 0}
  <section id="premieres" class="premieres" aria-labelledby="premieres-heading">
  <PanelHeading
    id="premieres-heading"
    title="Upcoming Premieres"
    icon={tvRetro}
    seeMore={{ href: '/calendars/premieres', text: 'Premiere calendar' }}
  />
  <div class="controls">
    <ToggleChips
      label="Premieres"
      options={groups.map(({ id, label, items }) => ({ id, label, count: items.length }))}
      bind:selected
    />
  </div>
  <ul class="grid">
      {#each shown as premiere (premiere.key)}
        {@const viewer = overlay.state('show', premiere.id)}
        {@const days = daysAway(premiere.day)}
        <li class={['card', { today: days === 0 }]}>
          <FanartCard
            href={premiere.href}
            title={premiere.title}
            image={premiere.fanart}
            logo={premiere.logo}
            logoMode
            hideTitle
            userRating={viewer.rating}
            icons={{
              fill: quickIconFill({ state: viewer, airedEpisodes: premiere.airedEpisodes, datePreferences }),
              ratingTarget: { type: 'show', id: premiere.id, title: premiere.title },
              watchTarget: { type: 'show', id: premiere.id, title: premiere.title, airedEpisodes: premiere.airedEpisodes },
              rating: premiere.rating,
              watchNow: premiere.kind === 'season' ? 'play' : undefined,
            }}
          >
            {#snippet fanartOverlay()}
              <span class="date" aria-hidden="true">
                <b>{Number(premiere.day.slice(8))}</b>{month.format(utc(premiere.day))}
              </span>
              {#if !premiere.logo}<span class="name" aria-hidden="true">{premiere.title}</span>{/if}
              <span class="foot">
                <span class="pills">
                  <span class={['pill', premiere.kind]}>
                    {premiere.kind === 'series' ? 'New Series' : `Season ${premiere.season}`}
                  </span>
                  {#if premiere.network}<span class="pill">{premiere.network}</span>{/if}
                  {#if premiere.lists}<span class="pill">{countLabel(premiere.lists, 'list')}</span>{/if}
                </span>
                <span class="countdown">
                  <span class="visually-hidden">{soon(days)}</span>
                  {#if days === 0}
                    <span class="fire" aria-hidden="true"><Icon svg={fire} /></span>
                    <b aria-hidden="true">Today</b>
                  {:else}
                    <b aria-hidden="true">{days}</b>
                    <small aria-hidden="true">{days === 1 ? 'day' : 'days'}</small>
                  {/if}
                </span>
              </span>
            {/snippet}
          </FanartCard>
        </li>
      {/each}
    </ul>
</section>
{/if}

<style>
.premieres {
  display: grid;
  gap: var(--discover-heading-margin);
  background: none;
}

.controls {
  margin-block-end: var(--discover-controls-gap);
}

.grid {
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--premiere-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  --opacity-fanart-behind-logo: var(--opacity-premiere-fanart);
  grid-column: span 2;
  overflow: hidden;
  border-radius: var(--radius-premiere-card);
  box-shadow: var(--shadow-premiere-card);

  &:nth-child(-n + 2) {
    grid-column: span 3;
  }

  /* The logo sits lower than on the calendars, clear of the date chip. */
  & :global(.logo) {
    inset-block-start: var(--premiere-logo-top);
    block-size: var(--premiere-logo-height);
    padding-inline: var(--premiere-name-inset);
  }
}

@container (width < 720px) {
  .card,
  .card:nth-child(-n + 2) {
    grid-column: span 6;
  }
}

.date {
  position: absolute;
  inset: var(--premiere-date-inset) auto auto var(--premiere-date-inset);
  display: grid;
  justify-items: center;
  min-inline-size: var(--premiere-date-width);
  padding: var(--premiere-date-padding);
  border-radius: var(--radius-premiere-date);
  background-color: var(--color-season-hero-chrome);
  color: var(--season-accent);
  font-size: var(--font-size-premiere-date-month);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-ribbon);
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;

  & b {
    color: var(--color-discover-on-image);
    font-size: var(--font-size-premiere-date-day);
    letter-spacing: 0;
  }
}

/* Where the logo would be, for a show without one. */
.name {
  position: absolute;
  inset-block-start: var(--premiere-logo-top);
  inset-inline: var(--premiere-name-inset);
  display: grid;
  place-items: center;
  block-size: var(--premiere-logo-height);
  color: var(--color-discover-on-image);
  font-size: var(--font-size-premiere-name);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  text-align: center;
  text-shadow: var(--shadow-season-hero-text);
  text-transform: uppercase;
  text-wrap: balance;
  pointer-events: none;
}

.foot {
  position: absolute;
  inset: auto var(--premiere-foot-inset) var(--premiere-foot-inset);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--premiere-foot-gap);
  pointer-events: none;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--premiere-pill-gap);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--premiere-pill-gap);
  padding: var(--premiere-pill-padding);
  border-radius: var(--radius-season-pill);
  background-color: var(--color-season-hero-chrome);
  box-shadow: inset 0 0 0 1px var(--color-season-hero-chrome-line);
  color: var(--color-discover-on-image);
  font-size: var(--font-size-premiere-pill);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;

  &:is(.series, .season)::before {
    content: '';
    inline-size: var(--premiere-pill-dot);
    block-size: var(--premiere-pill-dot);
    border-radius: 50%;
    background-color: var(--episode-series-premiere);
  }

  &.season::before {
    background-color: var(--episode-season-premiere);
  }
}

/* Days to go, as a quiet chip at the foot's end; on the day, the accent and a flickering flame. */
.countdown {
  display: inline-flex;
  align-items: baseline;
  gap: var(--premiere-countdown-gap);
  padding: var(--premiere-countdown-padding);
  border-radius: var(--radius-premiere-date);
  background-color: var(--color-season-hero-chrome);
  box-shadow: inset 0 0 0 1px var(--color-season-hero-chrome-line);
  color: var(--color-discover-on-image);
  white-space: nowrap;

  & b {
    font-size: var(--font-size-premiere-countdown);
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  & small {
    color: var(--color-season-hero-blurb);
    font-size: var(--font-size-premiere-date-month);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-season-ribbon);
    text-transform: uppercase;
  }

  .today & {
    align-items: center;
    background-color: var(--season-accent);
    box-shadow: var(--premiere-today-glow) color-mix(in srgb, var(--season-accent) var(--premiere-today-glow-strength),
      transparent);
  }
}

.fire {
  display: inline-flex;
  font-size: var(--font-size-premiere-countdown);
}

.today {
  box-shadow:
    var(--shadow-premiere-card),
    0 0 0 2px var(--season-accent),
    var(--premiere-today-glow) color-mix(in srgb, var(--season-accent) var(--premiere-today-glow-strength),
    transparent);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .fire {
    transform-origin: bottom center;
    animation: flicker var(--premiere-flicker) ease-in-out infinite alternate;
  }
}

@keyframes flicker {
  50% {
    transform: scale(1.12) rotate(-4deg);
    opacity: 0.85;
  }

  to {
    transform: scale(0.96) rotate(3deg);
  }
}
</style>
