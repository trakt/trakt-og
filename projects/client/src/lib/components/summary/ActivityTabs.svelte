<!--
  The summary's "People You Follow": a glass panel of three equal cells, Watching Now, People Watched and Rated by, each
  an icon and a figure beside its label. It starts closed; a cell opens its view under the cells, and clicking it again
  closes it. While someone the viewer follows is watching, Watching Now's cell takes the watching-now player's red with
  their faces at its end, and its view shows them in the dashboard's live cards, then everyone else watching as faces.
  People Watched's view is a bar of ranges (plays, or how much of a show), and Rated by's is the profile's ratings
  chart; picking a range or a bar lists its followed members three across, each in a summary tile's box with the comment
  card's tags: their plays split with, on a show, how much of it they've seen (red for all of it, yellow for half or
  more, gray under half), or their rating in that rating's color. Twelve show at first, and the less and more pill on the panel's bottom edge
  steps through the rest. Private members the viewer doesn't follow get the placeholder and no link.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import SocialTile from '$lib/components/dashboard/SocialTile.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import PageNavigator from '$lib/components/page-navigator/PageNavigator.svelte';
import StatusDot from '$lib/components/status/StatusDot.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import ProfileRatingsChart from '$lib/components/users/ProfileRatingsChart.svelte';
import SectionHeading from './SectionHeading.svelte';
import { liveTiles } from '$lib/dashboard/liveTiles';
import Icon from '$lib/icons/Icon.svelte';
import chevronDown from '$lib/icons/solid/chevron-down.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import { progressTone } from '$lib/summary/progressTone';
import type { ActivitySection, ActivityTab, ActivityUser } from '$lib/summary/toActivity';

interface Props {
  tabs: readonly ActivityTab[];
}

const { tabs }: Props = $props();
const id = $props.id();

type WatchingTab = Extract<ActivityTab, { id: 'watching' }>;
type LineTab = Extract<ActivityTab, { id: 'watched' | 'rated' }>;

// Four rows of three a page, which the less and more pill steps through.
const PEOPLE_PER_PAGE = 12;
const FACES_IN_CELL = 3;
// Often enough for the live cards' progress bars; their countdowns tick on their own.
const CLOCK_MS = 30_000;
const TONES = {
  complete: 'var(--color-activity-progress-complete)',
  half: 'var(--color-activity-progress-half)',
  started: 'var(--color-activity-progress-started)',
};

let opened = $state<ActivityTab['id'] | null>(null);
let pickedRange = $state<string | null>(null);
let pickedRating = $state<number | null>(null);
let pages = $state(1);
let watchersWidth = $state(0);
/** The faces' size and overlap, read from the tokens, so as many fit on one line as its width allows. */
let watcherFaces = $state<{ readonly size: number; readonly step: number; readonly room: number } | null>(null);
let now = $state(new Date());

$effect(() => {
  const clock = setInterval(() => (now = new Date()), CLOCK_MS);
  return () => clearInterval(clock);
});

const watching = $derived(tabs.find((tab): tab is WatchingTab => tab.id === 'watching'));
const open = $derived(tabs.find((tab) => tab.id === opened));
const line = $derived(open && open.id !== 'watching' ? open : undefined);

const tiles = $derived(watching ? liveTiles(watching.live, now) : []);
// Everyone watching without a live card: followed members whose watch didn't load, then everyone else.
const watchers = $derived.by(() => {
  if (!watching) return [];
  const live = new Set(tiles.map(({ watch }) => watch.member.slug));
  return [...watching.followed.filter(({ key }) => !live.has(key)), ...watching.others];
});

// One line of overlapped faces, leaving room for the count after them; when they don't all fit, the last spot is a
// "+N" bubble for the rest.
const fitted = $derived.by(() => {
  if (!watcherFaces || watchersWidth === 0) return watchers;
  const { size, step, room } = watcherFaces;
  const fit = Math.max(2, Math.floor((watchersWidth - room - size) / step) + 1);
  return watchers.length > fit ? watchers.slice(0, fit - 1) : watchers;
});
const unshown = $derived(watchers.length - fitted.length);

const readWatcherFaces: Attachment<HTMLElement> = (node) => {
  const style = getComputedStyle(node);
  const px = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0;
  const size = px('--activity-watcher');
  watcherFaces = { size, step: size - px('--activity-watcher-overlap'), room: px('--activity-watchers-text-room') };
};

