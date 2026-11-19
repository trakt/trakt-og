<!--
  A profile box's title and the line under it, each a link when it has an href. One line each, cut with an ellipsis.
  A movie's `year` follows its title, lighter, as on the fanart cards; a subtitle's `lead` is bold, like an episode's
  "2x09".
-->
<script lang="ts">
type Line = { readonly text: string; readonly href?: string; readonly lead?: string };

interface Props {
  title: Line;
  year?: string;
  subtitle?: Line;
}

const { title, year, subtitle }: Props = $props();
</script>

<!-- The profile's subpages aren't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet words({ text, lead }: Line, after?: string)}
  <span class="text">{#if lead}<b>{lead}</b>{/if} {text}{#if after}<span class="year">{after}</span>{/if}</span>
{/snippet}
{#snippet line(tag: 'h3' | 'h4', content: Line, after?: string)}
  {#if content.href}
    <a href={content.href}><svelte:element this={tag}>{@render words(content, after)}</svelte:element></a>
  {:else}
    <svelte:element this={tag}>{@render words(content, after)}</svelte:element>
  {/if}
{/snippet}

<div class="title">
  {@render line('h3', title, year)}
  {#if subtitle}{@render line('h4', subtitle)}{/if}
</div>

<style>
/* A column, so the lines' negative margins add up instead of collapsing. */
.title {
  display: flex;
  flex-direction: column;
}

a {
  display: block;
}

/* Room around each line for its shadow, which the ellipsis' clipping would cut; only the words take the pointer, so
   the room doesn't widen a link. */
h3,
h4 {
  margin: calc(-1 * var(--profile-box-shadow-room));
  padding: var(--profile-box-shadow-room);
  overflow: hidden;
  pointer-events: none;
  color: inherit;
  text-overflow: ellipsis;
  text-shadow: var(--text-shadow-headings);
  white-space: nowrap;
}

h3 {
  font-size: var(--font-size-profile-box-title);
  font-weight: var(--font-weight-headings);
}

h4 {
  margin-block-start: calc(2px - var(--profile-box-shadow-room));
  font-size: var(--font-size-profile-box-subtitle);
  font-weight: var(--font-weight-headings-light);

  b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.text {
  pointer-events: auto;
}

.year {
  margin-inline-start: 0.25em;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-light);
}
</style>
