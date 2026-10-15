<script lang="ts">
import CardTag from '$lib/components/media/CardTag.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import type { SpoilerTarget } from '$lib/settings/SpoilerTarget';
import type { episodeType } from '$lib/components/media/episodeTags';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { certificationTip } from '$lib/components/summary/certificationTip';
import PostCreditsTag from '$lib/components/summary/PostCreditsTag.svelte';
interface Props {
  show: { title: string; href: string };
  season: { title: string; href: string };
  number: string;
  target?: SpoilerTarget;
  title: string;
  year?: number;
  certification?: string | null;
  type?: ReturnType<typeof episodeType>;
  /** The API's `during_credits` and `after_credits`. */
  credits?: { readonly duringCredits?: boolean | null; readonly afterCredits?: boolean | null };
}
const { show, season, number, title, year, certification, type, target, credits }: Props = $props();
</script>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="episode-title">
  {#if type}<div class="type"><CardTag text={type.text} kind={type.kind} /></div>{/if}
  <p class="parent"><a href={show.href}>{show.title}</a>: <a href={season.href} rel="up">{season.title}</a></p>
  <h1><strong>{number}</strong> <MediaSpoiler {target} kind="title" inline>{title}</MediaSpoiler> {#if year}<span class="year">{year}</span>{/if}{#if certification}<Tooltip text={certificationTip(certification)}>{#snippet trigger(tooltip)}<span class="certification" {...tooltip}>{certification}</span>{/snippet}</Tooltip>{/if}<PostCreditsTag during={credits?.duringCredits} after={credits?.afterCredits} /></h1>
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
.type {
  margin-block-end: var(--episode-title-gap);
}
.parent {
  margin: 0 0 var(--episode-title-gap);
  font-family: var(--font-headings);
  font-size: var(--font-size-summary-h2);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-headings);
  & a {
    color: var(--gray-lighter);
    text-decoration: none;
  }
  & a:is(:hover,:focus-visible) {
    color: var(--brand-primary);
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
.certification {
  display: inline-block;
  margin-inline-start: var(--episode-title-certification-gap);
  padding: var(--episode-title-certification-padding);
  border: 1px solid var(--color-card-text);
  border-radius: var(--radius-certification);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  vertical-align: middle;
  text-shadow: none;
}
</style>
