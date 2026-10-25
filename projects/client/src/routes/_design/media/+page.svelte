<script lang="ts">
import { PLACEHOLDER_AVATAR } from '$lib/users/placeholderAvatar';
import defaultCover from '$lib/assets/profile-cover-default.jpg';
import FrameGrid from '$lib/components/frame/FrameGrid.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import ListRow from '$lib/components/media/ListRow.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import SubpageTitle from '$lib/components/summary/SubpageTitle.svelte';
import SummaryTitle from '$lib/components/summary/SummaryTitle.svelte';
import type { OverlayState } from '$lib/overlay/createOverlay.svelte';
import { overlay } from '$lib/overlay/overlay';
import { countLabel } from '$lib/utils/countLabel';
import { imageUrl } from '$lib/utils/imageUrl';
import { breakingBad, seasonOneEpisodes } from '../summary/fixtures.ts';

const { data } = $props();
const collaborator = (name: string, slug: string) => ({
  slug,
  name,
  href: `/users/${slug}`,
  avatar: PLACEHOLDER_AVATAR,
  vip: null,
});
const weekendNotes = '**Saturday** first, then _Sunday_ if there is time.\n\n> One rule: no spoilers.';

const shows = $derived(
  data.trending.map(({ show, watchers }) => ({
    type: 'show' as const,
    id: show.ids.trakt,
    href: `/shows/${show.ids.slug}`,
    title: show.title,
    year: show.year ?? undefined,
    certification: show.certification,
    released: true,
    rating: show.rating ?? undefined,
    votes: show.votes ?? 0,
    airedEpisodes: show.aired_episodes ?? undefined,
    runtime: show.runtime ?? undefined,
    poster: imageUrl(show.images?.poster?.at(0), 'thumb'),
    fanart: imageUrl(show.images?.fanart?.at(0), 'thumb'),
    fanartFull: imageUrl(show.images?.fanart?.at(0), 'full'),
    watchers,
  })),
);

// Sample states for each card, so every quick-icon state shows without signing in.
const samples: { label: string; state: OverlayState; userRating?: number; rank?: number }[] = [
  { label: 'Idle', state: {}, rank: 1 },
  { label: 'Watched', state: { watched: true, watchedEpisodes: 99 }, rank: 2 },
  { label: 'Half watched', state: { watched: true, watchedEpisodes: 1, collected: true, collectedEpisodes: 1 } },
  { label: 'Listed and rated', state: { watchlisted: true }, userRating: 8 },
  { label: 'Rewatching', state: { watched: true, watchedEpisodes: 99, rewatching: true }, userRating: 10 },
  {
    label: 'Everything',
    state: {
      watched: true,
      watchedEpisodes: 99,
      collected: true,
      collectedEpisodes: 99,
      listed: true,
      favorited: true,
    },
    userRating: 3,
  },
  { label: 'Dropped', state: { watched: true, watchedEpisodes: 1, dropped: true } },
  { label: 'Movie, 3 plays', state: { watched: true, plays: 3, collected: true, collectedAt: '2026-09-01T12:00:00Z' } },
];

const featured = $derived(shows.at(0));

