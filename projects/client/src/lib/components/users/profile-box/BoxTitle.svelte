<!-- A profile box's title and the line under it, each a link when it has an href. One line each, cut with an ellipsis. -->
<script lang="ts">
type Line = { readonly text: string; readonly href?: string };

interface Props {
  title: Line;
  subtitle?: Line;
}

const { title, subtitle }: Props = $props();
</script>

<!-- The profile's subpages aren't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet line(tag: 'h3' | 'h4', { text, href }: Line)}
  {#if href}
    <a {href}><svelte:element this={tag}>{text}</svelte:element></a>
  {:else}
    <svelte:element this={tag}>{text}</svelte:element>
  {/if}
{/snippet}

{@render line('h3', title)}
{#if subtitle}{@render line('h4', subtitle)}{/if}

<style>
a {
  display: block;
}

h3,
h4 {
  margin: 0;
  overflow: hidden;
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
  margin-block-start: 2px;
  font-size: var(--font-size-profile-box-subtitle);
  font-weight: var(--font-weight-headings-light);
}
</style>
