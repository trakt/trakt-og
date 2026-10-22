<script lang="ts">
import { getContext } from 'svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Icon from '$lib/icons/Icon.svelte';
import timer from '$lib/icons/solid/timer.svg?raw';
import blockThick from '$lib/icons/trakt/block-thick.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';
import userPlus from '$lib/icons/regular/user-plus.svg?raw';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { relationshipRequest } from '$lib/users/relationshipRequest';
import type { ViewerRelation } from '$lib/users/ViewerRelation';

interface Props {
  slug: string;
  isPrivate: boolean;
  relation: ViewerRelation;
  canFollow?: boolean;
}
const { slug, isPrivate, relation, canFollow = true }: Props = $props();
const overlay = getContext<ReturnType<typeof createRelationshipOverlay>>('user-relationships') ??
  createRelationshipOverlay();
const entry = $derived(overlay.state(slug, relation));
const current = $derived(entry.relation);
const busy = $derived(overlay.busy(slug));
const removing = $derived(current.follow !== 'none');
const label = $derived(current.follow === 'none' ? 'Follow' : current.follow === 'pending' ? 'Pending' : 'Following');
const hover = $derived(current.follow === 'pending' ? 'Cancel' : 'Unfollow');
let followButton = $state<HTMLButtonElement>();
async function change(action: 'follow' | 'unfollow' | 'block' | 'unblock') {
  const saved = await changeRelationship({
    slug,
    isPrivate,
    relation,
    action,
    overlay,
    request: relationshipRequest,
    notify: toast,
  });
  if (saved && (action === 'block' || action === 'unblock')) followButton?.focus({ preventScroll: true });
}
</script>

{#if removing || canFollow}
  <button bind:this={followButton} type="button" class={['btn', 'profile', current.follow, { removing }]}
  aria-label="{removing ? hover : label} {slug}" aria-busy={busy} aria-disabled={busy}
  onclick={() => change(removing ? 'unfollow' : 'follow')}>
    {#if !removing}<Icon svg={userPlus} />{/if}
    {#if removing}
      <span class="status-icon"><Icon svg={current.follow === 'pending' ? timer : checkThick} /></span>
      <span class="remove-icon"><Icon svg={deleteThick} /></span>
    {/if}
    <span class="normal-text">{label}</span>{#if removing}<span class="hover-text">{hover}</span>{/if}
  </button>
{/if}
{#if !entry.hideBlock && (current.followsYou || current.blocked)}
  <button type="button" class={['btn', 'profile', 'secondary', 'removing', { blocked: current.blocked }]}
  aria-busy={busy} aria-disabled={busy}
  aria-label="{current.blocked ? 'Unblock' : 'Block'} {slug}"
  onclick={() => change(current.blocked ? 'unblock' : 'block')}>
  <span class="status-icon"><Icon svg={current.blocked ? blockThick : checkThick} /></span>
  <span class="remove-icon"><Icon svg={deleteThick} /></span>
  <span class="normal-text">{current.blocked ? 'Blocked' : 'Follows You'}</span>
  <span class="hover-text">{current.blocked ? 'Unblock' : 'Block User'}</span>
</button>
{/if}

<style>
.btn {
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;
}
button {
  cursor: pointer;
}
button[aria-disabled="true"] {
  cursor: wait;
}
/* On the cover: green outlined glass to follow, solid green while following, red on hover for anything that removes. */
.profile {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  block-size: var(--profile-button-height);
  min-block-size: 0;
  padding: 0 var(--profile-button-padding);
  border: var(--action-button-border-width) solid var(--color-profile-button-border);
  border-radius: var(--radius-profile-button);
  background-color: var(--color-profile-pill-bg);
  backdrop-filter: var(--blur-profile-pill);
  font-size: var(--font-size-action-button);
  line-height: 1;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
  /* Not following yet: only the outline and text are green, so the solid fill means you follow them. */
  &.none {
    border-color: var(--color-profile-follow);
    color: var(--color-profile-follow-text);
    &:is(:hover, :focus-visible) {
      border-color: var(--color-profile-follow-hover-border);
      background-color: var(--color-profile-follow-hover);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-follow-hover);
    }
  }
  &.following {
    border-color: var(--color-profile-follow);
    background-color: var(--color-profile-follow-solid);
  }
  &.blocked {
    border-color: var(--color-profile-remove);
    color: var(--color-profile-remove);
  }
  &.removing:is(:hover, :focus-visible) {
    border-color: var(--color-profile-remove);
    background-color: var(--color-profile-remove-hover);
    color: var(--color-profile-remove);
  }
  /* Unblocking puts things back, so it goes neutral. */
  &.blocked:is(:hover, :focus-visible) {
    border-color: var(--color-profile-button-border-hover);
    background-color: var(--color-profile-button-hover-bg);
    color: var(--color-text-inverse);
  }
}
.hover-text,
.remove-icon {
  display: none;
}
.removing:is(:hover, :focus-visible) {
  & .normal-text,
  & .status-icon {
    display: none;
  }
  & .hover-text,
  & .remove-icon {
    display: inline;
  }
}
.profile .remove-icon,
.profile .status-icon {
  line-height: 0;
}
@media (prefers-reduced-motion: reduce) {
  .profile {
    transition: none;
  }
}
</style>
