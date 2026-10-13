<!--
  An incoming follow request: a second glass deck under the site header, in the header's glass and art tint with a
  blue wash. A green "Follow request" tag, the requester's avatar and "Neil wants to follow you", then Approve, Deny
  and Block as outlined buttons on a darker tint of their own color. Once answered, the deck says what happened.
-->
<script lang="ts">
import { getContext } from 'svelte';
import Container from '$lib/components/container/Container.svelte';
import HeaderTint from '$lib/components/header/HeaderTint.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { relationshipRequest } from '$lib/users/relationshipRequest';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import userPlus from '$lib/icons/regular/user-plus.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';

const { firstName, slug, avatarUrl, isPrivate, relation }: {
  firstName: string;
  slug: string;
  avatarUrl: string;
  isPrivate: boolean;
  relation: ViewerRelation;
} = $props();
const overlay = getContext<ReturnType<typeof createRelationshipOverlay>>('user-relationships') ??
  createRelationshipOverlay();
const decision = $derived(overlay.state(slug, relation).decision);
const busy = $derived(overlay.busy(slug));
const change = (action: 'approve' | 'deny' | 'blockRequest') =>
  changeRelationship({ slug, isPrivate, relation, action, overlay, request: relationshipRequest, notify: toast });
</script>

<section class="request-bar" aria-label="Follow request">
  <HeaderTint />
  <Container>
    <div class="row" aria-live="polite">
      {#if decision === null}
        <span class="tag"><Icon svg={userPlus} />Follow request</span>
        <span class="divider" aria-hidden="true"></span>
        <img class="avatar" src={avatarUrl} alt="" width="28" height="28" />
        <p class="question"><b>{firstName}</b> wants to follow you</p>
        <div class="actions">
          <button type="button" class="approve" aria-busy={busy} aria-disabled={busy} onclick={() => change('approve')}>
            <Icon svg={checkThick} />Approve
          </button>
          <button type="button" class="deny" aria-busy={busy} aria-disabled={busy} onclick={() => change('deny')}>
            <Icon svg={deleteThick} />Deny
          </button>
          <button type="button" class="block" aria-busy={busy} aria-disabled={busy} onclick={() => change('blockRequest')}>
            <Icon svg={ban} />Block
          </button>
        </div>
      {:else}
        <p class={['answer', decision]}>
          <Icon svg={decision === 'approve' ? checkThick : decision === 'deny' ? deleteThick : ban} />
          <span>
            {#if decision === 'approve'}
              Approved. <b>{firstName}</b> now follows you.
            {:else if decision === 'deny'}
              Denied <b>{firstName}</b>'s request.
            {:else}
              Blocked <b>{firstName}</b>.
            {/if}
          </span>
        </p>
      {/if}
    </div>
  </Container>
</section>

<style>
.request-bar {
  position: relative;
  isolation: isolate;
  background: var(--color-header-glass);
  backdrop-filter: var(--blur-header-glass);
  box-shadow: inset 0 -1px 0 var(--color-header-edge);
  color: var(--color-header-text);
  font-family: var(--font-headings);

  /* The blue wash goes over the art tint, so the deck stays blue whatever the cover. */
  &::after {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--color-profile-request-wash);
    pointer-events: none;
    content: '';
  }
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  block-size: var(--profile-request-bar-height);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm-block);
  color: var(--color-profile-request-tag);
  font-size: var(--font-size-profile-request-tag);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--profile-request-tag-tracking);
  text-transform: uppercase;
}

.divider {
  inline-size: 1px;
  block-size: 20px;
  margin-inline: var(--space-xs-inline);
  background-color: var(--color-profile-request-divider);
}

.avatar {
  flex: none;
  inline-size: var(--profile-request-avatar);
  block-size: var(--profile-request-avatar);
  border: 2px solid var(--color-text-inverse);
  border-radius: 50%;
  object-fit: cover;
}

.question,
.answer {
  margin: 0;
  font-size: var(--font-size-profile-request);
  white-space: nowrap;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.answer {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);

  & :global(.icon) {
    color: var(--color-profile-request-tag);
  }

  &:is(.deny, .block) :global(.icon) {
    color: var(--color-profile-deny-text);
  }
}

.actions {
  display: flex;
  gap: var(--space-sm-inline);
  margin-inline-start: auto;
}

/* Outlined, on a darker tint of each button's own color; hovering brightens the tint and the text goes white. */
button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  block-size: var(--profile-request-button-height);
  min-block-size: 0;
  padding: 0 var(--space-base-inline);
  border: var(--action-button-border-width) solid var(--color-profile-button-border);
  border-radius: var(--radius-profile-button);
  background-color: var(--color-profile-block-bg);
  color: var(--color-profile-block-text);
  font-size: var(--font-size-action-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;

  &.approve {
    border-color: var(--color-profile-approve-border);
    background-color: var(--color-profile-approve-bg);
    color: var(--color-profile-request-tag);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-profile-follow-hover-border);
      background-color: var(--color-profile-approve-hover-bg);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-approve-hover);
    }
  }

  &.deny {
    border-color: var(--color-profile-deny-border);
    background-color: var(--color-profile-deny-bg);
    color: var(--color-profile-deny-text);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-profile-remove);
      background-color: var(--color-profile-deny-hover-bg);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-deny-hover);
    }
  }

  &.block:is(:hover, :focus-visible) {
    border-color: var(--color-profile-deny-border);
    background-color: var(--color-profile-deny-bg);
    color: var(--color-profile-deny-text);
  }

  &[aria-disabled='true'] {
    cursor: wait;
  }
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
</style>
