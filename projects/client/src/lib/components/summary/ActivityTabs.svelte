<!--
  OG's "People You Follow": big-number tabs over a box of round avatars.
  Watching Now counts everyone watching: the followed members come first, each in their own spot, then everyone else
  overlapped in a pile that fills the row. People Watched and Rated by place the followed members on a line, one stop
  per plays range or rating: their faces over a coloured rule, and a genre-style key under it. A stop nobody landed on
  stays on the line, faded. A stop with more members than it has room for ends in "+N"; that, its key, or the pile's
  count opens everyone on it in OG's avatar grid under the line. A follower's rating colours their ring, and the
  watched tab's tooltips add the play count. Private members get the placeholder avatar and no link. An ARIA tablist:
  arrow keys, Home and End move between the tabs.
-->
<script lang="ts">
import { tick } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import CornerRating from '$lib/components/media/CornerRating.svelte';
import { nextTab } from '$lib/components/tabs/nextTab';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import heart from '$lib/icons/solid/heart.svg?raw';
import type { ActivitySection, ActivityTab, ActivityUser } from '$lib/summary/toActivity';
import { countLabel } from '$lib/utils/countLabel';

interface Props {
  tabs: readonly ActivityTab[];
}

const { tabs }: Props = $props();
const id = $props.id();

// The pile's count takes three avatars' worth of the row.
const OTHERS_TEXT_COLUMNS = 3;
// How much each stop's people widen it, by their square root so one crowded stop can't squash the rest.
const WIDTH_PER_ROOT = 1.6;

// svelte-ignore state_referenced_locally
let selected = $state(tabs[0]?.id);
/** The stop opened under the line, or `others` for everyone else watching now. */
let opened = $state<string | null>(null);
let width = $state(0);
let panel = $state<HTMLElement>();
let stopWidths = $state<Record<string, number>>({});
/** The line's face size and overlap, read from the tokens, so each stop knows how many faces fit its width. */
let faces = $state<{ readonly size: number; readonly step: number; readonly ring: number } | null>(null);

const tab = $derived(tabs.find((candidate) => candidate.id === selected) ?? tabs[0]);
const narrow = $derived(width > 0 && width < 720);
// OG's col-md-1: twelve avatars a row, six on phones and tablets.
const perRow = $derived(narrow ? 6 : 12);
// The line in one row, or two on tablets, each row sharing out its own width.
const rows = $derived.by(() => {
  if (!tab || tab.id === 'watching') return [];
  if (!narrow) return [tab.sections];
  const half = Math.ceil(tab.sections.length / 2);
  return [tab.sections.slice(0, half), tab.sections.slice(half)];
});
const openedRow = $derived(rows.findIndex((row) => row.some((section) => section.key === opened)));

// The pile fills what the followed members leave of their last row, or a row of its own.
const othersColumns = $derived.by(() => {
  if (tab?.id !== 'watching') return 0;
  const left = perRow - (tab.followed.length % perRow) - OTHERS_TEXT_COLUMNS;
  return left >= 1 ? left : perRow - OTHERS_TEXT_COLUMNS;
});
// Overlapped by half, a column holds two faces: the first one whole, then a half for each after it.
const piled = $derived(tab?.id === 'watching' ? tab.others.slice(0, othersColumns * 2 - 1) : []);

const weightOf = (section: ActivitySection) => 1 + Math.sqrt(section.users.length) * WIDTH_PER_ROOT;
// How many circles fit a stop's width, "+N" included.
const roomOn = (section: ActivitySection) => {
  const width = stopWidths[section.key];
  if (!faces || !width) return 3;
  return Math.max(1, Math.floor((width - faces.ring - faces.size) / faces.step) + 1);
};
const shownOn = (section: ActivitySection) => {
  const room = roomOn(section);
  return section.users.length > room ? section.users.slice(0, room - 1) : section.users;
};
const people = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;

const openedUsers = $derived.by(() => {
  if (!opened || !tab) return null;
  if (tab.id === 'watching') return opened === 'others' ? tab.others : null;
  return tab.sections.find((section) => section.key === opened)?.users ?? null;
});
const openedTitle = $derived.by(() => {
  if (!opened || !tab) return '';
  if (tab.id === 'watching') return `${tab.others.length.toLocaleString('en-US')} others on Trakt`;
  const section = tab.sections.find((candidate) => candidate.key === opened);
  return section ? `${section.title}: ${people(section.users.length)}` : '';
});

