<!--
  One sitting in the Social Feed's Earlier timeline, title first: the member, how long ago and, for a long sitting, its
  time span; what they watched as the headline; then chips for ratings, comments and reviews. When the chips can't show
  it all, the count chip ("2 episodes") opens a list with a line per title, seven lines before a "Show 20 more shows"
  button. A poster per headline title sits on the right. Screen readers get the whole sitting as one sentence instead of
  the headline.
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import type { SittingLine } from '$lib/dashboard/describeSitting';
import type { SocialSitting } from '$lib/dashboard/fetchSocialFeed';
import type { SocialItem } from '$lib/dashboard/toSocialItem';
import Icon from '$lib/icons/Icon.svelte';
import angleDown from '$lib/icons/solid/angle-down.svg?raw';
import comment from '$lib/icons/solid/comment.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import pen from '$lib/icons/solid/pen.svg?raw';
import pin from '$lib/icons/solid/location-pin.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import { imageUrl } from '$lib/utils/imageUrl';
import SocialHeart from './SocialHeart.svelte';
import SocialPill from './SocialPill.svelte';

interface Props {
  sitting: SocialSitting;
  /** The member is watching something now, behind the "+N watching" tile. */
  watching?: boolean;
  /** The comment card a comment chip jumps to. */
  commentId: (id: number) => string;
}

const { sitting, watching = false, commentId }: Props = $props();
const { member, summary } = $derived(sitting);
const id = $props.id();
let open = $state(false);
let more = $state(false);

const KINDS = {
  watch: { icon: play, verb: 'Watched' },
  checkin: { icon: pin, verb: 'Checked in to' },
  rating: { icon: heart, verb: 'Rated' },
  comment: { icon: comment, verb: 'Commented on' },
  review: { icon: pen, verb: 'Reviewed' },
} satisfies Record<SocialItem['kind'], { icon: string; verb: string }>;

