<!--
  Hot in Your Network: what the most people the viewer follows were on in a period, for its own dashboard panel. A title big
  enough to feature gets a fanart banner: who's on it out of everyone the viewer follows, its title, and a tally of how
  many watched it, their plays, their circle's rating and comments. The Details pill on its bottom edge opens a card
  for each of them, with how long ago and the tags for what they did. Up to three more titles several people are on
  follow as story cards, as in Watching Now: the reason tag and the type, a band in the reason's color, then their
  faces (each names them on hover) and the tags for what they did between them. Resting on a story card opens the
  same details as a feed poster's.
    <CircleHighlights events={toCircleEvents(items, following, windows)} {following} {now} />
-->
<script lang="ts">
import { averageRating, type CircleEvent, type CircleEvents } from '#lib/dashboard/toCircleEvents.ts';
import type { SocialMember } from '#lib/dashboard/toSocialItem.ts';
import Icon from '#lib/icons/Icon.svelte';
import comment from '#lib/icons/regular/comment.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import circleMinus from '#lib/icons/solid/circle-minus.svg?raw';
import circlePlus from '#lib/icons/solid/circle-plus.svg?raw';
import heart from '#lib/icons/solid/heart.svg?raw';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import FanartCard from '#lib/components/media/FanartCard.svelte';
import type { CardTag } from '#lib/components/media/CardTag.ts';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import { countLabel } from '#lib/utils/countLabel.ts';
import { ratingPercent } from '#lib/utils/ratingPercent.ts';
import { socialTagLook } from './socialTagLook.ts';
import SocialDetails from './SocialDetails.svelte';
import SocialPerson from './SocialPerson.svelte';
import SocialTags from './SocialTags.svelte';

interface Props {
  events: CircleEvents;
  /** How many people the viewer follows; null when that didn't load. */
  following: number | null;
  /** For how long ago each person was on the featured title. */
  now: Date;
}

const { events, following, now }: Props = $props();
const id = $props.id();
const FACES = 6;
const STORY_FACES = 5;
let expanded = $state(false);

const featured = $derived(events.featured);

const heartLevel = (average: number) => Math.min(Math.max(Math.trunc(average), 1), 10);

const TYPES = { movie: 'Movie', show: 'Show', episode: 'Episode' } as const;

/** A story card's reason, then what it is; the band takes the reason's color. */
function story(event: CircleEvent) {
  const look = event.tag && socialTagLook(event.tag);
  const type: CardTag = { text: TYPES[event.title.target.type], kind: 'generic' };
  const on: CardTag = { text: people(event.people.length), icon: userGroup, color: 'var(--color-social-together)' };
  return { tags: [look ?? on, type], band: look?.band ?? 'var(--color-social-together)' };
}

const people = (count: number) => `${count.toLocaleString('en-US')} ${count === 1 ? 'person' : 'people'}`;

