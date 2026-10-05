<!--
  About Me: the owner's words under a faint quote mark, with their VIP years, join date and location. Empty, your own
  profile prompts you to write one, and anyone else's lists a few facts.
-->
<script lang="ts">
import CommentText from '$lib/components/comments/CommentText.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import Icon from '$lib/icons/Icon.svelte';
import pen from '$lib/icons/solid/pen.svg?raw';
import quote from '$lib/icons/solid/quote-left.svg?raw';
import type { AboutMeView } from './AboutMeView.ts';

const { view }: { view: AboutMeView } = $props();
const chips = $derived([
  { text: 'About Me' },
  ...(view.kind === 'filled' && view.vip ? [{ text: view.vip, alt: true }] : []),
]);
</script>

{#snippet foot()}
  {#if view.kind === 'filled'}
    {#if view.joined}On Trakt since <b>{view.joined}</b> ·{/if} {view.location}
  {/if}
{/snippet}

<ProfileBox tone="about" foot={view.kind === 'filled' ? foot : undefined}>
  {#if view.kind === 'filled'}<span class="quote"><Icon svg={quote} /></span>{/if}
  <BoxChips {chips} />
  {#if view.kind === 'filled'}
    <!-- Focusable because it scrolls, so the keyboard can reach it. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="about" role="region" aria-label="About Me" tabindex="0">
      <CommentText blocks={parseComment(view.about)} />
    </div>
  {:else if view.kind === 'self'}
    <p class="lead">Your About Me is empty.</p>
    <p class="subtle">Tell people what you watch, what you rewatch every winter, and what they'd better not spoil.</p>
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a class="cta" href={view.settingsHref} target="_blank" rel="noopener"><Icon svg={pen} /> Write your About Me</a>
  {:else}
    <p class="lead">{view.name} hasn't written one yet.</p>
    <ul class="facts">
      {#each view.facts as fact (fact.text)}<li>{fact.text} <b>{fact.bold}</b></li>{/each}
    </ul>
  {/if}
</ProfileBox>

<style>
.quote {
  position: absolute;
  inset-block-start: 6px;
  inset-inline-end: 12px;
  z-index: -1;
  color: var(--color-profile-quote);
  font-size: var(--profile-box-quote-size);
  line-height: 1;
}

.about {
  max-block-size: var(--profile-about-max-height);
  margin-inline-end: calc(-1 * var(--profile-box-padding));
  padding-inline-end: var(--profile-box-padding);
  overflow-y: auto;
  overflow-wrap: anywhere;

  :global(p) {
    margin: 0;
  }
}

.lead {
  margin: 0 0 6px;
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-lead);
  font-weight: var(--font-weight-headings);
  line-height: 1.3;
}

.subtle {
  margin: 0 0 10px;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-profile-box-subtitle);
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--color-profile-cta-border);
  border-radius: var(--radius-profile-chip);
  background-color: var(--color-profile-cta-bg);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  line-height: 1;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-card-text);
    color: var(--brand-primary);
    text-decoration: none;
  }
}

.facts {
  margin: 0;
  padding: 0;
  font-size: var(--font-size-profile-box-subtitle);
  list-style: none;

  li {
    padding-block: 3px;
    border-block-start: 1px solid var(--color-profile-chip-alt);

    &:first-child {
      border-block-start: 0;
    }
  }

  b {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings);
  }
}
</style>
