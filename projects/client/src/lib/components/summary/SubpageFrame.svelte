<!--
  The frame every item subpage shares: the
  slim fanart header with its label line, the title linking back and the previous and next arrows to the sibling's
  same subpage, then the summary sidebar (the poster linking back, Watch Now, optional section anchors, external links)
  beside `children` across the whole content column, with an optional `subnav` bar above it. Feed it
  `loadSubpageMedia`, or `loadPersonSubpage` for a person.
    <SubpageFrame {...data} label="Cast & Crew" sections={[...]}>...</SubpageFrame>
-->
<script lang="ts">
import { page } from '$app/state';
import { overlay } from '$lib/overlay/overlay';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import type { WatchNowButton } from '$lib/components/watchnow/watchNow';
import type { SubpageFrameMedia } from '$lib/subpage/SubpageFrameMedia';
import type { ComponentProps, Snippet } from 'svelte';
import ExternalLinks from './ExternalLinks.svelte';
import RatingsStrip from './RatingsStrip.svelte';
import ItemNav from './ItemNav.svelte';
import SectionNav from './SectionNav.svelte';
import SubpageTitle from './SubpageTitle.svelte';
import SummaryFrame from './SummaryFrame.svelte';
import SummaryPoster from './SummaryPoster.svelte';

interface Props {
  media: SubpageFrameMedia;
  watchNow: WatchNowButton | null;
  /** The pill above the title: "Cast & Crew". */
  label: string;
  sections?: ComponentProps<typeof SectionNav>['sections'];
  previous?: ComponentProps<typeof ItemNav>['previous'];
  next?: ComponentProps<typeof ItemNav>['next'];
  /** OG's `.subnav-wrapper` under the header (the comments' type and sort dropdowns). */
  subnav?: Snippet;
  /** The item's ratings strip, as on its summary: the stats page's, from `loadSubpageMedia`. */
  strip?: ComponentProps<typeof RatingsStrip>;
  children: Snippet;
}

const {
  media,
  watchNow,
  label,
  sections = [],
  previous,
  next,
  subnav,
  strip,
  children,
}: Props = $props();
const hideScreenshot = $derived(
  media.spoilerTarget && page.data.user
    ? mediaSpoilers({
      type: media.spoilerTarget.type,
      spoilers: page.data.settings?.browsing?.spoilers,
      watched: overlay.state(media.spoilerTarget.type, media.spoilerTarget.id, media.spoilerTarget.season).watched,
    }).screenshot
    : false,
);
// An episode's type in the tag bar and on the poster, unless the viewer hides episode type tags.
const episodeType = $derived(page.data.settings?.browsing?.hide_episode_type_tags ? undefined : media.episodeType);
// Seasons and episodes have the shorter ratings strip and the matching poster overlap.
const compact = $derived(media.spoilerTarget?.type === 'season' || media.spoilerTarget?.type === 'episode');
// Up a level from a season's or an episode's subpage: the nearest step that links somewhere.
const up = $derived(media.parents.findLast(({ href }) => href)?.href);
</script>

<!-- The item links are the canonical API slugs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet ratings()}<RatingsStrip {...strip} />{/snippet}

<FanartHeader image={hideScreenshot ? media.spoilerFanart : media.fanart} slim stats={strip ? ratings : undefined}
  subnav={!!subnav} statsHeight={compact ? 'var(--media-stats-compact-strip-height)' : undefined}>
  <SubpageTitle target={media.spoilerTarget} {label} parents={media.parents}
    type={episodeType} credits={media.credits} certification={media.certification}
    number={media.episodeNumber} title={media.episodeNumber ? media.episodeName : media.title} year={media.year}
    href={media.href} />
  {#snippet edges()}
    <ItemNav {previous} {next} {up} />
  {/snippet}
</FanartHeader>

<SummaryFrame label={media.title} fullWidth {subnav}
  posterOverlap={compact ? 'var(--media-stats-compact-poster-overlap)' : undefined}>
  {#snippet sidebar()}
    <a href={media.href}>
      <SummaryPoster image={media.poster} alt={media.item.title} ratingTarget={media.ratingTarget ?? strip?.ratingTarget}
        episodeBadge={episodeType && { label: episodeType.text, kind: episodeType.kind }} />
    </a>
    {#if watchNow && media.watchNow}
      <WatchNow button={watchNow} title={media.watchNow.title} year={media.watchNow.year} fanart={media.fanart} />
    {/if}
    {#if sections.length > 0}
      <SectionNav {sections} label="{media.title} sections" />
    {/if}
    <ExternalLinks links={media.links} />
  {/snippet}

  {#snippet details()}
    {@render children()}
  {/snippet}
</SummaryFrame>
