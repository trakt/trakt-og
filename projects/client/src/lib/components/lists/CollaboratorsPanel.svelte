<!--
  A list's "N collaborators" chip and the panel it opens under it, in the "Why this?" panel's style: the list's poster,
  name and a Collaborators eyebrow, the owner first, then each collaborator with their avatar, name and VIP label, each
  linking to their profile. The page draws the chip through `trigger`, spreading its attributes on a button; a tooltip
  on it says it opens.
    <CollaboratorsPanel {collaborators} list={{ name, poster }} {owner}>
      {#snippet trigger(attrs)}<button class="chip" {...attrs}>3 collaborators</button>{/snippet}
    </CollaboratorsPanel>
-->
<script lang="ts">
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import type { Collaborator } from '$lib/users/lists/Collaborator';
import type { VipBadge } from '$lib/users/VipBadge';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';

type TriggerProps = Record<string, string> & { [key: symbol]: Attachment<HTMLElement> };
type Person = Pick<Collaborator, 'name' | 'href'> & { readonly avatar?: string; readonly vip?: VipBadge | null };

interface Props {
  collaborators: readonly Person[];
  list: { readonly name: string; readonly poster?: string };
  /** The list's owner, first and marked as such. */
  owner?: Person;
  trigger: Snippet<[TriggerProps]>;
}

const { collaborators, list, owner, trigger: chip }: Props = $props();
const id = $props.id();
let panel = $state<HTMLDivElement>();

// Focus moves into the panel when it opens, onto its close button.
function toggled(event: ToggleEvent) {
  if (event.newState === 'open') panel?.querySelector<HTMLElement>('.close')?.focus();
}
</script>

<!-- Profiles link by slug; resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet person(who: Person, role?: string)}
  <li>
  <a href={who.href}>
    <span class="avatar">{#if who.avatar}<img src={who.avatar} alt="" loading="lazy" decoding="async" />{/if}</span>
    <span class="name">{who.name}</span>
    <span class="badges">
        {#if who.vip}<VipLabel badge={who.vip} pill />{/if}
        {#if role}<span class="role">{role}</span>{/if}
      </span>
  </a>
</li>
{/snippet}

<Tooltip text="See who collaborates on this list">
  {#snippet trigger(tooltip)}{@render chip({
      ...tooltip,
      popovertarget: `collaborators-${id}`,
      style: `anchor-name: --collaborators-${id}`,
      'aria-haspopup': 'dialog',
    })}{/snippet}
</Tooltip>
<div bind:this={panel} id="collaborators-{id}" class="panel" popover="auto" role="dialog"
  aria-labelledby="collaborators-{id}-title" style:position-anchor="--collaborators-{id}" ontoggle={toggled}>
  <header>
    <span class="poster">{#if list.poster}<img src={list.poster} alt="" decoding="async" />{/if}</span>
    <div>
      <span
        class="eyebrow"><Icon svg={userGroup} />{collaborators.length} collaborator{collaborators.length === 1 ? '' : 's'}</span>
      <h4 id="collaborators-{id}-title">{list.name}</h4>
    </div>
    <button type="button" class="close" aria-label="Close"
      onclick={() => panel?.hidePopover()}><Icon svg={xmark} /></button>
  </header>
  <ul>
    {#if owner}{@render person(owner, 'Owner')}{/if}
    {#each collaborators as who (who.href)}{@render person(who)}{/each}
  </ul>
  <p class="foot">Collaborators can add and remove this list's items.</p>
</div>

<style>
/* Centred under the chip, its arrow pointing up at it, like Why this?'s. The list scrolls, so the arrow isn't clipped. */
.panel {
  position: fixed;
  position-area: bottom;
  position-try-fallbacks: none;
  inset: auto;
  inline-size: var(--collaborators-panel-width);
  max-inline-size: calc(100vw - var(--gutter));
  max-block-size: var(--collaborators-panel-height);
  margin: var(--why-arrow-offset) 0 0;
  padding: 0;
  overflow: visible;
  border: 1px solid var(--color-why-border);
  border-radius: var(--radius-why-panel);
  background: var(--color-why-panel-bg);
  box-shadow: var(--shadow-why-panel);
  color: var(--color-why-text);
  font-size: var(--font-size-menu);
  text-align: start;
  white-space: normal;

  &:popover-open {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  /* The header's tint over the panel's fill, so it joins the header; clipped to the half outside the panel. */
  &::before {
    content: '';
    position: absolute;
    inset-block-end: 100%;
    inset-inline-start: 50%;
    clip-path: polygon(0 0, 100% 0, 0 100%);
    inline-size: var(--why-arrow);
    block-size: var(--why-arrow);
    border-inline-start: 1px solid var(--color-why-border);
    border-block-start: 1px solid var(--color-why-border);
    background:
      linear-gradient(var(--color-collaborators-header-tint), var(--color-collaborators-header-tint)),
      var(--color-why-panel-bg);
    translate: -50% 50%;
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
  border-start-start-radius: inherit;
  border-start-end-radius: inherit;
  background: var(--gradient-collaborators-header);
}

.poster {
  position: relative;
  display: block;
  inline-size: var(--why-header-poster);
  aspect-ratio: var(--ratio-poster);
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

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--why-stars-gap);
  color: var(--color-collaborators-mark);
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
  align-content: start;
  margin: 0;
  overflow-y: auto;
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

.avatar {
  display: block;
  inline-size: var(--why-row-poster);
  block-size: var(--why-row-poster);
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-avatar-border);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.name {
  overflow: hidden;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badges {
  display: inline-flex;
  align-items: center;
  gap: var(--why-chips-gap);

  & :global(.label-vip) {
    margin-inline-start: 0;
  }
}

/* The owner's chip: the collaborators' orange, tinted like the Why panel's chips. */
.role {
  padding: var(--search-pill-padding);
  border-radius: var(--radius-search-pill);
  background: color-mix(in srgb, var(--color-list-chip-collaborators) var(--glass-action-tint), transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-list-chip-collaborators) var(--glass-action-line),
    transparent);
  font-size: var(--font-size-search-pill);
  font-weight: var(--font-weight-headings-heavy);
}

.foot {
  margin: 0;
  padding: var(--why-foot-padding);
  border-block-start: 1px solid var(--color-why-border);
  color: var(--color-why-faint);
  font-size: var(--font-size-small);
}
</style>
