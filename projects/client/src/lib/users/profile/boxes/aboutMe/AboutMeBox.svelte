<!--
  About Me: its label, then the owner's words on red under a faint quote mark, cut with an ellipsis. Words that don't
  fit get an expand icon by the label, which grows the card two slots wide over the box beside it; its compress icon,
  or Escape, shrinks it back. On your own empty profile it says so,
  with a button to write one.
-->
<script lang="ts">
import LinkButton from '#lib/components/button/LinkButton.svelte';
import CommentText from '#lib/components/comments/CommentText.svelte';
import { parseComment } from '#lib/components/comments/text/parseComment.ts';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import Icon from '#lib/icons/Icon.svelte';
import shrinkIcon from '#lib/icons/solid/down-left-and-up-right-to-center.svg?raw';
import pen from '#lib/icons/solid/pen.svg?raw';
import growIcon from '#lib/icons/solid/up-right-and-down-left-from-center.svg?raw';
import quote from '#lib/icons/solid/quote-left.svg?raw';
import type { AboutMeView } from './AboutMeView.ts';

const { view }: { view: AboutMeView } = $props();
const id = $props.id();

let expanded = $state(false);
let overflowing = $state(false);
/** Growing or shrinking: the words' room is in between, so they aren't measured. */
let moving = $state(false);
let toggle = $state<HTMLButtonElement>();

function setExpanded(value: boolean) {
  moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  expanded = value;
}

/** Whether the words run past the card. Measured only while it's narrow and still, since the wide card fits more. */
const measure = (element: HTMLElement) => {
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!expanded && !moving) overflowing = element.scrollHeight > element.clientHeight + 1;
    });
  });
  observer.observe(element);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
};

function collapse(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !expanded) return;
  setExpanded(false);
  toggle?.focus();
}
</script>

{#snippet more()}
  <Tooltip text={expanded ? 'Show less' : 'Show all'}>
    {#snippet trigger(tooltip)}
      <button bind:this={toggle} type="button" class="grow" aria-expanded={expanded} aria-controls="{id}-words"
        aria-label={expanded ? 'Show less' : 'Show all'} onclick={() => setExpanded(!expanded)} {...tooltip}>
        <Icon svg={expanded ? shrinkIcon : growIcon} />
      </button>
    {/snippet}
  </Tooltip>
{/snippet}

{#snippet top()}
  {#if view.kind === 'filled'}
    <!-- Focusable because it can scroll, so the keyboard can reach it. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div id="{id}-words" class={['about', { clamped: !expanded }]} role="region" aria-label={view.label} tabindex="0"
      {@attach measure}>
      <CommentText blocks={parseComment(view.about)} />
    </div>
  {:else}
    <div class="about"><CommentText blocks={parseComment('Your About Me is empty.')} /></div>
  {/if}
{/snippet}

<div class="slot">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class={['sheet', { expanded }]} onkeydown={collapse}
    ontransitionend={(event) => event.propertyName === 'inline-size' && (moving = false)}>
    <ProfileBox label={view.label} tone="about" mark={quote} {top} aside={overflowing || expanded ? more : undefined}>
      {#if view.kind === 'self'}
        <LinkButton href={view.settingsHref} variant="tinted" arrow={false}><Icon svg={pen} /> Write your About Me</LinkButton>
      {/if}
    </ProfileBox>
  </div>
</div>

<style>
/* The card's place in the strip; the card itself sits over it, so it can grow past it. */
.slot {
  position: relative;
  block-size: var(--profile-box-height);
}

/* Grown: two slots wide, over the box beside it. */
.sheet {
  --profile-box-height: 100%;
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 1;
  inline-size: 100%;
  block-size: 100%;
  border-radius: var(--radius-profile-box);
  transition:
    inline-size var(--transition-profile-about-expand),
    box-shadow var(--transition-profile-about-expand);

  &.expanded {
    inline-size: calc(200% + var(--profile-box-gap));
    box-shadow: var(--shadow-profile-box-poster);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.about {
  flex: 1;
  min-block-size: 0;
  margin-block-start: var(--profile-box-about-gap);
  margin-inline-end: calc(-1 * var(--profile-box-padding));
  padding-inline-end: var(--profile-box-padding);
  overflow-y: auto;
  overflow-wrap: anywhere;

  :global(p) {
    margin: 0;
  }

  /* As many lines as fit, the last cut with an ellipsis. */
  &.clamped {
    display: -webkit-box;
    flex: none;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--profile-about-lines);
  }
}

/* A bare icon by the label, white under the pointer. */
.grow {
  display: inline-flex;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-profile-label);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    color: var(--color-card-text);
  }
}
</style>
