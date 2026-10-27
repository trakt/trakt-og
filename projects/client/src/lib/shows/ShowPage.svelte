<!-- The show summary (`/shows/:id`): the media frame filled with one show, its recent episodes and its seasons. -->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toShowSeo } from '$lib/seo/pages/toShowSeo';
import { newComment } from '$lib/components/comments/newComment.svelte';
import { gifArtContext } from '$lib/components/comments/gif/gifArtContext';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import { overlay } from '$lib/overlay/overlay';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import PageExtras from '$lib/extras/PageExtras.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import ActivityTabs from '$lib/components/summary/ActivityTabs.svelte';
import ActorsStrip from '$lib/components/summary/ActorsStrip.svelte';
import CommentsPreview from '$lib/components/summary/CommentsPreview.svelte';
import ExternalLinks from '$lib/components/summary/ExternalLinks.svelte';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import LazySection from '$lib/components/summary/LazySection.svelte';
import SummarySectionShimmer from '$lib/components/loading/SummarySectionShimmer.svelte';
import ListsPreview from '$lib/components/summary/ListsPreview.svelte';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import RelatedItems from '$lib/components/summary/RelatedItems.svelte';
import SectionNav from '$lib/components/summary/SectionNav.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import SummaryTitle from '$lib/components/summary/SummaryTitle.svelte';
import VideosRail from '$lib/components/summary/VideosRail.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { browserSectionsClient } from '$lib/summary/browserSectionsClient';
import { countLabel } from '$lib/utils/countLabel';
import type { loadShow } from './loadShow.ts';
import RecentEpisodes from './RecentEpisodes.svelte';
import SeasonsGrid from './SeasonsGrid.svelte';
import ShowDetails from './ShowDetails.svelte';

type Props = {
  data: Awaited<ReturnType<typeof loadShow>> & { user: HeaderUser | null; datePreferences: DatePreferences };
};

const { data }: Props = $props();
const show = $derived(data.show);
// The GIF picker's header, in every comment box on the page.
gifArtContext.set(() => show.fanart);
const ratingTarget = $derived({ type: 'show' as const, id: show.id, title: show.fullTitle });
const allEpisodes = $derived(`${show.href}/seasons/all`);
const media = $derived({
  type: 'show' as const,
  id: show.id,
  slug: show.slug,
  title: show.title,
  airedEpisodes: show.airedEpisodes,
  totalRuntime: show.totalRuntime,
});
const lazy = () => browserSectionsClient(data.user !== null);

const sections = $derived([
  { label: 'Overview', href: '#overview' },
  { label: 'Stats', href: `${show.href}/stats`, page: true },
  { label: 'Activity', href: '#activity' },
  { label: 'Recent Episodes', href: '#recent-episodes' },
  ...(show.cast.length > 0 || show.guestStars.length > 0
    ? [{ label: 'People', href: '#people', more: { href: `${show.href}/people`, text: 'All people' } }]
    : []),
  ...(show.seasonCount > 0
    ? [{
      label: countLabel(show.seasonCount, 'Season'),
      href: '#seasons',
      more: { href: allEpisodes, text: 'All episodes' },
    }]
    : []),
  { label: 'Videos', href: '#videos', more: { href: `${show.href}/videos`, text: 'All videos' } },
  {
    label: countLabel(show.commentCount, 'Comment'),
    href: '#comments',
    more: { href: `${show.href}/comments`, text: 'All comments' },
  },
  {
    label: countLabel(show.listCount, 'List'),
    href: '#lists',
    more: { href: `${show.href}/lists`, text: 'All lists' },
  },
]);
</script>

<SeoHead {...toShowSeo(show)} />

