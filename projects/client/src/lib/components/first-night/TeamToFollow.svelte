<!--
  An empty Social Feed's suggestion: eight of the Trakt team, shuffled each visit, two to a row with the profile's
  follow button at each one's right. Their follow state comes from the overlay's network slice, so a follow shows right away.
-->
<script lang="ts">
import FollowButtons from '$lib/components/users/FollowButtons.svelte';
import { fetchTeamToFollow } from '$lib/firstNight/teamToFollow';
import { overlay } from '$lib/overlay/overlay';
import type { ViewerRelation } from '$lib/users/ViewerRelation';

const team = fetchTeamToFollow(fetch);

const relation = (slug: string): ViewerRelation => {
  const network = overlay.slices().network;
  return {
    follow: network?.following.has(slug) ? 'following' : 'none',
    followsYou: network?.followers.has(slug) ?? false,
    blocked: false,
    requestId: null,
  };
};
</script>

<!-- Profiles are og routes, built from the member's slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#await team then members}
  {#if members.length > 0}
    <ul class="team" aria-label="The Trakt team">
      {#each members as member (member.slug)}
        <li class="member">
          <a class="who" href="/users/{member.slug}">
            <img src={member.avatar} alt="" width="44" height="44" loading="lazy" />
            <span class="name">{member.name}{#if member.location}<small>{member.location}</small>{/if}</span>
          </a>
          <FollowButtons slug={member.slug} isPrivate={member.isPrivate} relation={relation(member.slug)} />
        </li>
      {/each}
    </ul>
  {/if}
{/await}

<style>
.team {
  display: grid;
  grid-template-columns: repeat(var(--team-follow-columns), minmax(0, 1fr));
  gap: var(--space-sm-inline);
  margin: 0;
  padding: 0;
  list-style: none;

  @container (width < 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* The member on the left, their follow button on the right. */
.member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  padding: var(--team-follow-padding);
  border-radius: var(--radius-object);
  background: var(--color-team-follow-bg);
}

.who {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  min-inline-size: 0;
  color: inherit;
  text-decoration: none;

  img {
    flex: none;
    inline-size: var(--team-follow-avatar);
    block-size: var(--team-follow-avatar);
    border-radius: 50%;
    object-fit: cover;
  }

  &:is(:hover, :focus-visible) .name {
    text-decoration: underline;
  }
}

.name {
  display: grid;
  min-inline-size: 0;
  font-weight: var(--font-weight-headings);
  overflow-wrap: anywhere;

  small {
    color: var(--color-text-muted);
    font-size: var(--font-size-small);
    font-weight: normal;
  }
}
</style>