const readFaces: Attachment<HTMLElement> = (node) => {
  const style = getComputedStyle(node);
  const px = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0;
  const size = px('--activity-line-face-size');
  faces = { size, step: size - px('--activity-line-face-overlap'), ring: px('--activity-line-face-ring') };
};

// The opened panel's arrow points at what opened it: the stop's number, or the pile's count.
const pointAtOpener = (key: string | null): Attachment<HTMLElement> => (node) => {
  const place = () => {
    const opener = panel?.querySelector<HTMLElement>(`[data-opener="${key}"]`);
    if (!opener) return;
    const from = opener.getBoundingClientRect();
    node.style.setProperty('--arrow-at', `${from.left + from.width / 2 - node.getBoundingClientRect().left}px`);
  };
  place();
  const observer = new ResizeObserver(place);
  observer.observe(node);
  return () => observer.disconnect();
};

// Opening moves focus to the first member it shows; opening it again closes it.
const toggle = async (key: string) => {
  opened = opened === key ? null : key;
  if (!opened) return;
  await tick();
  panel?.querySelector<HTMLElement>('.opened .member')?.focus();
};

const select = (next: ActivityTab['id']) => {
  selected = next;
  opened = null;
};

function onkeydown(event: KeyboardEvent) {
  const target = nextTab(tabs.map((candidate) => candidate.id), selected, event.key);
  if (target === undefined) return;

  event.preventDefault();
  select(target as ActivityTab['id']);
  document.getElementById(`${id}-tab-${target}`)?.focus();
}
</script>

