<!--
  What people did with a title as the "Why this?" panel's comment tags: what they watched (or, for several people,
  how many watched it, in the together blue) joined with their rating, one segment each (the watched one a link with
  `history`, the rating in its own color, or as a percent with `percent`), then Commented or Reviewed, a link with
  `comment.href`.
    <SocialTags watched="3x04" history="/users/kate/history?…" rating={8} />
    <SocialTags watchers={2} rating={9.3} percent comment={{ text: '1 comment' }} />
-->
<script lang="ts">
import CommentTag from '#lib/components/comments/CommentTag.svelte';
import comment from '#lib/icons/regular/comment.svg?raw';
import heart from '#lib/icons/solid/heart.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import checkThick from '#lib/icons/trakt/check-thick.svg?raw';
import { countLabel } from '#lib/utils/countLabel.ts';
import { ratingPercent } from '#lib/utils/ratingPercent.ts';

interface Props {
  watched?: string;
  /** How many people watched it, in place of `watched`. */
  watchers?: number;
  history?: string;
  /** 1 to 10; an average when `percent`. */
  rating?: number;
  percent?: boolean;
  comment?: { readonly text: string; readonly href?: string };
}

const { watched, watchers, history, rating, percent = false, comment: said }: Props = $props();
const level = $derived(rating === undefined ? 1 : Math.min(Math.max(Math.trunc(rating), 1), 10));
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<span class="tags">
  {#if watched || watchers || rating}
    <span class={['joined', { both: (watched || watchers) && rating }]}>
      {#if watchers}
        <span class="segment watched-segment">
          <CommentTag svg={userGroup} color="var(--color-social-together)" tint>{countLabel(watchers, 'Watcher')}</CommentTag>
        </span>
      {:else if watched}
        <svelte:element this={history ? 'a' : 'span'} href={history} class="segment watched-segment">
          <CommentTag svg={checkThick} glyph tone="watched" tint>{watched}</CommentTag>
        </svelte:element>
      {/if}
      {#if rating}
        <span class="segment rated-segment">
          <CommentTag svg={heart} color="var(--rating-{level})" tint><span class="visually-hidden">Rated
            </span>{percent ? `${ratingPercent(rating)}%` : rating}</CommentTag>
        </span>
      {/if}
    </span>
  {/if}
  {#if said}
    <svelte:element this={said.href ? 'a' : 'span'} href={said.href} class="segment">
      <CommentTag svg={comment} tint>{said.text}</CommentTag>
    </svelte:element>
  {/if}
</span>

<style>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--why-chips-gap);
  justify-content: end;
}

.joined,
.segment {
  display: inline-flex;
}

a.segment {
  text-decoration: none;

  &:is(:hover, :focus-visible) :global(.tag) {
    border-color: currentColor;
  }
}

.both > .watched-segment :global(.tag) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.both > .rated-segment {
  margin-inline-start: -1px;

  & :global(.tag) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
}
</style>
