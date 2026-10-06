<!--
  OG's green "Add comment" (`a.new-comment-focus.main`), as an outlined button: it opens the page's new comment form.
  The comments subnav puts the icon first, the summary's comments heading puts a thin circled plus after the text. Renders nothing
  when the page has no form: logged out, or banned from commenting.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import thinPlus from '$lib/icons/thin/circle-plus.svg?raw';
import addCircle from '$lib/icons/trakt/add-circle.svg?raw';
import { newComment } from './newComment.svelte.ts';

const { heading = false }: { heading?: boolean } = $props();
</script>

{#if newComment.available}
  <button type="button" class={['add-comment', { heading }]} aria-controls="new-comment"
  onclick={() => newComment.open()}>
    {#if heading}
      <span class="text">Add comment</span><Icon svg={thinPlus} />
    {:else}
      <Icon svg={addCircle} /><span class="text">Add comment</span>
    {/if}
  </button>
{/if}

<style>
/* The outlined button of the dashboard's Approve All, so actions read as buttons beside the see-more text links. */
.add-comment {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  min-block-size: 0;
  padding: var(--action-button-padding);
  border: var(--action-button-border-width) solid var(--color-comment-add);
  border-radius: var(--radius-action-button);
  background: none;
  color: var(--color-comment-add);
  font-family: var(--font-headings);
  font-size: var(--font-size-action-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-see-more);

  &:hover {
    background-color: var(--color-comment-add-hover);
  }

  & :global(.icon) {
    font-size: var(--font-size-action-button-icon);
  }
}

.heading {
  margin-inline-end: var(--space-see-more-icon);
}
</style>
