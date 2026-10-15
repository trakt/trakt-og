<!--
  The title block of a slim fanart header on a subpage: the tag bar (the page label, "Stats" or "Shout by NAME", then
  for seasons and episodes the show and season, an episode's type and post-credits scenes), then the h1 linking back
  to the item, with the certification after it.
-->
<script lang="ts">
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { SpoilerTarget } from '$lib/settings/SpoilerTarget';
import Certification from './Certification.svelte';
import TitleTags from './TitleTags.svelte';
import type { ComponentProps } from 'svelte';

interface Props {
  label: string;
  target?: SpoilerTarget;
  /** The way up: the show, then the season. */
  parents?: ComponentProps<typeof TitleTags>['links'];
  /** An episode's type: "Season Finale". */
  type?: ComponentProps<typeof TitleTags>['type'];
  /** A movie's or episode's scenes during and after the credits. */
  credits?: ComponentProps<typeof TitleTags>['credits'];
  certification?: string;
  /** An episode's number, shown apart from its name so only the name hides behind the spoiler setting. */
  number?: string;
  /** The name: an episode's without its number, or the item's whole title. */
  title?: string;
  year?: number | null;
  href: string;
}

const { label, parents, type, credits, certification, number, title, year, href, target }: Props = $props();
</script>

<!-- The item's canonical URL comes from the API slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="subpage-title">
  <TitleTags {label} links={parents} {type} {credits} />
  <h1>
    {#if number}<a {href}><strong>{number}</strong></a>{/if}
    {#if title}<MediaSpoiler {target} kind="title" inline><a {href}>{title}</a></MediaSpoiler>{/if}
    {#if year}<span class="year">{year}</span>{/if}{#if certification}<Certification {certification} />{/if}
  </h1>
</div>

<style>
.subpage-title {
  padding-inline-start: var(--summary-offset);
  @media (width < 992px) {
    padding-inline-start: var(--summary-offset-sm);
  }
  @media (width < 768px) {
    padding-inline-start: 0;
  }
}
a {
  color: var(--gray-lighter);
  &:is(:hover, :focus-visible) {
    color: var(--brand-primary);
    text-decoration: none;
  }
}
/* The episode number in the title's own weight; only the name beside it can blur. */
strong {
  font-weight: inherit;
}
.year {
  color: var(--gray-light);
  font-size: var(--font-size-header-year);
  font-weight: var(--font-weight-headings-light);
}
</style>
