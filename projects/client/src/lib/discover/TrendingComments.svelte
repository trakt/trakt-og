<!--
  Discover's trending comments: one comment at a time over its title's fanart, which runs the full width behind the
  page column. Under the heading, dropdowns pick the kind of comment and the type of title (fetched as they change).
  The title's poster card is on the left (an episode's card shows the episode with its show under it, as history
  does); on the right, the commenter's header as on a comment card (avatar with their rating's corner, name, VIP pill,
  Review and Spoilers tags, date), the comment under a quote mark, and its likes and replies. A spoiler comment stays
  blurred until clicked. Under it all, a pill of the commenters' avatars jumps between comments (hovering one shows a
  card with the title's fanart, episode and name, the commenter, their rating and the comment's likes and replies),
  and arrows on the section's edges step through.
-->
<script lang="ts">
import CommentAvatar from '$lib/components/comments/CommentAvatar.svelte';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import CommentText from '$lib/components/comments/CommentText.svelte';
import { authorOf } from '$lib/components/comments/authorOf';
import { commentDates } from '$lib/components/comments/commentDates';
import { parseComment } from '$lib/components/comments/text/parseComment';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import comments from '$lib/icons/regular/comments.svg?raw';
import thumbsUp from '$lib/icons/regular/thumbs-up.svg?raw';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import quoteLeft from '$lib/icons/solid/quote-left.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { fetchTrendingComments } from './fetchTrendingComments.ts';
import { trendingCommentFilters } from './trendingCommentFilters.ts';
import type { TrendingComment } from './toTrendingComments.ts';
import { SvelteSet } from 'svelte/reactivity';

interface Props {
  items: readonly TrendingComment[];
  datePreferences: DatePreferences;
}

const { items, datePreferences }: Props = $props();
let kind = $state<(typeof trendingCommentFilters.kinds)[number]['id']>('all');
let media = $state<(typeof trendingCommentFilters.media)[number]['id']>('all');
// The page's comments until a filter changes.
let fetched = $state<readonly TrendingComment[]>();
let loading = $state(false);
let index = $state(0);
const revealed = new SvelteSet<number>();
let request = 0;

const list = $derived(fetched ?? items);
const current = $derived(list.at(index));
const author = $derived(current ? authorOf(current.comment.user) : undefined);
const blocks = $derived(current ? parseComment(current.comment.comment) : []);
const posted = $derived(
  current
    ? commentDates({ createdAt: current.comment.created_at, updatedAt: current.comment.created_at }, datePreferences)
      .posted
    : '',
);
const blurred = $derived(current ? current.comment.spoiler && !revealed.has(current.comment.id) : false);
const kindLabel = $derived(trendingCommentFilters.kinds.find(({ id }) => id === kind)?.label);
const mediaLabel = $derived(trendingCommentFilters.media.find(({ id }) => id === media)?.label);
const count = (n: number) => n.toLocaleString('en-US');

const step = (delta: number) => (index = (index + delta + list.length) % list.length);

async function filter(next: { kind?: typeof kind; media?: typeof media }) {
  kind = next.kind ?? kind;
  media = next.media ?? media;
  const ask = ++request;
  loading = true;
  const result = await fetchTrendingComments({ fetch, kind, media, now: new Date() });
  // A later pick wins over a slower earlier one.
  if (ask !== request) return;
  fetched = result;
  index = 0;
  loading = false;
}

const reveal = (id: number) => revealed.add(id);
const revealOnKey = (event: KeyboardEvent, id: number) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  reveal(id);
};
</script>

<!-- Comment, media and user hrefs are built from ids and slugs, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if items.length > 0}
  <section
  id="comments"
  class="comments"
  aria-labelledby="comments-heading"
  aria-roledescription="carousel"
  aria-busy={loading}
