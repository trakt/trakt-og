<!--
  A wide banner under the help page's header, like the about page's Trakt API banner: a round mark, what goes there
  and why on a tint of its color, and the ways out on the right.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  id: string;
  /** The round mark, as big as the API banner's. */
  mark: Snippet;
  /** The tint that fades in from the banner's start. */
  tint: string;
  title: string;
  children: Snippet;
  actions: Snippet;
}

const { id, mark, tint, title, children, actions }: Props = $props();
</script>

<section class="banner" aria-labelledby={id} style:--help-banner-color={tint}>
  <span class="mark">{@render mark()}</span>
  <div>
    <h2 {id}>{title}</h2>
    <p>{@render children()}</p>
  </div>
  <div class="actions">{@render actions()}</div>
</section>

<style>
.banner {
  display: grid;
  grid-template-columns: var(--about-api-mark) minmax(0, 1fr) auto;
  gap: var(--about-api-gap);
  align-items: center;
  padding: var(--about-api-padding);
  border-radius: var(--about-banner-radius);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--help-banner-color) var(--help-banner-tint), transparent), transparent 70%),
    var(--color-panel-gray);
  box-shadow: 0 0 0 1px var(--color-home-line);
}

.mark {
  inline-size: var(--about-api-mark);
  block-size: var(--about-api-mark);
}

h2 {
  margin: 0 0 var(--home-credit-gap);
  font-size: var(--font-size-h4);
}

p {
  max-inline-size: var(--about-body-width);
  margin: 0;
  line-height: var(--line-height-about-body);
  color: var(--color-home-soft);
  text-wrap: balance;

  & :global(b) {
    color: var(--color-home-text);
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: var(--help-actions-gap);
}

@container (width < 1000px) {
  .banner {
    grid-template-columns: var(--about-api-mark) minmax(0, 1fr);
  }

  .actions {
    grid-column: 2;
    justify-content: start;
  }
}
</style>
