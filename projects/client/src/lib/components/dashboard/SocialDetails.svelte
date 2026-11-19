<!--
  A Social Feed poster's or Hot in Your Network story card's details, in the "Why this?" panel's frame with a watched-purple wash: the title's poster and
  name, then each person the viewer follows who was on it, latest first, with how long ago and the comment tags for
  what they did. A person's card (with `member`) leads with their face instead, and lists their titles. Put it in the
  poster's overlay: it opens while the mouse rests on the poster, or while the card has
  keyboard focus, and stays open while the mouse is on it. It opens above the poster, its arrow pointing back, or below
  without room above. Clicks still go to the poster's link.
    <PosterCard …>{#snippet posterOverlay()}<SocialDetails card={card} now={now} />{/snippet}</PosterCard>
-->
<script lang="ts">
import type { SocialCard } from '#lib/dashboard/toSocialBoard.ts';
import Icon from '#lib/icons/Icon.svelte';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import user from '#lib/icons/regular/user.svg?raw';
import { tick } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import SocialPerson from './SocialPerson.svelte';

type Card = Pick<SocialCard, 'href' | 'title' | 'number' | 'poster' | 'details' | 'member'>;
const { card, now }: { card: Card; now: Date } = $props();
const id = $props.id();
/** A resting mouse, not one passing over the grid. */
const OPEN_DELAY = 80;
/** Time to cross the gap between the poster and the panel. */
const CLOSE_DELAY = 150;
let panel = $state<HTMLDivElement>();
let below = $state(false);
// Hidden until it's on its side, so it never shows a frame on the wrong one.
let placing = $state(false);
let opening: ReturnType<typeof setTimeout> | undefined;
let closing: ReturnType<typeof setTimeout> | undefined;

function show() {
  clearTimeout(closing);
  if (panel?.matches(':popover-open')) return;
  clearTimeout(opening);
  opening = setTimeout(() => {
    below = false;
    placing = true;
    panel?.showPopover();
  }, OPEN_DELAY);
}

function hide() {
  clearTimeout(opening);
  clearTimeout(closing);
  closing = setTimeout(() => {
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }, CLOSE_DELAY);
}

// Without room above, the browser keeps the panel on screen over its poster, so it goes below instead.
async function toggled(event: ToggleEvent) {
  if (event.newState !== 'open') return;
  await tick();
  const box = panel?.getBoundingClientRect();
  const poster = anchor?.getBoundingClientRect();
  below = box !== undefined && (box.top < 0 || (poster !== undefined && box.bottom > poster.top));
  placing = false;
}

let anchor = $state<HTMLElement>();

/** The panel is inside the poster's wrapper, so the mouse moving onto it never leaves the poster. */
const hover: Attachment<HTMLElement> = (element) => {
  anchor = element;
  const poster = element.parentElement;
  const article = element.closest('article');
  const enter = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') show();
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && panel?.matches(':popover-open')) panel.hidePopover();
  };
  poster?.addEventListener('pointerenter', enter);
  poster?.addEventListener('pointerleave', hide);
  article?.addEventListener('focusin', show);
  article?.addEventListener('focusout', hide);
  article?.addEventListener('keydown', escape);

  return () => {
    clearTimeout(opening);
    clearTimeout(closing);
    poster?.removeEventListener('pointerenter', enter);
    poster?.removeEventListener('pointerleave', hide);
    article?.removeEventListener('focusin', show);
    article?.removeEventListener('focusout', hide);
    article?.removeEventListener('keydown', escape);
  };
};
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<span class="anchor" style:anchor-name="--social-{id}" {@attach hover}></span>
<div bind:this={panel} id="social-{id}" class={['panel', { below, placing }]} popover="manual" role="dialog"
  aria-labelledby="social-{id}-title" style:position-anchor="--social-{id}" ontoggle={toggled}>
  <header>
    {#if card.member}
      <a class="poster face" href={card.href} tabindex="-1" aria-hidden="true"><img src={card.member.avatar} alt=""
          decoding="async" /></a>
    {:else}
      <a class="poster" href={card.href} tabindex="-1" aria-hidden="true">{#if card.poster}<img src={card.poster}
            alt="" decoding="async" />{/if}</a>
    {/if}
    <div>
      <span class="eyebrow"><Icon svg={card.member ? user : userGroup} />{card.member ? 'You follow' : 'People you follow'}</span>
      <h4 id="social-{id}-title"><a href={card.href}>{card.number ? `${card.number} ${card.title}` : card.title}</a></h4>
    </div>
  </header>
  <ul>
    {#each card.details ?? [] as detail (detail.title?.href ?? detail.member.key)}
      <li><SocialPerson {detail} {now} /></li>
    {/each}
  </ul>
</div>

<style>
/* The poster's box, for the panel to point at. */
.anchor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel {
  position: fixed;
  position-area: top;
  position-try-fallbacks: none;
  inset: auto;
  inline-size: var(--why-panel-width);
  max-inline-size: calc(100vw - var(--gutter));
  margin: 0 0 var(--why-arrow-offset);
  padding: 0;
  overflow: visible;
  border: 1px solid var(--color-why-border);
  border-radius: var(--radius-why-panel);
  background: var(--color-why-panel-bg);
  box-shadow: var(--shadow-why-panel);
  color: var(--color-why-text);
  font-size: var(--font-size-menu);

  &:popover-open {
    display: grid;
  }

  /* The arrow, centered under the panel, pointing down at the poster. */
  &::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 50%;
    inline-size: var(--why-arrow);
    block-size: var(--why-arrow);
    border-inline-end: 1px solid var(--color-why-border);
    border-block-end: 1px solid var(--color-why-border);
    background: var(--color-why-panel-bg);
    translate: -50% -50%;
    rotate: 45deg;
  }

  &.placing {
    visibility: hidden;
  }

  /* Below its poster, the arrow on top pointing up. */
  &.below {
    position-area: bottom;
    margin: var(--why-arrow-offset) 0 0;

    &::after {
      inset-block: auto 100%;
      translate: -50% 50%;
      rotate: 225deg;
    }
  }
}

header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-why-row);
  padding: var(--why-panel-padding);
  border-block-end: 1px solid var(--color-why-border);
  background: var(--gradient-social-details-header);
  border-start-start-radius: var(--radius-why-panel);
  border-start-end-radius: var(--radius-why-panel);
}

.poster {
  position: relative;
  display: block;
  inline-size: var(--why-header-poster);
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-recommendations-placeholder);

  &.face {
    aspect-ratio: 1;
    border-radius: 50%;
  }

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--why-stars-gap);
  color: var(--color-social-details-mark);
  font-size: var(--font-size-recommendations-side-head);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-recommendations-side-head);
  text-transform: uppercase;
}

h4 {
  margin: 0;
  font-size: var(--font-size-why-panel-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-recommendations-title);

  & a {
    color: inherit;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}

ul {
  display: grid;
  margin: 0;
  padding: var(--why-list-padding);
  list-style: none;
}

li {
  padding: var(--why-row-padding);
}
</style>