// Closing the list folds its "Show N more" part too, so it opens short again.
function toggle() {
  open = !open;
  if (!open) more = false;
}
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet line(item: SittingLine)}
  <li>
  <Icon svg={KINDS[item.kind].icon} />
  <p>
      <span class="sr">{KINDS[item.kind].verb} </span><a href={item.href}>{item.name}</a>
      {#if item.codes}<span class="codes">{item.codes}</span>{/if}
      {#if item.rating}<SocialHeart rating={item.rating} />{/if}
    </p>
  <time datetime={item.at}>{item.time}</time>
</li>
{/snippet}

<article class="row">
  <img class="avatar" src={member.avatar} alt="" loading="lazy" decoding="async" />
  <div class="main">
    <p class="sr">{summary.sentence}</p>
    <p class="meta">
      {#if member.href}<a class="name" href={member.href}>{member.name}</a>{:else}<b class="name">{member.name}</b>{/if}
      <span aria-hidden="true">· {summary.ago}</span>
      {#if summary.span}<span>· {summary.span}</span>{/if}
      {#if watching}<SocialPill dot="live">Watching now</SocialPill>{/if}
    </p>
    <p class="head">
      {#each summary.head.links as link, i (i)}{#if i > 0}<span aria-hidden="true">,&#32;</span>{/if}<a
          href={link.href}>{link.text}</a>{/each}{#if summary.head.more}<span aria-hidden="true">{
            ` ${summary.head.more}`
          }</span>{/if}
    </p>
    {#if summary.count || summary.hearts.length || summary.rated.length || summary.comments.length}
      <p class="chips">
        {#if summary.count}
          <button type="button" class="chip toggle" aria-expanded={open} aria-controls="{id}-items" onclick={toggle}>
            {summary.count}
            <Icon svg={angleDown} />
          </button>
        {/if}
        {#each summary.hearts as rating, i (i)}<span aria-hidden="true"><SocialHeart {rating} /></span>{/each}
        {#each summary.rated as { rating, name }, i (i)}
          <span class="chip" aria-hidden="true"><SocialHeart {rating} /> {name}</span>
        {/each}
        {#each summary.comments as said (said.id)}
          <a class="chip" href="#{commentId(said.id)}"
            aria-label="{member.name}'s {said.review ? 'review' : 'comment'} on {said.on}"><Icon
              svg={said.review ? pen : comment} />
            {said.review ? 'Review' : 'Comment'}</a>
        {/each}
      </p>
    {/if}
    {#if summary.count}
      <div class="list" id="{id}-items" hidden={!open}>
        <ul class="items">
          {#each summary.list.lines as item (item.key)}{@render line(item)}{/each}
          {#if summary.list.more}
            <li class="more">
              <button type="button" class="chip toggle" aria-expanded={more} aria-controls="{id}-more"
                onclick={() => (more = !more)}>
                {summary.list.more}
                <Icon svg={angleDown} />
              </button>
            </li>
          {/if}
        </ul>
        {#if summary.list.rest.length}
          <ul class="items" id="{id}-more" hidden={!more}>
            {#each summary.list.rest as item (item.key)}{@render line(item)}{/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
  <div class="posters">
    {#each summary.posters.titles as title (title.key)}
      <a class="poster" href={title.href} tabindex="-1" aria-hidden="true"><img
          src={imageUrl(title.poster, 'thumb') ?? posterPlaceholder} alt="" loading="lazy" decoding="async" /></a>
    {/each}
    {#if summary.posters.more}<span class="poster more" aria-hidden="true">+{summary.posters.more}</span>{/if}
  </div>
</article>

<style>
.row {
  display: grid;
  grid-template-columns: var(--social-avatar-row) minmax(0, 1fr) auto;
  gap: var(--space-social-row);
  padding-block: var(--space-social-row);
  border-block-end: 1px solid var(--color-social-line);
}

.avatar {
  inline-size: var(--social-avatar-row);
  block-size: var(--social-avatar-row);
  border-radius: 50%;
  object-fit: cover;
}

.main {
  display: grid;
  gap: var(--space-xs-inline);
  align-content: start;
  min-inline-size: 0;
}

.meta,
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-social-chip-gap);
  align-items: center;
  margin: 0;
  color: var(--color-social-faint);
  font-size: var(--font-size-social-meta);
}

.name {
  color: var(--color-social-name);
  font-weight: bold;
}

.head {
  margin: 0;
  font-size: var(--font-size-social-head);
  font-weight: bold;

  & a {
    color: var(--color-text);
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  padding: var(--space-social-chip);
  border: 1px solid var(--color-social-line);
  border-radius: var(--social-pill-radius);
  background-color: var(--color-social-chip-bg);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  line-height: var(--social-chip-line);
  white-space: nowrap;
}

a.chip:hover {
  text-decoration: none;
  border-color: var(--color-social-faint);
}

.toggle {
  min-block-size: 0;
  cursor: pointer;

  & :global(.icon) {
    transition: transform var(--transition-social-toggle);
  }

  &[aria-expanded='true'] :global(.icon) {
    transform: rotate(180deg);
  }
}

.list[hidden],
.items[hidden] {
  display: none;
}

.items {
  display: grid;
  gap: var(--space-base-block);
  margin: var(--space-xs-inline) 0 0;
  padding: var(--space-xs-inline) 0 0 var(--space-social-row);
  border-inline-start: 2px solid var(--color-social-line);
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-lg-block);
    align-items: center;
    font-size: var(--font-size-social-meta);
  }

  & li > :global(.icon) {
    color: var(--color-social-muted);
  }

  & .more {
    display: block;
  }

  & p {
    margin: 0;
  }

  & a {
    color: var(--color-text);
    font-weight: bold;
  }

  & time {
    color: var(--color-social-faint);
    font-size: var(--font-size-social-chip);
    font-variant-numeric: tabular-nums;
  }
}

.codes {
  font-variant-numeric: tabular-nums;
}

.posters {
  display: flex;
  gap: var(--space-social-poster-gap);
  align-items: flex-start;
}

.poster {
  display: block;
  overflow: hidden;
  inline-size: var(--social-poster);
  aspect-ratio: var(--ratio-poster);
  border-radius: var(--social-still-radius);
  background-color: var(--color-social-still);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  &.more {
    display: grid;
    place-items: center;
    border: 1px solid var(--color-social-line);
    background-color: var(--color-social-chip-bg);
    color: var(--color-social-muted);
    font-size: var(--font-size-social-chip);
    font-weight: bold;
  }
}

.sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@container (width < 640px) {
  .row {
    grid-template-columns: var(--social-avatar-row) minmax(0, 1fr);
  }

  .posters {
    grid-column: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle :global(.icon) {
    transition: none;
  }
}
</style>