<!-- Hrefs are built from API slugs, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<FanartHeader image={show.fanart} dropped={overlay.state('show', show.id).dropped}>
  <SummaryTitle title={show.title} year={show.year} certification={show.certification} />
  {#snippet stats()}
    <RatingsStrip rating={show.rating} rateLabel="show" {ratingTarget} external={show.external} counts={show.counts}
      statsHref="{show.href}/stats" />
  {/snippet}
</FanartHeader>

<SummaryFrame label={show.title}>
  {#snippet tools()}
    <MediaTools target={{ type: 'show', id: show.id, title: show.title, year: show.year, href: show.href, tmdb: show.links.find((link) => link.label === 'TMDB')?.href, fanart: show.fanart }} />
  {/snippet}

  {#snippet sidebar()}
    <SummaryPoster {ratingTarget} image={show.poster} alt={show.fullTitle} lastSeen={show.lastSeen} />
    <WatchNow button={data.watchNow} title={show.title} year={show.year} fanart={show.fanart} />
    <SectionNav {sections} label="{show.title} sections" />
    <ExternalLinks links={show.links} share={{ href: show.href, title: show.fullTitle }} />
  {/snippet}

  {#snippet details()}
    <ShowDetails {show} privateNotes={data.privateNotes} />
  {/snippet}

  {#snippet actions()}
    <WatchNow button={data.watchNow} title={show.title} year={show.year} fanart={show.fanart} phone />
    <ActionButtons listTarget={ratingTarget} favorites favoriteTarget={{ ...ratingTarget, title: show.title, year: show.year, fanart: show.fanart }} historyTarget={{ ...ratingTarget, airedEpisodes: show.airedEpisodes, runtime: show.runtime, episodeIds: show.episodeIds }} />
  {/snippet}

  <!-- Keyed on the item: moving to another movie or show keeps this page, so the lazy sections start over. -->
  {#key media.slug}
    <LazySection id="activity" load={() => lazy().activity(media)}>
      <!-- Signed out, it shows only when someone's watching, so it seldom comes. -->
      {#snippet pending()}{#if data.user}<SummarySectionShimmer section="activity" />{/if}{/snippet}
      {#snippet children(tabs)}<ActivityTabs {tabs} />{/snippet}
    </LazySection>
  {/key}
  <RecentEpisodes
    upNext={show.recent.upNext}
    next={show.recent.next}
    aired={show.recent.aired}
    allHref={allEpisodes}
    datePreferences={data.datePreferences}
  />
  <ActorsStrip
    groups={[
      { id: 'season-regulars', label: 'Series Regulars', cast: show.cast },
      { id: 'guest-stars', label: 'Guest Stars', cast: show.guestStars },
    ]}
    crew={show.crew}
    creditsHref="{show.href}/people"
  />
  <SeasonsGrid showId={show.id} seasons={show.seasons} signedIn={data.signedIn} initialFilters={data.filters} datePreferences={data.datePreferences} />
  {#key media.slug}
    <LazySection id="videos" load={() => lazy().videos(media)}>
      {#snippet pending()}<SummarySectionShimmer section="videos" />{/snippet}
      {#snippet children(videos)}<VideosRail {videos} href={show.href} />{/snippet}
    </LazySection>
  {/key}
  {#key media.slug}
    {#snippet newCommentForm()}<NewCommentForm item={{ type: 'show', id: show.id, title: show.title, airedEpisodes: show.airedEpisodes }} />{/snippet}
    <LazySection id="comments" load={() => lazy().comments(media)} eager={newComment.visible}>
      {#snippet pending()}<SummarySectionShimmer section="comments" />{/snippet}
      {#snippet children(tabs)}
        <CommentsPreview form={newCommentForm} reload={(language) => lazy().comments(media, language)}
          {tabs}
          item={{ type: 'show', id: show.id, title: show.title, airedEpisodes: show.airedEpisodes }}
          viewer={data.user ? { slug: data.user.slug } : null}
          count={show.commentCount}
          href={show.href}
          dateOptions={data.datePreferences}
        />
      {/snippet}
    </LazySection>
  {/key}
  {#key media.slug}
    <LazySection id="lists" load={() => lazy().lists(media)}>
      {#snippet pending()}<SummarySectionShimmer section="lists" />{/snippet}
      {#snippet children(lists)}<ListsPreview {lists} count={show.listCount} href={show.href} />{/snippet}
    </LazySection>
  {/key}
</SummaryFrame>

{#key media.slug}
  <RelatedItems title={show.title} source={data.relatedSource} load={() => lazy().related(media, data.relatedSource.genre)}
  loadPeople={(card) => lazy().relatedPeople(card)} datePreferences={data.datePreferences} />
{/key}

<PageExtras type="show" id={show.id} viewer={data.user?.slug} />
