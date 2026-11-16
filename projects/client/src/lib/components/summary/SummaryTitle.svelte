<!--
  The title block pinned to the bottom of a summary's fanart: the tag bar above (a movie's collection and post-credits
  scenes, a season's show), then the h1 with the year in a lighter span and the certification. A movie's or show's
  `parental` links the rating to its parental guide page and, with a guide, adds the badge's guide half.
  Render it as FanartHeader's children.
-->
<script lang="ts">
import TitleTags from './TitleTags.svelte';
import Certification from './Certification.svelte';
import type { ParentalGuide } from '#lib/parental/ParentalGuide.ts';
import type { ComponentProps } from 'svelte';

interface Props {
  title: string;
  /** A year, or a range like "2008 - 2010". */
  year?: number | string | null;
  certification?: string | null;
  /** The way up, for the tag bar: a movie's collection, a season's show. */
  links?: ComponentProps<typeof TitleTags>['links'];
  /** The API's `during_credits` and `after_credits`. */
  credits?: ComponentProps<typeof TitleTags>['credits'];
  /** The tag bar's gold lead: a person's birthday. */
  highlight?: ComponentProps<typeof TitleTags>['highlight'];
  /** A movie's or show's parental guide page and its guide, empty without one. */
  parental?: { readonly page: string; readonly guide: ParentalGuide };
}

const { title, year, certification, links, credits, highlight, parental }: Props = $props();
</script>

<div class="summary-title">
  <TitleTags {highlight} {links} {credits} />
  <h1>
    {title}
    {#if year}<span class="year">{year}</span>{/if}
    <Certification {certification} page={parental?.page} guide={parental?.guide} />
  </h1>
</div>

<style>
.summary-title {
  padding-inline-start: var(--summary-offset);

  @media (width < 992px) {
    padding-inline-start: var(--summary-offset-sm);
  }

  @media (width < 768px) {
    padding-inline-start: 0;
  }
}

.year {
  font-size: var(--font-size-header-year);
  font-weight: var(--font-weight-headings-light);
  color: var(--gray-light);
}
</style>