const largest = (sections: readonly ActivitySection[]) =>
  sections.reduce((best, section) => (section.users.length > best.users.length ? section : best));
// The picked range, or the one most followed members landed on.
const section = $derived.by(() => {
  if (!line || line.sections.length === 0) return undefined;
  const key = line.id === 'watched' ? pickedRange : String(pickedRating ?? topRating(line));
  return line.sections.find((candidate) => candidate.key === key) ?? largest(line.sections);
});
const people = $derived(section ? section.users : []);
const shown = $derived(people.slice(0, pages * PEOPLE_PER_PAGE));

function topRating(tab: LineTab) {
  return tab.chart?.bars.find((bar) => bar.top)?.rating ?? Number(largest(tab.sections).key);
}

const toggle = (tab: ActivityTab['id']) => {
  opened = opened === tab ? null : tab;
  pages = 1;
};

const pickRange = (key: string) => {
  pickedRange = key;
  pages = 1;
};

const pickRating = (rating: number) => {
  pickedRating = rating;
  pages = 1;
};

const viewName = (tab: ActivityTab) => `${tab.text[0]} ${tab.text[1]}`;
// Beside the live cards they're everyone else; on their own, just people.
const watcherNoun = (n: number, others: boolean) => {
  if (others) return n === 1 ? 'other' : 'others';
  return n === 1 ? 'person' : 'people';
};
const playsLabel = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'play' : 'plays'}`;
const peopleCount = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;
</script>

<!-- Profiles og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet face(user: ActivityUser)}
  {#if user.href}
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <a class="watcher" href={user.href} aria-label={user.name} {...tooltip}>
          <img src={user.avatar} alt="" loading="lazy" decoding="async" />
        </a>
      {/snippet}
      {user.name}
    </Tooltip>
  {:else}
    <Tooltip placement="bottom" text="Private member">
      {#snippet trigger(tooltip)}
        <span class="watcher" role="img" aria-label="Private member" tabindex="-1" {...tooltip}>
          <img src={user.avatar} alt="" loading="lazy" decoding="async" />
        </span>
      {/snippet}
    </Tooltip>
  {/if}
{/snippet}

<!-- The comment card's tags: plays and a show's share as one split tag, a segment each. -->
{#snippet tags(user: ActivityUser, tab: LineTab)}
  {#if tab.id === 'rated'}
    {#if user.rating}
      <!-- In the rating's own color, like its bar on the chart. -->
      <CommentTag svg={heart} tint color="var(--rating-{user.rating})">
        <span class="visually-hidden">Rated </span>{user.rating}
      </CommentTag>
    {/if}
  {:else if user.plays}
    <span class={['joined', { both: user.progress !== undefined }]}>
      {#if user.history}
        <a class="segment plays history" href={user.history} aria-label="{user.name}'s history: {playsLabel(user.plays)}">
          <CommentTag svg={checkThick} glyph tone="watched" tint>{playsLabel(user.plays)}</CommentTag>
        </a>
      {:else}
        <span class="segment plays">
          <CommentTag svg={checkThick} glyph tone="watched" tint>{playsLabel(user.plays)}</CommentTag>
        </span>
      {/if}
      {#if user.progress !== undefined}
        <span class="segment percent">
          <CommentTag tint color={TONES[progressTone(user.progress)]}>
            {user.progress}%<span class="visually-hidden"> watched</span>
          </CommentTag>
        </span>
      {/if}
    </span>
  {/if}
{/snippet}

<!-- The face and name lead to the profile and the plays tag to their history, so the box holds two links. -->
{#snippet person(user: ActivityUser, tab: LineTab)}
  <div class="person">
    {#if user.href}
      <a class="who" href={user.href}>
        <img src={user.avatar} alt="" loading="lazy" decoding="async" />
        <span class="name">{user.name}</span>
      </a>
    {:else}
      <span class="who">
        <img src={user.avatar} alt="" loading="lazy" decoding="async" />
        <span class="name">Private member</span>
      </span>
    {/if}
    <span class="tags">{@render tags(user, tab)}</span>
  </div>
{/snippet}

{#snippet peopleList(tab: LineTab)}
  {#if section}
    <ul id="{id}-people" class="people" aria-label="{section.title}: {peopleCount(people.length)}">
      {#each shown as user (user.key)}
        <li>{@render person(user, tab)}</li>
      {/each}
    </ul>
    <PageNavigator
  label={section.name}
  rows={pages}
  maxRows={Math.ceil(people.length / PEOPLE_PER_PAGE)}
  onchange={(next) => (pages = next)}
  edge
/>
  {/if}
{/snippet}

<section class="summary-activity" aria-labelledby="{id}-heading">
  <SectionHeading title="People You Follow" id="{id}-heading" />
  <div class={['panel', { closed: !open }]}>
    <div class="cells">
      {#each tabs as tab (tab.id)}
        {@const followed = tab.id === 'watching' ? tab.followed : []}
        <button
          type="button"
          class={['cell', { open: opened === tab.id, live: followed.length > 0 }]}
          aria-expanded={opened === tab.id}
          aria-controls="{id}-view"
          onclick={() => toggle(tab.id)}
        >
          <span class="icon-slot">
            {#if tab.id === 'watching'}
              <StatusDot kind="live" />
            {:else if tab.id === 'watched'}
              <span class="watched-icon"><Icon svg={checkThick} /></span>
            {:else}
              <span class="heart" style:--heart="var(--rating-{tab.heart ?? 1})"><Icon svg={heart} /></span>
            {/if}
          </span>
          <span class="stat">
            <span class="figure">
              {tab.number}{#if tab.id === 'rated'}<span class="unit">%</span>{/if}
            </span>
            <span class="label">{tab.text[0]}<br /> {tab.text[1]}</span>
          </span>
          {#if followed.length > 0}
            <span class="faces">
              {#each followed.slice(0, FACES_IN_CELL) as user (user.key)}
                <Tooltip placement="bottom">
                  {#snippet trigger(tooltip)}
                    <span class="face" {...tooltip}><img src={user.avatar} alt="" loading="lazy" decoding="async" /></span>
                  {/snippet}
                  {user.name}
                </Tooltip>
              {/each}
            </span>
            <span class="visually-hidden">, {followed.length.toLocaleString('en-US')} you follow</span>
          {/if}
          <span class="chevron"><Icon svg={chevronDown} /></span>
        </button>
      {/each}
    </div>

    <div
      id="{id}-view"
      class={['view', { paged: line && people.length > PEOPLE_PER_PAGE }]}
      role="region" aria-label={open ? viewName(open) : undefined} hidden={!open}>
      {#if open?.id === 'watching'}
        {#if tiles.length > 0}
          <PosterGrid columns={3} phoneColumns={2}>
            {#each tiles as tile (tile.watch.member.key)}
              <SocialTile {tile} />
            {/each}
          </PosterGrid>
        {/if}
        {#if watchers.length > 0}
          <div
            class={['watchers', { under: tiles.length > 0 }]}
            bind:clientWidth={watchersWidth}
            {@attach readWatcherFaces}
          >
            <ul class="watcher-faces">
              {#each fitted as user (user.key)}
                <li>{@render face(user)}</li>
              {/each}
              {#if unshown > 0}
                <li class="rest" aria-label="{unshown.toLocaleString('en-US')} more">+{unshown.toLocaleString('en-US')}</li>
              {/if}
            </ul>
            <p class="watchers-text">
              <strong>{watchers.length.toLocaleString('en-US')}</strong>
              {watcherNoun(watchers.length, tiles.length > 0)} watching now
            </p>
          </div>
        {/if}
      {:else if line?.id === 'watched'}
        <ol class="share" aria-label="How much of it they've watched">
          {#each line.sections as stop (stop.key)}
            {@const picked = stop.key === section?.key}
            <li
              style:--weight={1 + Math.sqrt(stop.users.length) * 1.6}
              style:--step={(stop.level - 1) / Math.max(line.sections.length - 1, 1)}
            >
              <button
                type="button"
                class={['stop', { picked, empty: stop.users.length === 0 }]}
                aria-pressed={picked}
                aria-label="{stop.title}: {peopleCount(stop.users.length)}"
                disabled={stop.users.length === 0}
                onclick={() => pickRange(stop.key)}
              >
                <span class="stop-figure">
                  {stop.label}{#if stop.unit}<span class="stop-unit">{stop.unit}</span>{/if}
                </span>
                <span class="stop-name">{stop.name}</span>
                <span class="rule"></span>
                <span class="stop-count">{peopleCount(stop.users.length)}</span>
              </button>
            </li>
          {/each}
        </ol>
        {@render peopleList(line)}
      {:else if line?.id === 'rated'}
        {#if line.chart}
          <div class="ratings">
            <ProfileRatingsChart chart={line.chart} picked={Number(section?.key)} onpick={pickRating} />
          </div>
        {/if}
        {@render peopleList(line)}
      {/if}
    </div>
  </div>
</section>

<style>
.summary-activity {
  margin-block-end: var(--gutter);
}

/* Positioned for the less and more pill on its bottom edge. */
.panel {
  position: relative;
  container-type: inline-size;
  margin-block-start: var(--space-activity-panel-top);
  border: 1px solid var(--color-activity-panel-line);
  border-radius: var(--radius-activity-panel);
  background-color: var(--color-activity-panel-bg);
}

.cells {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cell {
  display: flex;
  align-items: center;
  gap: var(--activity-cell-gap);
  min-inline-size: 0;
  min-block-size: var(--activity-cell-height);
  margin: 0;
  padding: var(--activity-cell-padding);
  border: 0;
  border-inline-start: 1px solid var(--color-activity-panel-line);
  background: none;
  color: var(--color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color var(--transition-dashboard-panel-hover);

  &:first-child {
    border-inline-start: 0;
    border-start-start-radius: var(--radius-activity-panel);
  }

  &:last-child {
    border-start-end-radius: var(--radius-activity-panel);
  }

  .closed &:first-child {
    border-end-start-radius: var(--radius-activity-panel);
  }

  .closed &:last-child {
    border-end-end-radius: var(--radius-activity-panel);
  }

  &:hover {
    background-color: var(--color-activity-cell-hover);
  }

  &.live {
    background-color: var(--color-activity-cell-live);

    &:hover {
      background-color: var(--color-activity-cell-live-hover);
    }
  }

  &.open {
    background-color: var(--color-activity-cell-open);
    box-shadow: inset 0 -2px 0 var(--color-activity-cell-open-line);
  }

  &.live.open {
    background-color: var(--color-activity-cell-live-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: -2px;
  }
}

/* One box for every cell's icon, so the dot, the check and the heart all center on the figure. */
.icon-slot {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--activity-icon-slot);
  block-size: var(--activity-icon-slot);
  font-size: var(--font-size-activity-icon);
  line-height: 1;

  & :global(.icon) {
    display: block;
  }
}

.watched-icon {
  display: flex;
  color: var(--color-activity-watched-icon);
}

.heart {
  display: flex;
  color: var(--heart);
}

/* Trimmed to the cap height and the baseline, so the figure and the label center on the icon. */
.stat {
  display: flex;
  align-items: center;
  gap: var(--activity-figure-gap);
  min-inline-size: 0;
}

.figure {
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-figure);
  font-weight: var(--font-weight-headings);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  text-box: trim-both cap alphabetic;
}

.unit {
  font-size: var(--font-size-activity-unit);
  font-weight: var(--font-weight-headings-light);
}

.label {
  color: var(--color-activity-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-activity-label);
  line-height: var(--line-height-activity-label);
  text-transform: uppercase;
  text-box: trim-both cap alphabetic;
}

.faces {
  display: flex;
  margin-inline-start: auto;

  & img {
    display: block;
    inline-size: var(--activity-face);
    block-size: var(--activity-face);
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 var(--activity-face-ring) var(--color-activity-face-gap), 0 0 0
      calc(var(--activity-face-ring) * 2) var(--color-social-live);
  }
}

/* Each tooltip's popover sits between the faces, so siblings are matched with ~ rather than +; global, since they're
   siblings through the Tooltip component. */
.faces :global(.face ~ .face) {
  margin-inline-start: calc(-1 * var(--activity-face-overlap));
}

/* The rest of the pile, as one more face. */
.rest {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  inline-size: var(--activity-watcher);
  block-size: var(--activity-watcher);
  border: var(--activity-watcher-ring) solid var(--color-avatar-border);
  border-radius: 50%;
  background-color: var(--color-activity-person-bg);
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-rest);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
}

.chevron {
  display: flex;
  flex: none;
  margin-inline-start: auto;
  color: var(--color-activity-chevron);
  font-size: var(--font-size-activity-chevron);
  transition: rotate var(--transition-dashboard-panel-hover);

  .faces + .visually-hidden + & {
    margin-inline-start: 0;
  }

  .open & {
    rotate: 180deg;
    color: var(--color-text);
  }
}

.view {
  padding: var(--activity-detail-padding);
  border-block-start: 1px solid var(--color-activity-panel-line);

  /* Room above the less and more pill, which rides up from the panel's bottom edge. */
  &.paged {
    padding-block-end: var(--space-activity-pager);
  }

  &[hidden] {
    display: none;
  }
}

.watchers {
  display: flex;
  align-items: center;
  gap: var(--space-base-inline);
  min-inline-size: 0;

  &.under {
    padding-block-start: var(--space-activity-watchers);
    border-block-start: 1px solid var(--color-activity-panel-line);
  }
}

/* One line, each face tucked under the next with a ring in the avatar border's gray, like OG's pile. */
.watcher-faces {
  display: flex;
  flex: none;
  margin: 0;
  padding: 0;
  list-style: none;

  & li + li {
    margin-inline-start: calc(-1 * var(--activity-watcher-overlap));
  }

  /* Positioned, so every face paints in the pile's order: a dimmed one (its filter a layer of its own) can't jump
     above an undimmed neighbour. */
  & li {
    position: relative;
    transition: filter var(--transition-activity-face);
  }

  /* The face under the pointer, or keyboard focus, lifts in place and the rest dim: darkened, not see-through, so the
     faces under them don't show. Hover goes through the pile's own :hover, not :has(:hover), which Safari can leave
     stuck after the pointer leaves; and a click's focus doesn't count, so nothing stays lit. */
  &:hover li:not(:hover),
  &:has(:focus-visible) li:not(:has(:focus-visible)) {
    filter: var(--filter-activity-face-idle);
  }

  /* Only the picture lifts: the face's hit area stays put, so lifting can't slide it out from under the pointer. */
  & li:hover img,
  & li:has(:focus-visible) img {
    translate: 0 calc(-1 * var(--activity-face-lift));
  }
}

.watcher {
  display: block;
  border-radius: 50%;

  & img {
    display: block;
    box-sizing: border-box;
    transition: translate var(--transition-activity-face);
    inline-size: var(--activity-watcher);
    block-size: var(--activity-watcher);
    border: var(--activity-watcher-ring) solid var(--color-avatar-border);
    border-radius: 50%;
    background-color: var(--color-avatar-border);
    object-fit: cover;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }
}

.watchers-text {
  margin: 0;
  white-space: nowrap;
  color: var(--color-activity-watchers-text);
  font-family: var(--font-headings);

  & strong {
    color: var(--color-text);
  }
}

.share {
  display: flex;
  align-items: end;
  gap: var(--activity-share-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  /* Never narrower than its figure, so neighbouring figures can't run into each other on a tablet. */
  & li {
    display: flex;
    flex: var(--weight) 1 0;
    min-inline-size: min-content;
  }
}

.stop {
  display: grid;
  flex: 1;
  gap: var(--space-base-block);
  align-content: end;
  min-inline-size: var(--activity-share-stop-min);
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
  opacity: var(--opacity-activity-share-idle);
  transition: opacity var(--transition-dashboard-panel-hover);

  &:is(:hover, :focus-visible, .picked) {
    opacity: 1;
  }

  &.empty {
    cursor: default;
    opacity: var(--opacity-activity-share-empty);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 4px;
  }
}

.stop-figure {
  padding-inline-end: var(--space-activity-share-figure);
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-share-figure);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.stop-unit {
  margin-inline-start: 0.2em;
  color: var(--color-activity-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-share-text);
}

.stop-name,
.stop-count {
  /* No say in the range's width: they trail off instead. */
  contain: inline-size;
  overflow: hidden;
  font-family: var(--font-headings);
  font-size: var(--font-size-activity-share-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stop-name {
  color: var(--color-activity-share-name);
}

.stop-count {
  color: var(--color-activity-share-count);

  .picked & {
    color: var(--color-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* The watched action's purple, from pale on the least watched range to full on the most. */
.rule {
  block-size: var(--activity-share-rule);
  border-radius: var(--radius-activity-share-rule);
  background-color: color-mix(
    in srgb,
    var(--color-activity-watched-high) calc(var(--activity-watched-ramp-floor) + var(--step) * (100% -
    var(--activity-watched-ramp-floor))),
    var(--color-activity-watched-low)
  );

  .picked & {
    box-shadow: 0 0 0 var(--activity-share-picked-gap) var(--color-activity-panel-solid), 0 0 0
      var(--activity-share-picked-ring) var(--color-activity-share-picked);
  }
}

.ratings {
  --color-ratings-chart-bg: var(--color-activity-panel-solid);
}

.people {
  display: grid;
  grid-template-columns: repeat(var(--activity-people-columns), minmax(0, 1fr));
  gap: var(--activity-people-gap);
  margin: var(--space-activity-people) 0 0;
  padding: 0;
  list-style: none;
}

.person {
  display: flex;
  align-items: center;
  gap: var(--activity-person-gap);
  min-inline-size: 0;
  block-size: var(--activity-person-height);
  padding: var(--activity-person-padding);
  border-radius: var(--radius-activity-person);
  background-color: var(--color-activity-person-bg);
  font-family: var(--font-headings);
  transition: background-color var(--transition-dashboard-panel-hover);

  &:has(a.who:is(:hover, :focus-visible)) {
    background-color: var(--color-activity-person-hover);
  }
}

/* The face and name: the profile link, stretched over the box up to the tags. */
.who {
  display: flex;
  flex: 1;
  align-items: center;
  align-self: stretch;
  gap: var(--activity-person-gap);
  min-inline-size: 0;
  color: var(--color-text);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-text);
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
    border-radius: var(--radius-activity-person);
  }

  & img {
    flex: none;
    inline-size: var(--activity-person-avatar);
    block-size: var(--activity-person-avatar);
    border-radius: 50%;
    object-fit: cover;
  }
}

/* The plays tag as a link, deepening like a list row's chip under the pointer. */
.history {
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    text-decoration: none;

    & :global(.tag) {
      background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-count-tint), transparent);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
    border-radius: var(--radius-list-card-chip);
  }
}

.name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags {
  display: flex;
  flex: none;
}

/* The comment card's watched and rated tag: segments meeting on a shared edge, at fixed widths so they form columns. */
.joined {
  display: inline-flex;
}

.segment {
  display: flex;

  & :global(.tag) {
    flex: 1;
    justify-content: center;
  }
}

.plays {
  min-inline-size: var(--activity-tag-plays);
}

.percent {
  min-inline-size: var(--activity-tag-percent);
}

.both > .plays :global(.tag) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.both > .percent {
  margin-inline-start: -1px;

  & :global(.tag) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
}

/* Small tablets: the label goes under the figure on one line, and the figure and faces shrink to fit a third. */
@container (width < 880px) {
  .cell {
    gap: var(--activity-cell-gap-narrow);
    padding: var(--activity-cell-padding-narrow);
  }

  .stat {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--activity-figure-gap-narrow);
  }

  .figure {
    font-size: var(--font-size-activity-figure-narrow);
  }

  .label {
    max-inline-size: 100%;
    overflow: hidden;
    font-size: var(--font-size-activity-label-narrow);
    text-overflow: ellipsis;
    white-space: nowrap;

    & br {
      display: none;
    }
  }

  /* Just the first face, so the label keeps its room. */
  .faces img {
    inline-size: var(--activity-face-narrow);
    block-size: var(--activity-face-narrow);
  }

  .faces :global(.face ~ .face) {
    display: none;
  }

  .people {
    grid-template-columns: repeat(var(--activity-people-columns-narrow), minmax(0, 1fr));
  }

  .stop-figure {
    font-size: var(--font-size-activity-share-figure-narrow);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cell,
  .chevron,
  .stop,
  .person {
    transition: none;
  }

  /* The dimming still fades; only the lift goes. */
  .watcher-faces li {
    transition: filter var(--transition-activity-face);
  }

  .watcher-faces li:hover img,
  .watcher-faces li:has(:focus-visible) img {
    translate: none;
  }
}
</style>
