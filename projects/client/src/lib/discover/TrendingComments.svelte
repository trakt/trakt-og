<!--
  Discover's trending comments: one comment at a time over its title's fanart, which runs the full width behind the
  page column. Under the heading, dropdowns pick the kind of comment and the type of title (fetched as they change).
  The title's poster card is on the left (an episode's card shows the episode with its show under it, as history
  does); on the right, the comment card itself in its spotlight style (the text large under a quote mark), so the tags,
  spoiler blur, reactions, replies, Read thread and tools work as on any comment (Reply is left to the comment's page).
  Under it all, a pill of the commenters' avatars jumps between comments (hovering one shows a card with the title's
  fanart, episode and name, and the commenter), and arrows on the section's edges step through.
-->
<script lang="ts">
import { page } from '$app/state';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import { authorOf } from '$lib/components/comments/authorOf';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import { mediaQuickIcons } from '$lib/components/media/mediaQuickIcons';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import comments from '$lib/icons/regular/comments.svg?raw';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { fetchTrendingComments } from './fetchTrendingComments.ts';
import { trendingCommentFilters } from './trendingCommentFilters.ts';
import type { TrendingComment } from './toTrendingComments.ts';

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
let request = 0;

const list = $derived(fetched ?? items);
const current = $derived(list.at(index));
const commentViewer = $derived(page.data.user ? { slug: page.data.user.slug } : null);
const kindLabel = $derived(trendingCommentFilters.kinds.find(({ id }) => id === kind)?.label);
const mediaLabel = $derived(trendingCommentFilters.media.find(({ id }) => id === media)?.label);

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
          <Dropdown section="Comments">
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
          <Dropdown section="Media">
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

      {#if current}
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
              icons={mediaQuickIcons({ item: current.item, state: viewer, datePreferences })}
            />
          </div>

          <div class="quote">
            {#key current.comment.id}
              <CommentCard
                comment={current.comment}
                item={current.commentItem}
                viewer={commentViewer}
                dateOptions={datePreferences}
                spotlight
              />
            {/key}
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
                      <span class="peek-name"><b>{person.name}</b>{#if person.badge}<VipLabel
                            badge={person.badge}
                            quiet
                          />{/if}</span>
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
  gap: var(--space-dropdown-row);
  margin-block: var(--space-heading-dropdowns) var(--trending-comments-title-gap);
}

.quote {
  min-inline-size: 0;
}

.empty {
  display: grid;
  place-items: center;
  min-block-size: var(--trending-comments-height);
  margin: 0;
  color: var(--color-discover-muted);
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
  grid-template-columns: var(--trending-comments-peek-avatar) minmax(0, 1fr);
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