/** "11 of the 101 people you follow", or "11 people you follow" when that count didn't load. */
const share = ({ people: on }: CircleEvent) =>
  following ? `${on.length} of the ${people(following)} you follow` : `${people(on.length)} you follow`;
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet faces(members: readonly SocialMember[], max: number)}
  <span class="faces">
    {#each members.slice(0, max) as member (member.key)}
      <Tooltip text={member.name}>
        {#snippet trigger(tooltip)}
          {#if member.href}
            <a class="face" href={member.href} aria-label={member.name} {...tooltip}><img src={member.avatar} alt=""
                loading="lazy" decoding="async" /></a>
          {:else}
            <span class="face" {...tooltip}><img src={member.avatar} alt="" loading="lazy" decoding="async" /></span>
          {/if}
        {/snippet}
      </Tooltip>
    {/each}
    {#if members.length > max}<span class="more">+{members.length - max}</span>{/if}
  </span>
{/snippet}

{#snippet rated(ratings: readonly number[])}
  {@const average = averageRating(ratings)}
  {#if average !== undefined}
    <span class="heart" style:color="var(--rating-{heartLevel(average)})"><Icon svg={heart} /></span>{ratingPercent(average)}%
  {/if}
{/snippet}

<div class="circle">
    {#if featured}
      {@const average = averageRating(featured.ratings)}
      <div class={['featured', { 'with-pill': featured.details.length > 0 }]}>
        <div class="banner">
          {#if featured.fanart}<img class="art" src={featured.fanart} alt="" loading="lazy" decoding="async" />{/if}
          <div class="story">
            <p class="kicker">{@render faces(featured.people, FACES)}<span>{share(featured)}</span></p>
            <h4 class="title">
              <a href={featured.title.href}>{featured.title.name}</a>{#if featured.title.year}<span
                  class="year">{featured.title.year}</span>{/if}
            </h4>
          </div>
          <dl class="tally">
            {#if featured.watched.length > 0}
              <div class="watchers"><dt>{featured.watched.length === 1 ? 'Watcher' : 'Watchers'}</dt><dd><span
                    class="mark"><Icon svg={userGroup} /></span>{featured.watched.length}</dd></div>
            {/if}
            {#if featured.plays > 0}
              <div class="plays"><dt>{featured.plays === 1 ? 'Play' : 'Plays'}</dt><dd><span class="mark"><Icon
                      svg={check} /></span>{featured.plays}</dd></div>
            {/if}
            {#if average !== undefined}
              <div class="rated" style:--tally-tone="var(--rating-{heartLevel(average)})"><dt>{countLabel(
                featured.ratings.length, 'rating')}</dt><dd>{@render rated(featured.ratings)}</dd></div>
            {/if}
            {#if featured.commented.length > 0}
              <div><dt>Commented</dt><dd><Icon svg={comment} />{featured.commented.length}</dd></div>
            {/if}
          </dl>
        </div>
        {#if featured.details.length > 0}
          <button type="button" class="details" aria-expanded={expanded} aria-controls="{id}-people"
            onclick={() => expanded = !expanded}><Icon svg={expanded ? circleMinus : circlePlus} />Details</button>
        {/if}
      </div>
      {#if expanded}
        <ul class="people" id="{id}-people" aria-label="Who's on {featured.title.name}">
          {#each featured.details as detail (detail.member.key)}
            <li><SocialPerson {detail} {now} /></li>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if events.standouts.length > 0}
      <ul class="standouts">
        {#each events.standouts as event (event.title.key)}
          {@const { tags, band } = story(event)}
          <li>
            <FanartCard framed href={event.title.href} title={event.title.name} year={event.title.year}
              image={event.fanart} {tags}>
              {#snippet fanartOverlay()}
                {#if event.details.length > 0}
                  <SocialDetails card={{ href: event.title.href, title: event.title.name, poster: event.title.poster,
                    details: event.details }} {now} />
                {/if}
              {/snippet}
              {#snippet progress()}<span class="band" style:background-color={band}></span>{/snippet}
            </FanartCard>
            <div class="below">
              {@render faces(event.people, STORY_FACES)}
              <SocialTags watchers={event.watched.length || undefined}
                rating={averageRating(event.ratings)} percent
                comment={event.commented.length > 0 ? { text: countLabel(event.commented.length, 'comment') } : undefined} />
            </div>
          </li>
        {/each}
      </ul>
    {/if}
</div>

<style>
.circle {
  container-type: inline-size;
  display: grid;
  gap: var(--space-social-circle-gap);
}

/* The banner, with the Details pill hanging half over its bottom edge. */
.featured {
  position: relative;

  &.with-pill {
    margin-block-end: calc(var(--page-navigator-height) / 2);
  }
}

/* OG's less and more pill, as one control. */
.details {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 50%;
  z-index: 1;
  display: inline-flex;
  gap: var(--page-navigator-gap);
  align-items: center;
  min-block-size: var(--page-navigator-height);
  padding: var(--page-navigator-padding);
  border: 1px solid var(--color-page-navigator-border);
  border-radius: var(--radius-page-navigator);
  background-color: var(--color-page-navigator-bg);
  color: var(--color-page-navigator-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-page-navigator);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  translate: -50% 50%;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-page-navigator-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: -2px;
  }

  & :global(.icon) {
    color: var(--color-page-navigator-icon);
    font-size: var(--font-size-page-navigator-icon);
  }
}

/* The fanart under a shade that's darkest behind the words, the story on the left and the tally on the right. */
.banner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-social-circle-gap);
  align-items: end;
  min-block-size: var(--social-circle-banner-height);
  padding: var(--space-social-circle-banner);
  overflow: hidden;
  border-radius: var(--radius-card-framed);
  background-color: var(--color-surface);
  color: var(--color-social-on-image);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-social-circle-banner);
  }

  & > :not(.art) {
    position: relative;
    z-index: 1;
  }
}

.art {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.story {
  min-inline-size: 0;
}

.kicker {
  display: flex;
  gap: var(--space-social-circle-kicker);
  align-items: center;
  margin: 0;
  color: var(--gray-lighter);
  font-family: var(--font-headings);
  font-size: var(--font-size-social-circle-says);
  font-weight: var(--font-weight-headings-heavy);
}

.title {
  margin-block: var(--space-social-circle-title);
  font-family: var(--font-headings);
  font-size: var(--font-size-social-circle-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-headings);
  text-wrap: balance;

  & a {
    color: inherit;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}

/* A movie's year after its title, lighter, as on the fanart cards. */
.year {
  margin-inline-start: 0.25em;
  color: var(--gray-lightish);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-light);
}

.tally {
  display: flex;
  gap: var(--space-social-circle-tally-gap);
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-card-framed);

  & div {
    display: grid;
    justify-items: center;
    gap: var(--space-xs-block);
    min-inline-size: var(--social-circle-tally-cell);
    padding: var(--space-social-circle-tally);
    --tally-wash: color-mix(in srgb, var(--tally-tone, transparent) var(--social-circle-tally-tint), transparent);
    background: linear-gradient(var(--tally-wash), var(--tally-wash)), var(--color-social-circle-tally-bg);
    backdrop-filter: var(--blur-social-circle-tally);
  }

  & dt {
    order: 1;
    color: var(--gray-lightish);
    font-size: var(--font-size-social-pill);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-social-circle-label);
    text-transform: uppercase;
  }

  & dd {
    display: flex;
    gap: var(--space-social-circle-tally-icon);
    align-items: center;
    margin: 0;
    font-family: var(--font-headings);
    font-size: var(--font-size-social-circle-tally);
    font-weight: var(--font-weight-headings-heavy);
    line-height: 1;
    font-variant-numeric: tabular-nums;

    & :global(svg) {
      inline-size: var(--size-social-circle-tally-icon);
      block-size: var(--size-social-circle-tally-icon);
    }
  }
}

/* The first three stats tinted in their own color, the watchers' and plays' icons in it too. */
.watchers {
  --tally-tone: var(--color-social-together);
}

.plays {
  --tally-tone: var(--color-social-circle-plays);
}

.mark {
  display: inline-flex;
  color: var(--tally-tone);
}

/* Each person on the featured title, a card each, three across. */
.people {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-social-circle-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    min-inline-size: 0;
    padding: var(--space-social-circle-person);
    border: 1px solid var(--color-why-border);
    border-radius: var(--radius-card-framed);
    background-color: var(--color-social-circle-person-bg);
    font-size: var(--font-size-menu);
  }
}

.heart {
  display: inline-flex;
}

.standouts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-social-circle-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    min-inline-size: 0;
  }
}

/* A band under each story card in its reason's color, as Watching Now's progress bar sits. */
.band {
  display: block;
  block-size: var(--progress-under-height);
  border-end-start-radius: var(--radius-card-framed);
  border-end-end-radius: var(--radius-card-framed);
}

/* Under each story card: who, each naming themselves on hover, and the tags for what they did between them. */
.below {
  display: flex;
  gap: var(--space-social-circle-kicker);
  align-items: center;
  justify-content: space-between;
  margin-block-start: var(--space-social-circle-below);
}

.faces {
  display: flex;
  align-items: center;
  padding-inline-start: var(--social-face-overlap);
}

.face,
.more {
  display: block;
  flex: none;
  inline-size: var(--social-circle-face);
  block-size: var(--social-circle-face);
  margin-inline-start: calc(-1 * var(--social-face-overlap));
  border: 2px solid var(--color-social-circle-face-ring);
  border-radius: 50%;
  background-color: var(--color-social-face-more);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.standouts .faces {
  --color-social-circle-face-ring: var(--color-panel-gray);
}

.more {
  display: grid;
  place-items: center;
  color: var(--color-social-on-image);
  font-size: var(--font-size-social-pill);
  font-weight: var(--font-weight-headings-heavy);
}

/* Smaller tablets: the tally goes under the story. */
@container (width < 940px) {
  .banner {
    grid-template-columns: minmax(0, 1fr);
  }

  .tally {
    justify-self: start;
  }

  .people {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Narrower still: the story cards stack. */
@container (width < 700px) {
  .standouts,
  .people {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
