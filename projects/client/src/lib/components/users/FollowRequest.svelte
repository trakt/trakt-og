<!--
  An incoming follow request, as its own question bar under the profile cover: "Neil wants to follow you", then
  Approve (solid green), Deny and Block (outlined, red on hover), in the cover's button style. Once answered, the
  bar says what happened instead of the buttons.
-->
<script lang="ts">
import { getContext } from 'svelte';
import Container from '$lib/components/container/Container.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { relationshipRequest } from '$lib/users/relationshipRequest';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import Icon from '$lib/icons/Icon.svelte';
import userPlus from '$lib/icons/regular/user-plus.svg?raw';
import blockThick from '$lib/icons/trakt/block-thick.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import deleteThick from '$lib/icons/trakt/delete-thick.svg?raw';

const { firstName, slug, isPrivate, relation }: {
  firstName: string;
  slug: string;
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
  <Container>
    <div class="row">
      <p class="question" aria-live="polite">
        <Icon svg={userPlus} />
        <span>
          {#if decision === 'approve'}
            You approved <b>{firstName}</b>'s follow request.
          {:else if decision === 'deny'}
            You denied <b>{firstName}</b>'s follow request.
          {:else if decision === 'block'}
            You blocked <b>{firstName}</b>.
          {:else}
            <b>{firstName}</b> wants to follow you
          {/if}
        </span>
      </p>
      {#if decision === null}
        <div class="actions">
          <button type="button" class="approve" aria-busy={busy} aria-disabled={busy} onclick={() => change('approve')}>
            <Icon svg={checkThick} />Approve
          </button>
          <button type="button" aria-busy={busy} aria-disabled={busy} onclick={() => change('deny')}>
            <Icon svg={deleteThick} />Deny
          </button>
          <button type="button" aria-busy={busy} aria-disabled={busy} onclick={() => change('blockRequest')}>
            <Icon svg={blockThick} />Block
          </button>
        </div>
      {/if}
    </div>
  </Container>
</section>

<style>
.request-bar {
  border-block-end: 1px solid var(--color-profile-request-bar-border);
  background-color: var(--color-profile-request-bar-bg);
  color: var(--color-text);
  font-family: var(--font-headings);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-block) var(--profile-slim-gap);
  min-block-size: var(--profile-request-bar-height);
  padding-block: var(--space-sm-block);
}

.question {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin: 0;
  font-size: var(--font-size-profile-request);

  & :global(.icon) {
    color: var(--color-profile-follow);
  }

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.actions {
  display: flex;
  gap: var(--profile-button-gap);
}

/* The cover's button style: outlined, green to approve, red on hover for the rest. */
button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  block-size: var(--profile-button-height);
  min-block-size: 0;
  padding: 0 var(--profile-button-padding);
  border: var(--action-button-border-width) solid var(--color-action-border);
  border-radius: var(--radius-profile-button);
  background: none;
  color: inherit;
  font-size: var(--font-size-action-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;

  &:is(:hover, :focus-visible) {
    border-color: var(--color-profile-remove);
    background-color: var(--color-profile-request-remove-hover);
    color: var(--color-profile-remove);
  }

  &.approve {
    border-color: var(--color-profile-follow);
    background-color: var(--color-profile-follow-solid);
    color: var(--color-text-inverse);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-profile-follow-hover-border);
      background-color: var(--color-profile-follow-hover);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-follow-hover);
    }
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