// Fixture members for the Users search cards: OG's placeholder avatars, one on a VIP cover.
const placeholder = (name: string) => `https://media.trakt.tv/hotlink-ok/placeholders/medium/${name}.png`;
const members = $derived([
  { name: 'Director', avatar: placeholder('zoidberg'), cover: shows.at(1)?.fanart, tags: [{ text: 'Director' }] },
  { name: 'Executive Producer', avatar: placeholder('leela'), cover: undefined, tags: [{ text: 'VIP EP' }] },
  { name: 'Member', avatar: placeholder('fry'), cover: undefined, tags: [] },
]);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Summary header" bleed
  note="The top trending show's header: its title, then the ratings strip with Rate and All Stats.">
  {#if featured}
    <FanartHeader image={featured.fanartFull} dropped={overlay.state('show', featured.id).dropped}>
      <SummaryTitle title={featured.title} year={featured.year} certification={featured.certification} />
      {#snippet stats()}
        <RatingsStrip rating={{ value: featured.rating ?? 0, votes: featured.votes, href: `${featured.href}/stats` }}
          rateLabel="show" ratingTarget={{ type: 'show', id: featured.id, title: featured.title }}
          statsHref="{featured.href}/stats" />
      {/snippet}
    </FanartHeader>
  {/if}
</Specimen>

<Specimen title="Subpage header" bleed note="The slim header a subpage like Comments uses, its title linking back.">
  {@const show = shows.at(1)}
  {#if show}
    <FanartHeader image={show.fanartFull} slim>
      <SubpageTitle label="Comments" title={show.title} year={show.year} certification={show.certification ?? undefined}
        href={show.href} />
    </FanartHeader>
  {/if}
</Specimen>

<Specimen title="Search poster cards" note="Six per row, in the frame grid, with the viewer's own quick icons.">
  <FrameGrid variant="poster">
    {#each shows.slice(0, 6) as show (show.id)}
      {@const state = overlay.state('show', show.id)}
      <FanartCard variant="poster" href={show.href} title={show.title} year={show.year} image={show.poster}
        hideTitle={show.poster !== undefined} userRating={state.rating} dropped={state.dropped}
        tags={[{ text: 'Show' }, ...(show.year ? [{ text: String(show.year), kind: 'generic' as const }] : [])]}
        icons={mediaQuickIcons({ item: show, state, datePreferences: data.datePreferences })} />
    {/each}
  </FrameGrid>
</Specimen>

<Specimen title="Search user cards" note="Three per row; a VIP shows their cover.">
  <FrameGrid variant="uniform">
    {#each members as member (member.name)}
      <FanartCard href="/_design/media" title={member.name} image={member.cover ?? defaultCover} avatar={member.avatar}
        tags={member.tags} />
    {/each}
  </FrameGrid>
</Specimen>

<Specimen title="Quick icon states"
  note="Sample states, so each one shows without signing in. Hover an icon for its tooltip.">
  <PosterGrid>
    {#each samples as sample, i (sample.label)}
      {@const show = shows.at(i)}
      {#if show}
        <Variant label={sample.label}>
          <PosterCard
            href={show.href}
            title={show.title}
            image={show.poster}
            subtitles={show.year ? [String(show.year)] : []}
            rank={sample.rank}
            userRating={sample.userRating}
            dropped={sample.state.dropped}
            rewatching={sample.state.rewatching}
            icons={{
              fill: quickIconFill({
                state: sample.state,
                airedEpisodes: sample.state.watchedEpisodes === 1 ? 2 : 99,
                runtime: 104,
                datePreferences: data.datePreferences,
              }),
              rating: show.rating,
              watchNowTarget: { type: 'show', id: show.id, title: show.title },
            }}
          />
        </Variant>
      {/if}
    {/each}
  </PosterGrid>
</Specimen>

<Specimen title="Live overlay"
  note="Discover's poster shelf on the trending shows, with the signed-in viewer's own state. Click an icon to try it.">
  <PosterGrid>
    {#each shows.slice(0, 12) as show (show.id)}
      {@const state = overlay.state('show', show.id)}
      <PosterCard
        href={show.href}
        title={show.title}
        fullTitle={show.year ? `${show.title} (${show.year})` : show.title}
        image={show.poster}
        userRating={state.rating}
        dropped={state.dropped}
        icons={mediaQuickIcons({ item: show, state, datePreferences: data.datePreferences })}
      />
    {/each}
  </PosterGrid>
</Specimen>

<Specimen title="Screenshot cards" note="Four a row for episodes, as history and ratings show them.">
  <PosterGrid columns={4}>
    {#each seasonOneEpisodes as episode (episode.id)}
      {@const target = { type: episode.type, id: episode.id, title: episode.title, season: episode.season }}
      <PosterCard
        href={episode.href}
        title={episode.title}
        number={episode.number}
        variant="screenshot"
        image={episode.screenshot}
        subtitles={[breakingBad.title]}
        userRating={overlay.state('episode', episode.id, episode.season).rating}
        icons={{
          fill: quickIconFill({ state: overlay.state('episode', episode.id, episode.season) }),
          rating: episode.rating,
          ratingTarget: target,
          watchTarget: target,
          watchNow: 'play',
          listLabel: 'Add to list',
        }}
      />
    {/each}
  </PosterGrid>
</Specimen>

<Specimen title="Chart cards"
  note="The chart grid's framed fanart cards, each with its watchers tag and a favorite star.">
  <FrameGrid variant="framed">
    {#each shows.slice(0, 6) as show (show.id)}
      {@const state = overlay.state('show', show.id)}
      <FanartCard
        framed
        href={show.href}
        title={show.title}
        year={show.year}
        image={show.fanart}
        tags={[{ text: countLabel(show.watchers, 'watcher') }]}
        userRating={state.rating}
        dropped={state.dropped}
        icons={{ ...mediaQuickIcons({ item: show, state, datePreferences: data.datePreferences }), favorite: true }}
      />
    {/each}
  </FrameGrid>
</Specimen>

<Specimen title="List rows"
  note="A list with a description, a private one, the watchlist, an official list and an empty one, then a liked list whose posters are still loading.">
  <ListRow
    href="/users/og_tester/lists/all-time-favorites"
    name="All-Time Favorites"
    owner={{ name: 'OG Tester', href: '/users/og_tester' }}
    posters={shows.slice(0, 5).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={12}
    likeCount={3}
    likeTarget={{ id: 21, ownerSlug: 'og_tester', viewer: null }}
    commentCount={1}
    rank={1}
    description="The ones I keep rewatching."
  />
  <ListRow
    href="/users/og_tester/lists/heist-night"
    name="Heist Night"
    owner={{ name: 'OG Tester', href: '/users/og_tester' }}
    mine
    posters={shows.slice(5, 8).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={3}
    likeCount={0}
    likeTarget={{ id: 22, ownerSlug: 'og_tester', viewer: null }}
    commentCount={0}
    pills={['Private']}
    description="Crews, vaults and one last job."
  />
  <p>The watchlist, marked by its own quiet tag, with no likes.</p>
  <ListRow
    kind="watchlist"
    href="/users/og_tester/watchlist"
    name="Watchlist"
    owner={{ name: 'OG Tester', href: '/users/og_tester' }}
    posters={shows.slice(3, 8).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={318}
    commentCount={2}
  />
  <p>An official list, and an empty one.</p>
  <ListRow
    href="/lists/official/emmy-winners"
    name="Emmy Winners: Drama Series"
    owner={{ name: 'Trakt', href: '/users/trakt' }}
    posters={shows.slice(1, 6).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={74}
    likeCount={2_310}
    likeTarget={{ id: 24, viewer: null }}
    commentCount={14}
    pills={['Official List']}
    description="Every Outstanding Drama Series winner since 1951, newest first."
  />
  <ListRow
    href="/users/og_tester/lists/halloween-2026"
    name="Halloween 2026"
    owner={{ name: 'OG Tester', href: '/users/og_tester' }}
    posters={[]}
    itemCount={0}
    likeCount={0}
    likeTarget={{ id: 25, ownerSlug: 'og_tester', viewer: null }}
    commentCount={0}
    pills={['Private']}
  />
  <p>The owner's row on their lists index: a link list with collaborators, a VIP owner and a markdown description.</p>
  <ListRow
    href="/users/og_tester/lists/watch-next-weekend"
    name="Watch Next Weekend"
    owner={{ name: 'OG Tester', href: '/users/og_tester', vip: { kind: 'vip', tag: { text: 'EP', title: 'Executive Producer' }, years: null } }}
    posters={shows.slice(2, 6).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={4}
    likeCount={2}
    likeTarget={{ id: 23, ownerSlug: 'og_tester', viewer: null }}
    commentCount={5}
    pills={['Private']}
    shareLink
    collaborators={[collaborator('Kendal Hagenes', 'kendal_hagenes_1'), collaborator('Sean', 'sean')]}
    description={weekendNotes}
    rank={2}
    actions={{ report: {}, edit: {}, delete: {}, progressHref: 'https://app.trakt.tv/vip', shareUrl: 'https://og.trakt.tv/users/og_tester/lists/watch-next-weekend' }}
  />
  <p>A collaborator's row: "Stop collaborating" instead of edit and delete.</p>
  <ListRow
    href="/users/kendal_hagenes_1/lists/heist-night"
    name="Heist Night"
    owner={{ name: 'Kendal Hagenes', href: '/users/kendal_hagenes_1', vip: { kind: 'director' } }}
    posters={shows.slice(6, 7).map(({ title, poster }) => ({ title, image: poster }))}
    itemCount={1}
    likeCount={0}
    pills={['Following']}
    collaborators={[collaborator('OG Tester', 'og_tester')]}
    actions={{ report: {}, leave: {}, progressHref: 'https://app.trakt.tv/vip', shareUrl: 'https://og.trakt.tv/users/kendal_hagenes_1/lists/heist-night' }}
  />
  <p>Loading: a liked list, its posters shimmering until they're read (the liked lists come without them).</p>
  <ListRow
    href="/users/sean/lists/space-operas"
    name="Space Operas"
    owner={{ name: 'Sean', href: '/users/sean' }}
    posters={[]}
    postersLoading
    itemCount={28}
    likeCount={41}
    likeTarget={{ id: 26, ownerSlug: 'sean', viewer: null }}
    commentCount={3}
  />
</Specimen>
