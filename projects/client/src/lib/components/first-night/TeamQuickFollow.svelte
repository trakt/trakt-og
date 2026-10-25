<!--
  A few of the Trakt team, shuffled each visit, as avatars that follow on a tap. A small badge says so: a green plus
  to follow, then solid green with a tick and a green ring once followed; a second tap unfollows. A follow goes into
  the overlay's network at once, so a credit counting follows ticks without a reload. Shimmering avatars hold their
  place until the team loads.
-->
<script lang="ts">
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { fetchTeamToFollow } from '$lib/firstNight/teamToFollow';
import Icon from '$lib/icons/Icon.svelte';
import plus from '$lib/icons/solid/plus.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { relationshipRequest } from '$lib/users/relationshipRequest';
import type { ViewerRelation } from '$lib/users/ViewerRelation';

const { count = 5 }: { count?: number } = $props();
const team = fetchTeamToFollow(fetch);
const relations = createRelationshipOverlay();

const following = (slug: string) => overlay.slices().network?.following.has(slug) ?? false;
const relationOf = (slug: string): ViewerRelation => ({
  follow: following(slug) ? 'following' : 'none',
  followsYou: overlay.slices().network?.followers.has(slug) ?? false,
  blocked: false,
  requestId: null,
});

async function toggle(slug: string, isPrivate: boolean) {
  const on = following(slug);
  const saved = await changeRelationship({
    slug,
    isPrivate,
    relation: relationOf(slug),
    action: on ? 'unfollow' : 'follow',
    overlay: relations,
    request: relationshipRequest,
    notify: toast,
  });
  if (!saved) return;
  overlay.patch('network', (network) => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a fresh copy handed to the overlay, never mutated after
    const next = new Set(network.following);
    if (on) next.delete(slug);
    else next.add(slug);
    return { ...network, following: next };
  });
}
</script>

{#await team}
  <div class="team" aria-busy="true">
    {#each { length: count } as _, i (i)}
      <Shimmer inline="var(--team-quick-avatar)" block="var(--team-quick-avatar)" round />
    {/each}
  </div>
{:then members}
  <ul class="team" aria-label="The Trakt team">
    {#each members.slice(0, count) as member (member.slug)}
      {@const on = following(member.slug)}
      <li>
        <Tooltip text={on ? `Following ${member.name}` : `Follow ${member.name}`}>
          {#snippet trigger(tooltip)}
            <button type="button" class={['member', { on }]} aria-pressed={on}
              aria-label={on ? `Unfollow ${member.name}` : `Follow ${member.name}`}
              aria-busy={relations.busy(member.slug)} onclick={() => toggle(member.slug, member.isPrivate)} {...tooltip}>
              <img src={member.avatar} alt="" width="40" height="40" loading="lazy" />
              <span class="badge" aria-hidden="true"><Icon svg={on ? check : plus} /></span>
            </button>
          {/snippet}
        </Tooltip>
      </li>
    {/each}
  </ul>
{/await}

<style>
.team {
  display: flex;
  gap: var(--space-sm-inline);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The avatar is the button; base.css gives buttons a control's height, which it drops. */
.member {
  position: relative;
  display: block;
  inline-size: var(--team-quick-avatar);
  block-size: var(--team-quick-avatar);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  box-shadow: 0 0 0 2px var(--color-team-quick-ring);
  cursor: pointer;
  transition: box-shadow 0.15s;

  img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  &.on {
    box-shadow: 0 0 0 2px var(--color-team-quick-on);
  }

  &[aria-busy='true'] {
    opacity: 0.6;
    cursor: wait;
  }
}

.badge {
  position: absolute;
  inset-block-end: calc(var(--team-quick-badge) / -5);
  inset-inline-end: calc(var(--team-quick-badge) / -5);
  display: grid;
  place-items: center;
  inline-size: var(--team-quick-badge);
  block-size: var(--team-quick-badge);
  border-radius: 50%;
  border: 1px solid var(--color-team-quick-on);
  background: var(--color-first-night-bg);
  box-shadow: 0 0 0 2px var(--color-first-night-bg);
  color: var(--color-team-quick-on);
  font-size: var(--font-size-team-quick);
  transition: background-color 0.15s, color 0.15s;

  .member:is(:hover, :focus-visible) &,
  .on & {
    background: var(--color-team-quick-on);
    color: var(--color-text-inverse);
  }

  /* The tick's glyph sits high in its box; a pixel down centres it. */
  .on & :global(svg) {
    translate: 0 1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .member,
  .badge {
    transition: none;
  }
}
</style>
