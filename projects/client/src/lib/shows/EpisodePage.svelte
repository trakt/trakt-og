<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toEpisodeSeo } from '$lib/seo/pages/toEpisodeSeo';
import { newComment } from '$lib/components/comments/newComment.svelte';
import { gifArtContext } from '$lib/components/comments/gif/gifArtContext';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import ActivityTabs from '$lib/components/summary/ActivityTabs.svelte';
import ActorsStrip from '$lib/components/summary/ActorsStrip.svelte';
import AdditionalStat from '$lib/components/summary/AdditionalStat.svelte';
import AdditionalStats from '$lib/components/summary/AdditionalStats.svelte';
import CommentsPreview from '$lib/components/summary/CommentsPreview.svelte';
import EpisodeTitle from '$lib/components/summary/EpisodeTitle.svelte';
import ExternalLinks from '$lib/components/summary/ExternalLinks.svelte';
import ItemNav from '$lib/components/summary/ItemNav.svelte';
import LazySection from '$lib/components/summary/LazySection.svelte';
import ListsPreview from '$lib/components/summary/ListsPreview.svelte';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import NameList from '$lib/components/summary/NameList.svelte';
import Overview from '$lib/components/summary/Overview.svelte';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import SeasonLinks from '$lib/components/summary/SeasonLinks.svelte';
import SectionNav from '$lib/components/summary/SectionNav.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import { page } from '$app/state';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import VideosRail from '$lib/components/summary/VideosRail.svelte';
import { overlay } from '$lib/overlay/overlay';
import { browserSectionsClient } from '$lib/summary/browserSectionsClient';
import { countLabel } from '$lib/utils/countLabel';
import type { loadEpisode } from '$lib/shows/loadEpisode';
const { data }: { data: Awaited<ReturnType<typeof loadEpisode>> } = $props();
const episode = $derived(data.episode);
// The GIF picker's header, in every comment box on the page.
gifArtContext.set(() => episode.fanart);
const facts = $derived(episode.facts);
const spoilers = $derived(
  mediaSpoilers({
    spoilers: data.user ? page.data.settings?.browsing?.spoilers : null,
    type: 'episode',
    watched: overlay.state('episode', episode.id).watched,
  }),
);
const safeTitle = $derived(spoilers.title ? `${episode.showTitle} ${episode.number}` : episode.fullTitle);
const ratingTarget = $derived({ type: 'episode' as const, id: episode.id, title: safeTitle });
const media = $derived({ ...ratingTarget, slug: episode.slug, season: episode.season, episode: episode.episodeNumber });
const lazy = () => browserSectionsClient(data.user !== null);
const sections = $derived([
  { label: 'Overview', href: '#overview' },
  { label: 'Stats', href: `${episode.href}/stats`, page: true },
  { label: 'Activity', href: '#activity' },
  ...(episode.cast.length + episode.guestStars.length > 0
    ? [{ label: 'People', href: '#people', more: { href: `${episode.href}/people`, text: 'All people' } }]
    : []),
  { label: 'Videos', href: '#videos', more: { href: `${episode.href}/videos`, text: 'All videos' } },
  {
    label: countLabel(episode.commentCount, 'Comment'),
    href: '#comments',
    more: { href: `${episode.href}/comments`, text: 'All comments' },
  },
  {
    label: countLabel(episode.listCount, 'List'),
    href: '#lists',
    more: { href: `${episode.href}/lists`, text: 'All lists' },
  },
]);
</script>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {...toEpisodeSeo({ episode, spoilers })} />
<FanartHeader dropped={overlay.state('show',episode.showId).dropped} image={episode.fanart}
  screenshot={spoilers.screenshot ? undefined : episode.screenshot} subnav>
  <EpisodeTitle target={ratingTarget} links={episode.parents} number={episode.number} title={episode.title} year={episode.year} certification={episode.certification} type={episode.type} credits={episode.postCredits} />
  {#snippet stats()}<RatingsStrip rating={episode.rating} external={episode.external} rateLabel="episode" {ratingTarget}
    statsHref="{episode.href}/stats" />{/snippet}
  {#snippet edges()}<ItemNav previous={episode.previous} next={episode.next} up={episode.seasonHref} />{/snippet}
</FanartHeader>
<SummaryFrame label={safeTitle}>
  {#snippet subnav()}<SeasonLinks label="Episode" links={episode.episodeLinks} />{/snippet}
  {#snippet sidebar()}
    <a class="poster-link" href={episode.seasonHref} aria-label="Back to {episode.seasonTitle}"><SummaryPoster showTarget={{type:'show',id:episode.showId,title:episode.showTitle}} image={episode.poster} alt="{episode.showTitle}: {episode.seasonTitle}" {ratingTarget} /></a>
    <WatchNow button={data.watchNow} title={episode.fullTitle} year={episode.year} fanart={episode.fanart} />
    <SectionNav {sections} label="{safeTitle} sections" />
    <ExternalLinks links={episode.links} />
  {/snippet}
  {#snippet tools()}<MediaTools target={{...ratingTarget,href:episode.href,fanart:episode.fanart}} />{/snippet}
  {#snippet details()}
    <WatchNow button={data.watchNow} title={episode.fullTitle} year={episode.year} fanart={episode.fanart} phone />
    <AdditionalStats>
      {#if facts.aired}<AdditionalStat label={facts.aired.label}>{facts.aired.date} {#if facts.network}on <NameList names={[facts.network]} />{/if}</AdditionalStat>{:else if facts.network}<AdditionalStat label="Network"><NameList names={[facts.network]} /></AdditionalStat>{/if}
      {#if facts.runtime}<AdditionalStat label="Runtime">{facts.runtime}</AdditionalStat>{/if}
      {#if facts.directors.length}<AdditionalStat label={facts.directors.length>1 ? 'Directors':'Director'}><NameList names={facts.directors} /></AdditionalStat>{/if}
      {#if facts.writers.length}<AdditionalStat label={facts.writers.length>1 ? 'Writers':'Writer'}><NameList names={facts.writers} collapse /></AdditionalStat>{/if}
      {#if facts.country}<AdditionalStat label="Country"><NameList names={[facts.country]} /></AdditionalStat>{/if}
      {#if facts.languages.length}<AdditionalStat label="Languages"><NameList names={facts.languages} /></AdditionalStat>{/if}
      {#if facts.genres.length}<AdditionalStat label="Genres"><NameList names={facts.genres} /></AdditionalStat>{/if}
      {#if facts.originalTitle}<AdditionalStat label="Original Title">{facts.originalTitle}</AdditionalStat>{/if}
      <AdditionalStat label="Links" phoneOnly><NameList names={episode.links.filter(({icon})=>!icon).map(({label,href})=>({name:label,href}))} /></AdditionalStat>
    </AdditionalStats>
    {#key episode.id}<MediaSpoiler target={ratingTarget} kind="overview"><Overview overview={episode.overview} /></MediaSpoiler>{/key}
  {/snippet}
  {#snippet actions()}<ActionButtons checkin={episode.aired ? ratingTarget : undefined} listTarget={ratingTarget} historyTarget={{...ratingTarget,runtime:episode.runtime,released:episode.aired,season:{show:episode.showId,number:episode.season,episode:episode.episodeNumber}}} />{/snippet}
  {#key episode.href}
    <LazySection id="activity" load={()=>lazy().activity(media)}>{#snippet children(tabs)}<ActivityTabs {tabs} />{/snippet}</LazySection>
  {/key}
  <ActorsStrip groups={[{id:'season-regulars',label:'Season Regulars',cast:episode.cast},{id:'guest-stars',label:'Guest Stars',cast:episode.guestStars}]} crew={episode.crew} creditsHref="{episode.href}/people" />
  {#key episode.href}
    <LazySection id="videos" load={() => lazy().videos(media)}>
      {#snippet children(videos)}<VideosRail {videos} href={episode.href} />{/snippet}
    </LazySection>
  {/key}
  {#key episode.href}
    {#snippet newCommentForm()}<NewCommentForm item={{ ...ratingTarget, show: episode.showId, season: episode.season }} />{/snippet}
    <LazySection id="comments" load={() => lazy().comments(media)} eager={newComment.visible}>{#snippet children(tabs)}<CommentsPreview form={newCommentForm} reload={(language) => lazy().comments(media, language)} {tabs} item={{...ratingTarget,show:episode.showId,season:episode.season}} viewer={data.user ? {slug:data.user.slug}:null} count={episode.commentCount} href={episode.href} dateOptions={data.datePreferences} />{/snippet}</LazySection>
    <LazySection id="lists" load={()=>lazy().lists(media)}>{#snippet children(lists)}<ListsPreview {lists} count={episode.listCount} href={episode.href} />{/snippet}</LazySection>
  {/key}
</SummaryFrame>
<style>
.poster-link {
  display: block;
}
</style>