<!-- Profiles og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet avatar(user: ActivityUser)}
  <span class="user-avatar" style:--ring={user.rating ? `var(--rating-${user.rating})` : undefined}>
    {#if user.rating}
      <span class="block"></span>
      <CornerRating rating={user.rating} label="Rated {user.rating}" />
    {/if}
    <img src={user.avatar} alt="" loading="lazy" decoding="async" />
  </span>
{/snippet}

{#snippet face(user: ActivityUser)}
  <span class="face" style:--ring={user.rating ? `var(--rating-${user.rating})` : undefined}>
  <img src={user.avatar} alt="" loading="lazy" decoding="async" />
</span>
{/snippet}

{#snippet member(user: ActivityUser, small: boolean)}
  {#if user.href}
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <a class="member" href={user.href} aria-label={user.name} {...tooltip}>
          {#if small}{@render face(user)}{:else}{@render avatar(user)}{/if}
        </a>
      {/snippet}
      <span class="line">{user.name}</span>
      {#if tab?.id === 'watched' && user.plays}
        <span class="divider"></span>
        <span class="line">
          {countLabel(user.plays, 'play')}{#if user.progress !== undefined}&ensp;·&ensp;{user.progress}% watched{/if}
        </span>
      {/if}
    </Tooltip>
  {:else}
    <Tooltip placement="bottom" text="Private member">
      {#snippet trigger(tooltip)}
        <span class="member" role="img" aria-label="Private member" tabindex="-1" {...tooltip}>
          {#if small}{@render face(user)}{:else}{@render avatar(user)}{/if}
        </span>
      {/snippet}
    </Tooltip>
  {/if}
{/snippet}

{#snippet openedPanel()}
  {#if openedUsers}
    <div id="{id}-opened" class="opened" role="region" aria-label={openedTitle} {@attach pointAtOpener(opened)}>
  <ul class="users">
        {#each openedUsers as user (user.key)}
          <li>{@render member(user, false)}</li>
        {/each}
      </ul>
</div>
  {/if}
{/snippet}

{#snippet key(section: ActivitySection)}
  <span class="key-number" data-opener={section.key}>{section.label}</span>
  <span class="key-name">{section.name}</span>
  {#if section.users.length > 0}
    <span class="key-count">{people(section.users.length)}</span>
  {/if}
{/snippet}

<section class="summary-activity" aria-labelledby="{id}-heading">
  <h2 id="{id}-heading">People You Follow</h2>
  <div class="tabs" role="tablist" aria-labelledby="{id}-heading">
    {#each tabs as candidate (candidate.id)}
      <button
        type="button"
        role="tab"
        id="{id}-tab-{candidate.id}"
        class="tab"
        aria-controls="{id}-panel"
        aria-selected={candidate.id === tab?.id}
        tabindex={candidate.id === tab?.id ? 0 : -1}
        style:--heart={candidate.id !== 'watching' && candidate.heart ? `var(--rating-${candidate.heart})` : undefined}
        onclick={() => select(candidate.id)}
        {onkeydown}
      >
        <span class="number">
          {#if candidate.id !== 'watching' && candidate.heart}
            <Icon svg={heart} label="Average rating" />{candidate.number}<span class="percent-sign">%</span>
          {:else}
            {candidate.number}
          {/if}
        </span>
        <span class="text">{candidate.text[0]}<br />{candidate.text[1]}</span>
      </button>
    {/each}
  </div>
  {#if tab}
    <div
      id="{id}-panel"
      class="users-wrapper"
      role="tabpanel"
      aria-labelledby="{id}-tab-{tab.id}"
      bind:clientWidth={width}
      bind:this={panel}
      style:--per-row={perRow}
      {@attach readFaces}
    >
      {#if tab.id === 'watching'}
        <ul class="users">
          {#each tab.followed as user (user.key)}
            <li>{@render member(user, false)}</li>
          {/each}
          {#if tab.others.length > 0}
            <li class="others" style:--others-span={othersColumns + OTHERS_TEXT_COLUMNS}>
              <span class="pile">
                {#each piled as user (user.key)}
                  {@render member(user, false)}
                {/each}
              </span>
              {#if tab.others.length > piled.length}
                <button
                  type="button"
                  class="others-count"
                  data-opener="others"
                  aria-expanded={opened === 'others'}
                  aria-controls="{id}-opened"
                  onclick={() => toggle('others')}
                >
                  <span class="others-number">+{tab.others.length.toLocaleString('en-US')}</span>
                  {tab.followed.length > 0 ? 'others' : 'watching'} on Trakt
                </button>
              {/if}
            </li>
          {/if}
        </ul>
        {@render openedPanel()}
      {:else}
        {#each rows as row, index (index)}
          <ol class="stops">
          {#each row as section (section.key)}
            {@const shown = shownOn(section)}
            <li
              class={['stop', { empty: section.users.length === 0, open: opened === section.key }]}
              style:--color={tab.id === 'rated' && section.users.length > 0 ? `var(--rating-${section.level})` : undefined}
              style:--step={(section.level - 1) / Math.max(tab.sections.length - 1, 1)}
              style:--weight={weightOf(section)}
              bind:clientWidth={stopWidths[section.key]}
            >
              <span class="faces">
                {#each shown as user (user.key)}
                  {@render member(user, true)}
                {/each}
                {#if section.users.length > shown.length}
                  <button
                    type="button"
                    class="more"
                    aria-label="Show all {people(section.users.length)}: {section.title}"
                    aria-expanded={opened === section.key}
                    aria-controls="{id}-opened"
                    onclick={() => toggle(section.key)}
                  >
                    +{section.users.length - shown.length}
                  </button>
                {/if}
              </span>
              <span class="rule"></span>
              {#if section.users.length === 0}
                <span class="key">{@render key(section)}</span>
              {:else}
                <Tooltip variant="chart">
                  {#snippet trigger(tooltip)}
                    <button
                      type="button"
                      class="key"
                      aria-expanded={opened === section.key}
                      aria-controls="{id}-opened"
                      onclick={() => toggle(section.key)}
                      {...tooltip}
                    >
                      {@render key(section)}
                    </button>
                  {/snippet}
                  <span class="tip-title">{section.title}</span>
                  <span class="tip-count">
                    {section.users.length.toLocaleString('en-US')}<span class="tip-unit">
                      {section.users.length === 1 ? 'person' : 'people'}</span>
                  </span>
                  <span class="tip-line">{section.share}% of people you follow</span>
                </Tooltip>
              {/if}
            </li>
          {/each}
          </ol>
          {#if index === openedRow}{@render openedPanel()}{/if}
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
.summary-activity {
  margin-block-start: var(--gutter);

  & h2 {
    margin-block-end: var(--gutter);
  }
}

.tabs {
  position: relative;
  z-index: 1;
  display: flex;
}

.tab {
  display: flex;
  flex: 0 0 25%;
  align-items: flex-start;
  min-inline-size: 0;
  margin: 0;
  padding: var(--activity-tab-padding);
  border: 1px solid var(--color-activity-border);
  border-radius: 0;
  background: none;
  color: var(--color-activity-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);
  line-height: 1;
  text-align: start;
  transition: all var(--transition-card);

  & > * {
    opacity: var(--opacity-activity-idle);
    transition: opacity var(--transition-card);
  }

  &:not(:first-child) {
    border-inline-start: none;
  }

  &[aria-selected='true'] {
    border-block-end-color: var(--color-activity-bg);
    background-color: var(--color-activity-bg);

    & > * {
      opacity: 1;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: -2px;
  }
}

.number {
  font-size: var(--font-size-activity-number);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;

  & :global(.icon) {
    margin-block-start: 3px;
    margin-inline-end: 4px;
    color: var(--heart, var(--rating-1));
    font-size: var(--font-size-activity-heart);
    vertical-align: top;
  }
}

.percent-sign {
  font-size: var(--font-size-activity-percent);
  font-weight: var(--font-weight-headings-light);
}

.text {
  padding: 2px 0 0 7px;
  font-size: var(--font-size-small);
  line-height: 1.2;
  text-transform: uppercase;
}

.users-wrapper {
  position: relative;
  container-type: inline-size;
  margin-block-start: -1px;
  padding: var(--activity-users-padding);
  border: 1px solid var(--color-activity-border);
  background-color: var(--color-activity-bg);
  /* One avatar column of the grid, which the pile's overlapped faces match. */
  --face: calc((100cqi - (var(--per-row) - 1) * var(--activity-avatar-gap)) / var(--per-row));
}

.users {
  display: grid;
  grid-template-columns: repeat(var(--per-row), minmax(0, 1fr));
  gap: var(--activity-avatar-gap);
  margin: 0;
  padding: 0 0 var(--activity-avatar-gap);
  list-style: none;
}

.member {
  display: block;

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
    border-radius: 50%;
  }
}

.user-avatar {
  --ring: var(--color-avatar-border);
  position: relative;
  display: block;
}

/* OG's `.corner-rating.block`: the corner square the round avatar sits on. */
.block {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  z-index: 1;
  inline-size: 50%;
  block-size: 50%;
  background-color: var(--ring);
}

img {
  position: relative;
  z-index: 5;
  display: block;
  inline-size: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 50%;
  background-color: var(--color-avatar-border);
}

.user-avatar img {
  border: var(--activity-avatar-border) solid var(--ring);
}

/* Everyone else watching now: faces overlapped by half, then how many there are. */
.others {
  display: flex;
  grid-column: span var(--others-span);
  align-items: center;
  gap: var(--activity-avatar-gap);
  min-inline-size: 0;
}

.pile {
  display: flex;
  flex: none;

  & .member {
    inline-size: var(--face);

    &:not(:first-child) {
      margin-inline-start: calc(var(--face) / -2);
    }
  }

  & img {
    box-shadow: 0 0 0 var(--activity-avatar-border) var(--color-activity-bg);
  }
}

.others-count {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-genre-count);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-key-count);
  text-align: start;
  cursor: pointer;

  &:hover {
    color: var(--color-activity-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }
}

.others-number {
  color: var(--color-activity-text);
  font-weight: var(--font-weight-headings-heavy);
}

/* The rating line: each stop is its faces, a coloured rule, and the key. */
.stops {
  display: flex;
  column-gap: var(--activity-line-gap);
  margin: 0;
  padding: 0 0 var(--activity-avatar-gap);
  list-style: none;

  & + .stops,
  .opened + & {
    margin-block-start: var(--space-activity-line-rows);
  }
}

.stop {
  /* People Watched ramps from the least watched stop to the most, in the watched action's purple. */
  --color: color-mix(
    in srgb,
    var(--color-activity-watched-high)
      calc(var(--activity-watched-ramp-floor) + (100% - var(--activity-watched-ramp-floor)) * var(--step)),
    var(--color-activity-watched-low)
  );
  display: flex;
  /* Softened by the people on it: wider stops fit more faces. */
  flex: var(--weight) 1 0;
  flex-direction: column;
  min-inline-size: var(--activity-line-stop-min);
  transition: opacity var(--transition-chart);

  /* Like the genre band: the stop under the pointer or focus is picked out and the rest fade, or else the opened one. */
  .users-wrapper:has(.stop:not(.empty):is(:hover, :focus-within)) &:not(:hover, :focus-within),
  .users-wrapper:has(.stop.open):not(:has(.stop:not(.empty):is(:hover, :focus-within))) &:not(.open) {
    opacity: var(--opacity-genre-piece-dimmed);
  }

  &.empty {
    --color: var(--color-activity-line-empty);

    & .key {
      opacity: var(--opacity-activity-line-empty);
    }
  }
}

.faces {
  display: flex;
  align-items: flex-end;
  min-block-size: calc(var(--activity-line-face-size) + 2 * var(--activity-line-face-ring));
  padding-inline-start: var(--activity-line-face-ring);

  & > :not(:first-child) {
    margin-inline-start: calc(-1 * var(--activity-line-face-overlap));
  }
}

.face {
  --ring: var(--color-avatar-border);
  display: block;
  inline-size: var(--activity-line-face-size);

  & img {
    border: var(--activity-line-face-ring) solid var(--ring);
    box-shadow: 0 0 0 var(--activity-line-face-ring) var(--color-activity-bg);
  }
}

.more {
  position: relative;
  z-index: 5;
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--activity-line-face-size);
  block-size: var(--activity-line-face-size);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-plus-more-bg);
  box-shadow: 0 0 0 var(--activity-line-face-ring) var(--color-activity-bg);
  color: var(--color-plus-more-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-count);
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }
}

.rule {
  display: block;
  block-size: var(--activity-line-rule);
  margin-block: var(--space-activity-line-rule);
  background-color: var(--color);
}

.key {
  display: grid;
  align-content: start;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-activity-text);
  font-family: var(--font-headings);
  line-height: 1.25;
  text-align: start;
}

button.key {
  cursor: pointer;

  &:hover .key-name,
  &[aria-expanded='true'] .key-name {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }
}

/* Typeset like the profile's genre keys. */
.key-number {
  /* Only as wide as its text, so the opened panel's arrow points at the number itself. */
  justify-self: start;
  color: var(--color-genre-label);
  font-size: var(--font-size-genre-share);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-genre-share);
}

.key-count {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-name {
  color: var(--color-genre-label);
  font-size: var(--font-size-genre-label);
  font-weight: var(--font-weight-headings);
}

.key-count {
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);
}

/* A stop or the pile, opened under the line in OG's avatar grid, on a panel whose arrow points back at it. */
.opened {
  position: relative;
  margin-block-start: calc(var(--space-activity-opened) + var(--activity-opened-arrow) / 2);
  padding: var(--space-activity-opened) var(--space-activity-opened) 0;
  border-radius: var(--radius-activity-opened);
  background-color: var(--color-activity-opened-bg);

  /* Last in the box, it makes up OG's short bottom padding, like the avatar grid does, to match the sides. */
  &:last-child {
    margin-block-end: var(--activity-avatar-gap);
  }

  &::before {
    content: '';
    position: absolute;
    inset-block-start: calc(var(--activity-opened-arrow) / -2);
    /* Kept clear of the rounded corners when what opened it sits at either edge. */
    --arrow-edge: calc(var(--radius-activity-opened) + var(--activity-opened-arrow) / 2);
    inset-inline-start: clamp(var(--arrow-edge), var(--arrow-at, 50%), 100% - var(--arrow-edge));
    inline-size: var(--activity-opened-arrow);
    block-size: var(--activity-opened-arrow);
    background-color: var(--color-activity-opened-bg);
    transform: translateX(-50%) rotate(45deg);
  }

  & .users {
    position: relative;
    padding-block-end: var(--space-activity-opened);
  }
}

.line {
  display: block;
}

/* OG's `.tooltip-hr` between the name and the plays. */
.divider {
  display: block;
  margin-block: var(--space-tooltip-divider);
  border-block-end: 1px solid var(--color-tooltip-divider);
}

/* The stop's chart tooltip, like the profile's ratings chart. */
.tip-title,
.tip-count,
.tip-line {
  display: block;
  text-align: start;
}

.tip-title {
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-genre-count);
  text-transform: uppercase;
}

.tip-count {
  font-size: var(--font-size-genre-share);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

.tip-unit {
  margin-inline-start: var(--space-ratings-tip-unit);
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-genre-key-count);
  font-weight: var(--font-weight-headings);
}

.tip-line {
  font-size: var(--font-size-genre-key-count);
}

@media (prefers-reduced-motion: reduce) {
  .tab,
  .tab > *,
  .stop {
    transition: none;
  }
}
</style>
