<!--
  One person's part in a title: their avatar, name and how long ago (or, on a person's details, the title's poster
  and name), then SocialTags for what they did, what they
  watched linking to their history for the period. The Social Feed's poster details list them, and the expanded
  featured title gives each one a card.
    <SocialPerson detail={detail} now={now} />
-->
<script lang="ts">
import type { SocialDetail } from '#lib/dashboard/toSocialDetails.ts';
import { relativeDate } from '#lib/utils/relativeDate.ts';
import SocialTags from './SocialTags.svelte';

const { detail, now }: { detail: SocialDetail; now: Date } = $props();
const member = $derived(detail.member);
/** "A day ago", title-cased for a line of its own. */
const ago = $derived(relativeDate(detail.at, now).replace(/^./, (first) => first.toUpperCase()));
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="person">
  {#if detail.title}
    <a class="poster" href={detail.title.href} tabindex="-1" aria-hidden="true">{#if detail.title.poster}<img
          src={detail.title.poster} alt="" loading="lazy" decoding="async" />{/if}</a>
  {:else}
    <img class="avatar" src={member.avatar} alt="" loading="lazy" decoding="async" />
  {/if}
  <span class="name">
    {#if detail.title}
      <a href={detail.title.href}>{detail.title.name}</a>
    {:else if member.href}<a href={member.href}>{member.name}</a>{:else}<span>{member.name}</span>{/if}
    <small><time datetime={detail.at}>{ago}</time></small>
  </span>
  <SocialTags watched={detail.watched} history={detail.history} rating={detail.rating}
    comment={detail.comment && { text: detail.comment.review ? 'Reviewed' : 'Commented', href: detail.comment.href }} />
</div>

<style>
.person {
  display: grid;
  grid-template-columns: var(--why-person-headshot) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-why-row);
}

.avatar {
  inline-size: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
}

/* A title's poster in a face's place, as narrow as a "Why this?" row's. */
.poster {
  position: relative;
  display: block;
  inline-size: var(--why-row-poster);
  justify-self: center;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-recommendations-placeholder);

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.name {
  display: grid;
  min-inline-size: 0;
  font-weight: var(--font-weight-headings);

  & > :is(a, span) {
    overflow: hidden;
    color: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & a:is(:hover, :focus-visible) {
    text-decoration: underline;
  }

  & small {
    color: var(--color-why-faint);
    font-size: var(--font-size-small);
    font-weight: normal;
  }
}
</style>
