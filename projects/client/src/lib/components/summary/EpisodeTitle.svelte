<!--
  An episode summary's title block: the tag bar (the show and season, the episode type, post-credits scenes), then the
  h1 with the episode number, its title behind the spoiler setting, the year and the certification.
-->
<script lang="ts">
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { SpoilerTarget } from '$lib/settings/SpoilerTarget';
import type { episodeType } from '$lib/components/media/episodeTags';
import Certification from '$lib/components/summary/Certification.svelte';
import TitleTags from '$lib/components/summary/TitleTags.svelte';
import type { ComponentProps } from 'svelte';
interface Props {
  /** The way up: the show, the season, its title when it has one. */
  links: ComponentProps<typeof TitleTags>['links'];
  number: string;
  target?: SpoilerTarget;
  title: string;
  year?: number;
  certification?: string | null;
  type?: ReturnType<typeof episodeType>;
  /** The API's `during_credits` and `after_credits`. */
  credits?: { readonly duringCredits?: boolean | null; readonly afterCredits?: boolean | null };
}
const { links, number, title, year, certification, type, target, credits }: Props = $props();
</script>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="episode-title">
  <TitleTags {links} {type} {credits} />
  <h1><strong>{number}</strong> <MediaSpoiler {target} kind="title" inline>{title}</MediaSpoiler> {#if year}<span class="year">{year}</span>{/if}{#if certification}<Certification {certification} />{/if}</h1>
</div>
<style>
.episode-title {
  padding-inline-start: var(--summary-offset);
  @media (width < 992px) {
    padding-inline-start: var(--summary-offset-sm);
  }
  @media (width < 768px) {
    padding-inline-start: 0;
  }
}
h1 {
  font-weight: var(--font-weight-headings-light);
}
strong {
  font-weight: var(--font-weight-headings);
}
.year {
  font-size: var(--font-size-header-year);
  color: var(--gray-light);
}
</style>
