<!--
  OG's green "Add comment" (`a.new-comment-focus.main`): it shows the page's new comment form, scrolls to it and
  focuses it. The filled green toolbar button of the lists page's Add list, icon first. Logged out, it signs in and
  comes back. Renders nothing for a member banned from commenting (the page has no form).
-->
<script lang="ts">
import { page } from '$app/state';
import { authStep } from '#lib/auth/authStep.svelte.ts';
import { signInHref } from '#lib/auth/signInHref.ts';
import Icon from '#lib/icons/Icon.svelte';
import addCircle from '#lib/icons/regular/circle-plus.svg?raw';
import { newComment } from './newComment.svelte.ts';
</script>

{#if newComment.available}
  <button type="button" class="add-comment" aria-controls="new-comment"
  aria-expanded={newComment.visible} onclick={(event) => newComment.open(event.currentTarget)}>
    <Icon svg={addCircle} /><span class="text">Add comment</span>
  </button>
{:else if !page.data.settings}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the sign-in href carries this page's query. -->
  <a class="add-comment" href={signInHref(page.url)} onclick={authStep.signIn('gate')}>
    <Icon svg={addCircle} /><span class="text">Add comment</span>
  </a>
{/if}

<style>
.add-comment {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: var(--action-button-border-width) solid var(--color-action-add-fill);
  border-radius: var(--radius-control);
  background-color: var(--color-action-add-fill);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-action-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color var(--transition-see-more), background-color var(--transition-see-more);

  &:hover {
    border-color: var(--color-action-add-fill-hover);
    background-color: var(--color-action-add-fill-hover);
  }

  & :global(.icon) {
    font-size: var(--font-size-action-button-icon);
  }
}
</style>
