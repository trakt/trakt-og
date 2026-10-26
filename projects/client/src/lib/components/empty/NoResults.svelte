<!--
  OG's empty grid on the dark charts and search frames: the faded hooded figure over "These aren't the droids you're
  looking for.", with at most one way out under it as og's outline button. Only those two pages use it; everywhere
  else the empty state is EmptyState.
    <NoResults action={{ href: chartUrl, text: 'Clear filters' }} />
-->
<script lang="ts">
import hooded from '$lib/assets/no-results-hooded.png';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import type { EmptyAction } from './EmptyAction.ts';

const { action }: { action?: EmptyAction } = $props();
</script>

<div class="no-results">
  <img src={hooded} alt="" />
  <p>These aren't the droids<br />you're looking for.</p>
  {#if action && 'href' in action}
    <span class="action"><LinkButton href={action.href} variant="outline">{action.text}</LinkButton></span>
  {:else if action}
    <span class="action"><LinkButton onclick={action.onclick} variant="outline">{action.text}</LinkButton></span>
  {/if}
</div>

<style>
.no-results {
  display: grid;
  justify-items: center;
  gap: var(--no-results-gap);
  padding-block: var(--no-results-padding);
  color: var(--color-no-results-text);
  font-family: var(--font-headings);
  text-align: center;
}

img {
  display: block;
  inline-size: var(--no-results-image);
  margin-block-end: var(--no-results-image-gap);
  opacity: 0.5;
}

p {
  margin: 0;
  font-size: var(--font-size-no-results);
  font-weight: var(--font-weight-headings-light);
  line-height: var(--line-height-headings);
}

.action {
  margin-block-start: var(--no-results-action-gap);
  color: var(--color-no-results-action);
}
</style>