>
    {#each list as item, slot (item.comment.id)}
      {#if item.item.fanart}
        <img class={['backdrop', { current: slot === index }]} src={item.item.fanart} alt="" loading="lazy" />
      {/if}
    {/each}

    {#if list.length > 1}
      <button type="button" class="arrow previous" aria-label="Previous comment" onclick={() => step(-1)}>
        <Icon svg={angleLeft} />
      </button>
      <button type="button" class="arrow next" aria-label="Next comment" onclick={() => step(1)}>
        <Icon svg={angleRight} />
      </button>
    {/if}

    <div class="inner">
      <PanelHeading id="comments-heading" title="Trending Comments" icon={comments} />
      <div class="filters">
          <Dropdown>
            {#snippet trigger()}{kindLabel}{/snippet}
            <ul>
              {#each trendingCommentFilters.kinds as option (option.id)}
                <li>
                  <button type="button" aria-current={option.id === kind} onclick={() => filter({ kind: option.id })}>
                    {option.label}
                  </button>
                </li>
              {/each}
            </ul>
          </Dropdown>
          <Dropdown>
            {#snippet trigger()}{mediaLabel}{/snippet}
            <ul>
              {#each trendingCommentFilters.media as option (option.id)}
                <li>
                  <button type="button" aria-current={option.id === media} onclick={() => filter({ media: option.id })}>
                    {option.label}
                  </button>
                </li>
              {/each}
            </ul>
          </Dropdown>
      </div>

      {#if current && author}
        {@const viewer = overlay.state(current.item.type, current.item.id)}
        <div class="slide" aria-live="polite">
          <div class="poster">
            <PosterCard
              {...current.item.episode
              ? {
                href: current.item.episode.href,
                title: current.item.episode.title,
                number: current.item.episode.number,
                subtitles: [{ text: current.item.title, href: current.item.href }],
              }
              : {
                href: current.item.href,
                title: current.item.title,
                subtitles: current.item.year ? [String(current.item.year)] : [],
              }}
              image={current.item.poster}
              userRating={viewer.rating}
              icons={{
                fill: quickIconFill({
                  state: viewer,
                  airedEpisodes: current.item.airedEpisodes,
                  runtime: current.item.runtime,
                  datePreferences,
                }),
                ratingTarget: { type: current.item.type, id: current.item.id, title: current.item.title },
                watchTarget: {
                  type: current.item.type,
                  id: current.item.id,
                  title: current.item.title,
                  airedEpisodes: current.item.airedEpisodes,
                  runtime: current.item.runtime,
                },
                rating: current.item.released ? current.item.rating : undefined,
                watchNow: current.item.released ? 'play' : undefined,
              }}
            />
          </div>

          <div class="quote">
            <header class="byline">
              <span class="avatar">
                <CommentAvatar src={author.avatar} rating={current.comment.user_stats.rating} large />
              </span>
              <p class="who">
                {#if author.href}<a class="username" href={author.href}>{author.name}</a>{:else}<strong
                    class="username"
                  >{author.name}</strong>{/if}
                {#if author.badge}<VipLabel badge={author.badge} quiet />{/if}
                {#if current.comment.review}<CommentTag svg={star}>Review</CommentTag>{/if}
                {#if current.comment.spoiler}<CommentTag svg={eyeSlash} tone="spoiler">Spoilers</CommentTag>{/if}
              </p>
              <p class="when">
                <a href={current.href}><time datetime={current.comment.created_at}>{posted}</time></a>
              </p>
            </header>

            <div class="said">
              <span class="mark"><Icon svg={quoteLeft} /></span>
              {#if blurred}
                {@const id = current.comment.id}
                <div
                  class="spoiler"
                  role="button"
                  tabindex="0"
                  aria-label="Spoilers, click to reveal"
                  onclick={() => reveal(id)}
                  onkeydown={(event) => revealOnKey(event, id)}
                >
                  <div class="text blur" aria-hidden="true" inert><CommentText {blocks} /></div>
                </div>
              {:else}
                <div class="text"><CommentText {blocks} /></div>
              {/if}
            </div>

            <p class="reactions">
              <span><Icon svg={thumbsUp} /><strong>{count(current.comment.likes)}</strong> likes</span>
              <span><Icon svg={comment} /><strong>{count(current.comment.replies)}</strong> replies</span>
              <a href={current.href}>Read thread</a>
            </p>
          </div>
        </div>
      {:else}
        <p class="empty">Nothing trending for these filters right now.</p>
      {/if}
      {#if list.length > 1}
        <div class="pager">
          <ul class="people" aria-label="Commenters">
            {#each list as item, slot (item.comment.id)}
              {@const person = authorOf(item.comment.user)}
              <li>
                <Tooltip>
                  {@const rating = item.comment.user_stats.rating}
                  <span class="peek">
                    <span class="banner">
                      {#if item.item.fanart}<img src={item.item.fanart} alt="" loading="lazy" />{/if}
                      <span class="caption">
                        {#if item.item.episode}
                          <span><b>{item.item.episode.number}</b> {item.item.episode.title}</span>
                        {/if}
                        <b class="peek-title">{item.item.title}</b>
                      </span>
                    </span>
                    <span class="peek-who">
                      <img src={person.avatar} alt="" loading="lazy" />
                      <span class="peek-lines">
                        <span class="peek-name"><b>{person.name}</b>{#if person.badge}<VipLabel
                              badge={person.badge}
                              quiet
                            />{/if}</span>
                        <span class="peek-counts">
                          <span><Icon svg={thumbsUp} />{count(item.comment.likes)}</span>
                          <span><Icon svg={comment} />{count(item.comment.replies)}</span>
                        </span>
                      </span>
                      {#if rating}
                        <span class="peek-rating" style:--rating-color="var(--rating-{rating})"><Icon
                            svg={heart}
                          />{rating}</span>
                      {/if}
                    </span>
                  </span>
                  {#snippet trigger(tooltip)}
                    <button
                      type="button"
                      aria-current={slot === index}
                      aria-label="{person.name} on {item.item.title}"
                      onclick={() => (index = slot)}
                      {...tooltip}
                    >
                      <img src={person.avatar} alt="" loading="lazy" />
                    </button>
                  {/snippet}
                </Tooltip>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </section>
{/if}

<style>
.comments {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color-scheme: dark;
  background-color: var(--color-trending-comments-bg);
  color: var(--color-discover-text);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--trending-comments-shade);
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: 0;

  &.current {
    opacity: var(--opacity-trending-comments-backdrop);
  }
}

.inner {
  margin-inline: auto;
  padding-block: var(--trending-comments-top) var(--trending-comments-bottom);
  padding-inline: calc(var(--gutter) / 2);

  @media (min-width: 768px) {
    inline-size: var(--container-sm);
  }

  @media (min-width: 992px) {
    inline-size: var(--container-md);
  }

  @media (min-width: 1200px) {
    inline-size: var(--container-lg);
  }
}

.slide {
  display: grid;
  grid-template-columns: var(--trending-comments-poster) minmax(0, 1fr);
  gap: var(--trending-comments-gap);
  align-items: center;
  min-block-size: var(--trending-comments-height);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--toggle-chip-gap);
  margin-block: var(--trending-comments-toolbar-gap) var(--trending-comments-title-gap);
}

.quote {
  display: grid;
  gap: var(--trending-comments-quote-gap);
  min-inline-size: 0;
}

/* The avatar, then the name's line and the date's held together beside it, as on a comment card. */
.byline {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: 1fr auto auto 1fr;
  column-gap: var(--trending-comments-byline-gap);
  row-gap: var(--comment-head-line-gap);

  & p {
    margin: 0;
  }
}

.avatar {
  grid-row: 1 / -1;
  align-self: center;
}

.who {
  grid-row: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-head-gap);
  line-height: var(--line-height-trending-comments-byline);
}

/* The comment card's name. */
.username {
  color: var(--color-discover-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:is(a):hover {
    color: var(--color-link);
  }
}

.when {
  grid-row: 3;
  grid-column: 2;
  line-height: var(--line-height-trending-comments-byline);
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);

  & a {
    color: inherit;
  }
}

/* The quote mark hangs to the left of the text. */
.said {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--trending-comments-byline-gap);
}

.mark {
  color: var(--season-accent);
  font-size: var(--font-size-trending-comments-mark);
  line-height: 1;
}

.spoiler {
  cursor: pointer;
}

.blur {
  filter: var(--blur-spoiler);
  user-select: none;
}

.empty {
  display: grid;
  place-items: center;
  min-block-size: var(--trending-comments-height);
  margin: 0;
  color: var(--color-discover-muted);
}

.text {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-discover-text);
  font-size: var(--font-size-trending-comments-quote);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  line-clamp: 5;

  & :global(p) {
    display: inline;
    margin: 0;
  }
}

.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--trending-comments-byline-gap);
  margin: 0;
  color: var(--color-discover-muted);

  & span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs-inline);
  }

  & :global(svg) {
    color: var(--brand-secondary);
  }

  & strong {
    color: var(--color-discover-text);
  }

  & a {
    color: var(--color-discover-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* The pager under the comment, centred in a glass pill so it reads as controls: one avatar per comment. */
.pager {
  display: flex;
  align-items: center;
  inline-size: fit-content;
  margin: var(--trending-comments-pager-gap) auto 0;
  padding: var(--trending-comments-pager-padding);
  border-radius: var(--radius-season-pill);
  background-color: var(--color-season-hero-chrome);
  /* The dropdown menu's border and shadow. */
  border: 1px solid var(--color-menu-border);
  box-shadow: var(--shadow-menu);
  backdrop-filter: var(--blur-trending-comments-pager);
}

.people {
  /* The hover cards draw their own solid box and arrow over og's see-through tooltip. */
  --opacity-tooltip: 1;
  --color-tooltip-bg: transparent;
  display: flex;
  gap: var(--trending-comments-people-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & button {
    display: block;
    inline-size: var(--trending-comments-person);
    block-size: var(--trending-comments-person);
    min-block-size: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 50%;
    opacity: var(--opacity-season-hero-poster);
    cursor: pointer;

    &:is(:hover, :focus-visible) {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--color-season-hero-chrome-line);
      transform: scale(var(--trending-comments-person-hover));
    }

    &[aria-current='true'] {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--season-accent);
    }
  }

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

/* An avatar's hover card: the title's fanart with the episode and title over it, then the commenter (VIP, likes and
   replies) and their rating as a heart and number on its colour, with an arrow down to the avatar. It replaces the
   tooltip's own box, so it reads apart from the black band behind it. */
.peek {
  position: relative;
  display: grid;
  inline-size: var(--trending-comments-peek-width);
  margin: var(--trending-comments-peek-bleed);
  /* The dropdown menu's border, fill and shadow. */
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-trending-comments-peek);
  background-color: var(--color-menu-bg);
  box-shadow: var(--shadow-menu);
  text-align: start;

  /* The arrow down to the avatar: a square turned on its point, bordered on its two lower sides. */
  &::after {
    content: '';
    position: absolute;
    inset-block-end: calc(var(--trending-comments-peek-arrow) / -2 - 1px);
    inset-inline-start: calc(50% - var(--trending-comments-peek-arrow) / 2);
    inline-size: var(--trending-comments-peek-arrow);
    block-size: var(--trending-comments-peek-arrow);
    border: solid var(--color-menu-border);
    border-width: 0 1px 1px 0;
    background-color: var(--color-menu-bg);
    rotate: 45deg;
  }
}

.banner {
  position: relative;
  display: block;
  block-size: var(--trending-comments-peek-banner);
  overflow: hidden;
  border-radius: calc(var(--radius-trending-comments-peek) - 1px) calc(var(--radius-trending-comments-peek) - 1px) 0 0;
  background-color: var(--color-slider-bg);

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--trending-comments-peek-shade);
  }
}

.caption {
  position: absolute;
  inset: auto var(--trending-comments-peek-inset) var(--trending-comments-peek-caption-bottom);
  z-index: 1;
  display: grid;
  line-height: var(--line-height-headings);

  & > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.peek-title {
  font-size: var(--font-size-trending-comments-peek-title);
}

.peek-who {
  display: grid;
  grid-template-columns: var(--trending-comments-peek-avatar) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--trending-comments-peek-gap);
  padding: var(--trending-comments-peek-inset);

  & img {
    inline-size: var(--trending-comments-peek-avatar);
    block-size: var(--trending-comments-peek-avatar);
    border-radius: 50%;
    object-fit: cover;
  }
}

.peek-lines {
  display: grid;
  gap: var(--comment-head-line-gap);
  min-inline-size: 0;
  line-height: var(--line-height-headings);
}

.peek-name {
  display: flex;
  align-items: center;
  gap: var(--comment-head-gap);
  min-inline-size: 0;

  & b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.peek-counts {
  display: flex;
  gap: var(--trending-comments-peek-gap);
  color: var(--color-tooltip-muted);

  & span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs-inline);
  }

  & :global(svg) {
    color: var(--brand-secondary);
  }
}

.peek-rating {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-tag-gap);
  block-size: var(--comment-tag-height);
  padding: var(--comment-tag-padding);
  border-radius: var(--radius-comment-tag);
  background-color: var(--rating-color);
  font-size: var(--font-size-comment-tag);
  font-weight: var(--font-weight-headings-heavy);

  & :global(svg) {
    font-size: var(--font-size-comment-tag-icon);
  }
}

.arrow {
  position: absolute;
  inset-block-start: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  inline-size: var(--season-hero-arrow);
  block-size: var(--season-hero-arrow);
  min-block-size: 0;
  margin-block-start: calc(var(--season-hero-arrow) / -2);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-season-hero-chrome);
  color: var(--color-discover-text);
  font-size: var(--font-size-season-hero-arrow);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--season-accent);
    color: var(--color-season-button-text);
  }

  @media (width < 1300px) {
    inset-block-start: auto;
    inset-block-end: var(--trending-comments-bottom);
    margin: 0;
  }
}

.previous {
  inset-inline-start: var(--season-hero-arrow-inset);
}

.next {
  inset-inline-end: var(--season-hero-arrow-inset);
}

@media (prefers-reduced-motion: no-preference) {
  .backdrop {
    transition: opacity var(--transition-season-hero);
  }

  .people button {
    transition: transform var(--transition-essential-quick), opacity var(--transition-essential-quick);
  }
}
</style>
