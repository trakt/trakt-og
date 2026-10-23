<!--
  "Why this?" beside a recommendation's actions, and the panel it opens above it, its arrow pointing back at the button.
  The panel leads with the recommendation's poster and title, lists each title behind it with a chip saying how
  (the comments' tags: Watched joined with the viewer's rating, Loved, or both on one row), then the subgenres the viewer likes. Without any sources there's no
  button at all.
-->
<script lang="ts">
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import type { Recommendation, RecommendationSource } from '$lib/dashboard/Recommendation';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';

interface Props {
  why: Recommendation['why'];
  title: string;
  poster?: string;
}

const { why, title, poster }: Props = $props();
const id = $props.id();
const any = $derived(why.titles.length > 0 || why.likes.length > 0);
let panel = $state<HTMLDivElement>();

// Focus moves into the panel when it opens, onto its close button.
function toggled(event: ToggleEvent) {
  if (event.newState === 'open') panel?.querySelector<HTMLElement>('.close')?.focus();
}
</script>

<!-- Source titles link to their pages by slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet reason(source: RecommendationSource)}
  <li>
  <a href={source.href}>
    <span
      class="thumb">{#if source.poster}<img src={source.poster} alt="" loading="lazy" decoding="async" />{/if}</span>
    <span
      class="name"><span class="title">{source.title}</span>{#if source.year}<small>{source.year}</small>{/if}</span>
    <span class="chips">
      <!-- The comments' tags: Watched and the viewer's rating join into one, a segment each. -->
      {#if source.watched}
        <span class={['joined', { both: source.stars }]}>
          <span class="segment watched-segment">
            <CommentTag svg={checkThick} glyph tone="watched" tint>Watched</CommentTag>
          </span>
          {#if source.stars}
            <span class="segment rated-segment">
              <CommentTag svg={heart} tone="rated" tint><span class="visually-hidden">You rated it </span>{source.stars}</CommentTag>
            </span>
          {/if}
        </span>
      {/if}
      {#if source.loved}<CommentTag svg={heart} tone="rated" tint>Loved</CommentTag>{/if}
    </span>
  </a>
</li>
{/snippet}

{#if any}
  <GlassAction icon={sparkles} color="var(--color-why-button)" popovertarget="why-{id}" style="anchor-name: --why-{id}"
  aria-haspopup="dialog">
    Why this?
  </GlassAction>
  <div bind:this={panel} id="why-{id}" class="panel" popover="auto" role="dialog" aria-labelledby="why-{id}-title"
  style:position-anchor="--why-{id}" ontoggle={toggled}>
    <header>
      <span class="poster">{#if poster}<img src={poster} alt="" decoding="async" />{/if}</span>
      <div>
        <span class="eyebrow"><Icon svg={sparkles} />Why we picked</span>
        <h4 id="why-{id}-title">{title}</h4>
      </div>
      <button type="button" class="close" aria-label="Close" onclick={() => panel?.hidePopover()}><Icon
          svg={xmark}
        /></button>
    </header>
    {#if why.titles.length > 0}
      <ul>
        {#each why.titles as source (`${source.type}:${source.id}`)}{@render reason(source)}{/each}
      </ul>
    {/if}
    {#if why.likes.length > 0}
      <div class="likes">
        <span>You like</span>
        <TagPills tags={why.likes.map((text) => ({ text }))} />
      </div>
    {/if}
    <p class="foot">Picked daily from what you watch, love and like.</p>
  </div>
{/if}

<style>
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

  /* The arrow, centered under the panel, pointing down at the button. */
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
}

header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-why-row);
  padding: var(--why-panel-padding);
  border-block-end: 1px solid var(--color-why-border);
  background: var(--gradient-why-header);
  border-start-start-radius: var(--radius-why-panel);
  border-start-end-radius: var(--radius-why-panel);
}

.poster,
.thumb {
  position: relative;
  display: block;
  min-block-size: 0;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-recommendations-placeholder);

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.poster {
  inline-size: var(--why-header-poster);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--why-stars-gap);
  color: var(--color-why-mark);
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
}

/* Pulled toward the panel's corner. */
.close {
  display: grid;
  place-items: center;
  align-self: start;
  inline-size: var(--why-close);
  block-size: var(--why-close);
  min-block-size: 0;
  margin-block-start: calc(-1 * var(--why-close-pull));
  margin-inline-end: calc(-1 * var(--why-close-pull));
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-why-faint);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--color-why-more-hover);
    color: var(--color-why-text);
  }
}

ul {
  display: grid;
  margin: 0;
  padding: var(--why-list-padding);
  list-style: none;
}

li a {
  display: grid;
  grid-template-columns: var(--why-row-poster) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-why-row);
  padding: var(--why-row-padding);
  border-radius: var(--radius-control);
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus) {
    color: inherit;
    text-decoration: none;
  }

  &:is(:hover, :focus-visible) {
    background: var(--color-why-more-hover);
  }
}

.name {
  display: grid;
  overflow: hidden;
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  white-space: nowrap;

  & .title {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & small {
    color: var(--color-why-faint);
    font-size: var(--font-size-small);
    font-weight: normal;
  }
}

.chips {
  display: flex;
  gap: var(--why-chips-gap);
}

.joined,
.segment {
  display: inline-flex;
}

.both > .watched-segment :global(.tag) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.both > .rated-segment {
  margin-inline-start: -1px;

  & :global(.tag) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
}

.likes {
  display: grid;
  gap: var(--space-why-likes);
  padding: var(--why-likes-padding);

  & > span {
    color: var(--color-why-faint);
    font-size: var(--font-size-recommendations-side-head);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-recommendations-side-head);
    text-transform: uppercase;
  }
}

.foot {
  margin: 0;
  padding: var(--why-foot-padding);
  border-block-start: 1px solid var(--color-why-border);
  color: var(--color-why-faint);
  font-size: var(--font-size-small);
}
</style>
