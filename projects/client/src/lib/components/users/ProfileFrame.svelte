<!--
  The profile header, shared by every /users/:id page: the cover, avatar, name with the VIP and Private labels, the
  options menu, follow buttons (an incoming follow request gets its own bar across the top of the cover), a line of glass pills for private status, location and the year they joined, the
  watching-now player and the section tabs. The name block is one left-aligned row: centered on the slim cover, and
  low on the tall one so the art shows. The profile page gets the tall cover when there's art to show (the owner's
  cover or what they're watching); every subpage, and a profile without art, gets the slim one on OG's damask. A
  private profile the viewer can't see gets the full-height lock screen instead of the tabs.
-->
<script lang="ts">
import { getContext, setContext } from 'svelte';
import { changeRelationship } from '$lib/users/changeRelationship';
import { createRelationshipOverlay } from '$lib/users/createRelationshipOverlay.svelte';
import { relationshipRequest } from '$lib/users/relationshipRequest';
import defaultCover from '$lib/assets/profile-cover-default.jpg';
import privateCover from '$lib/assets/profile-cover-private.jpg';
import Container from '$lib/components/container/Container.svelte';
import { headerArt } from '$lib/components/header/headerArt';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import circleCheck from '$lib/icons/regular/circle-check.svg?raw';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
import flag from '$lib/icons/regular/flag.svg?raw';
import skull from '$lib/icons/solid/skull.svg?raw';
import userXmark from '$lib/icons/regular/user-xmark.svg?raw';
import type { ProfileTab } from '$lib/users/profileTabs';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import type { WatchingNow } from '$lib/users/WatchingNow';
import { savedName } from '$lib/firstNight/savedName.svelte';
import FollowButtons from './FollowButtons.svelte';
import FollowRequest from './FollowRequest.svelte';
import ProfilePills from './ProfilePills.svelte';
import ProfileTabs from './ProfileTabs.svelte';
import WatchingNowBar from './WatchingNowBar.svelte';

interface Props {
  user: ProfileUser;
  watching: WatchingNow | null;
  tabs: readonly ProfileTab[];
  /** The profile page itself, which gets the tall cover when there's an image for it. */
  large?: boolean;
  isSelf: boolean;
  signedIn: boolean;
  /** The viewer's follow state with the owner, streamed in after the page. Null for yourself or signed out. */
  canFollow?: boolean;
  relation: Promise<ViewerRelation | null> | null;
  /** A page's own cover over the owner's, like a VIP owner's list. Watching now still wins. */
  coverUrl?: string;
}

const { user, watching, tabs, large = false, isSelf, signedIn, relation, canFollow = true, coverUrl }: Props = $props();

const relationships = getContext<ReturnType<typeof createRelationshipOverlay>>('user-relationships') ??
  createRelationshipOverlay();
setContext('user-relationships', relationships);
let reporting = $state(false);
const href = $derived(`/users/${user.slug}`);
const cover = $derived(user.isLocked ? privateCover : (watching?.fanartUrl ?? coverUrl ?? user.coverUrl));
const slim = $derived(!user.isLocked && (!large || !cover));
// The tall cover is shaded at the top for the header, and from the bottom left for the name. The slim and private ones
// are shaded from the left, except the slim damask, which needs none.
const overlay = $derived(slim || user.isLocked ? (cover ? 'shadow' : null) : 'shade');
// Your own name updates here the moment you save it on the page.
const name = $derived((isSelf && savedName.value) || user.displayName);
const showOthersControls = $derived(signedIn && !isSelf);
const change = (viewer: ViewerRelation, action: 'unfollow' | 'block' | 'unblock') =>
  changeRelationship({
    slug: user.slug,
    isPrivate: user.isPrivate,
    relation: viewer,
    action,
    overlay: relationships,
    request: relationshipRequest,
    notify: toast,
  });
</script>

<!-- Counts and the owner's name link to profile pages other issues build; resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section
  class={['profile-cover', { slim, locked: user.isLocked, watching }]}
  style:--cover="url('{cover ?? defaultCover}')"
  {@attach headerArt(cover ?? defaultCover)}
>
  {#if overlay}<div class={overlay}></div>{/if}
  {#if user.isLocked}<div class="locked-overlay"></div>{/if}

  <!-- An incoming follow request: a question bar under the site header. The cover grows to make room for it. -->
  {#if showOthersControls && relation}
    {#await relation then viewer}
      {#if viewer && viewer.requestId !== null}
        <div class="request">
          <FollowRequest firstName={user.firstName} slug={user.slug} isPrivate={user.isPrivate} relation={viewer} />
        </div>
      {/if}
    {/await}
  {/if}

  <div class="stage">
    <Container>
      <div class="about">
        <a class="avatar-link" {href} tabindex="-1" aria-hidden="true">
          <img class="avatar" src={user.avatarUrl} alt="" width="72" height="72" />
        </a>
        <div class="identity">
          <h1>
            <a {href}>{name}</a>
            {#if user.vip}<VipLabel badge={user.vip} />{/if}
            {#if showOthersControls}
              <span class="options">
                <Dropdown variant="circle" label="User options">
                  {#snippet trigger()}<Icon svg={ellipsis} />{/snippet}
                  <ul>
                    {#await relation then viewer}
                      {#if viewer}
                        {@const current = relationships.state(user.slug, viewer).relation}
                        {#if current.follow === 'following'}
                          <li>
                            <button type="button" onclick={() => change(viewer, 'unfollow')}>
                              <span class="menu-row"><Icon svg={userXmark} fixedWidth />Unfollow</span>
                            </button>
                          </li>
                        {/if}
                        <li>
                          <button type="button" onclick={() => change(viewer, current.blocked ? 'unblock' : 'block')}>
                            <span class="menu-row">
                              <Icon svg={current.blocked ? circleCheck : ban} fixedWidth />{current.blocked ? 'Unblock' : 'Block'}
                            </span>
                          </button>
                        </li>
                      {/if}
                    {/await}
                    <li>
                      <button type="button" onclick={() => { reporting = true; }}>
                        <span class="menu-row"><Icon svg={flag} fixedWidth />Report</span>
                      </button>
                    </li>
                  </ul>
                </Dropdown>
              </span>
            {/if}
          </h1>

          {#if !user.isLocked}
            <ProfilePills {user} />
          {/if}
        </div>

        {#if showOthersControls && relation}
          {#await relation then viewer}
            {#if viewer}
              <div class="buttons">
                <FollowButtons slug={user.slug} isPrivate={user.isPrivate} relation={viewer} {canFollow} />
              </div>
            {/if}
          {/await}
        {/if}
      </div>
    </Container>
  </div>

  {#if user.isLocked}
    <div class="locked-message">
      <h2>
        <Icon svg={skull} />&nbsp; {user.firstName}'s profile is private <Icon svg={skull} />
      </h2>
      <p>Follow {user.firstName} and you'll be able to see their profile if they accept your request.</p>
    </div>
  {:else}
    <!-- The player and the tabs stack at the foot of the cover, as one glass deck. -->
    <div class="deck">
      {#if watching}
        <div class="watching-now">
          <WatchingNowBar {watching} owner={isSelf ? 'self' : { firstName: user.firstName, href }} />
        </div>
      {/if}
      <ProfileTabs {tabs} />
    </div>
  {/if}
</section>

<ReportDialog bind:open={reporting}
  target={{ type: 'user', id: user.slug, title: name, href, fanart: cover ?? defaultCover }} />

<style>
.profile-cover {
  --deck: var(--profile-tabs-height);
  --top: var(--header-height);
  position: relative;
  z-index: 1;
  block-size: calc(var(--top) + var(--profile-cover-height));
  overflow: hidden;
  background: var(--cover) 50% 20% / cover no-repeat var(--color-page);
  color: var(--color-text-inverse);
  transition: block-size 0.5s;

  &.watching {
    --deck: calc(var(--profile-tabs-height) + var(--profile-watching-height));
    block-size: calc(var(--top) + var(--profile-cover-height) + var(--profile-watching-height));
  }

  &.slim {
    block-size: calc(var(--top) + var(--profile-cover-height-slim));

    &.watching {
      block-size: calc(var(--top) + var(--profile-cover-height-slim) + var(--profile-watching-height));
    }
  }

  &:has(.request) {
    --top: calc(var(--header-height) + var(--profile-request-bar-height));
  }

  &.locked {
    --deck: 0px;
    block-size: 100vh;
  }
}

.shade,
.shadow,
.locked-overlay {
  position: absolute;
  inset: 0;
}

.shade {
  background: var(--gradient-profile-shade);
}

.shadow {
  background: var(--gradient-profile-shadow);
}

.locked-overlay {
  background-color: var(--color-profile-private-overlay);
}

.request {
  position: absolute;
  inset-block-start: var(--header-height);
  inset-inline: 0;
  z-index: 3;
}

/* The room between the header and the deck: the name block sits low on the tall cover, in the middle otherwise. */
.stage {
  position: absolute;
  inset-block: var(--top) var(--deck);
  inset-inline: 0;
  z-index: 1;
  display: grid;
  align-content: end;
  padding-block-end: var(--profile-tall-bottom);

  :is(.slim, .locked) & {
    align-content: center;
    padding-block-end: 0;
  }

  .locked & {
    padding-block-end: 50px;
  }
}

/* Bottom-aligned, so the buttons sit on the pills' line. When the name and the buttons don't fit side by side, the
   buttons drop to their own line, still on the right. */
.about {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--profile-slim-gap);

  .locked & {
    flex-direction: column;
    align-items: center;
    gap: var(--profile-about-gap);
    text-align: center;
  }
}

.avatar-link {
  display: block;
  flex: none;
}

.avatar {
  display: block;
  inline-size: var(--profile-avatar-size-slim);
  block-size: var(--profile-avatar-size-slim);
  border: var(--profile-avatar-border) solid var(--color-profile-avatar-border);
  border-radius: 50%;
  background-color: var(--color-text-inverse);
  box-shadow: var(--shadow-profile-avatar);
  object-fit: cover;
}

.identity {
  display: grid;
  justify-items: start;
  gap: var(--profile-slim-name-gap);
  min-inline-size: 0;

  .locked & {
    justify-items: center;
  }
}

h1 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  font-size: var(--font-size-profile-name);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-profile-name);

  & > a {
    color: var(--color-text-inverse);
  }

  .locked & {
    justify-content: center;
  }
}

.options {
  display: inline-flex;
  align-self: center;
  align-items: center;
  margin-inline-start: var(--profile-about-gap);
  line-height: 0;
  font-size: var(--font-size-base);
  text-shadow: none;

  /* The ellipsis matches the cover's glass buttons, at the VIP label's height; the menu is the shared dropdown card. */
  & :global(.trigger.circle) {
    inline-size: var(--profile-options-size);
    block-size: var(--profile-options-size);
    border: var(--action-button-border-width) solid var(--color-profile-button-border);
    background-color: var(--color-profile-pill-bg);
    backdrop-filter: var(--blur-profile-pill);
  }

  & :global(.trigger.circle:is(:hover, :focus-visible)) {
    border-color: var(--color-profile-button-border-hover);
    background-color: var(--color-profile-button-hover-bg);
  }
}

.menu-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
}

.buttons {
  display: flex;
  justify-content: end;
  gap: var(--profile-button-gap);
  margin-inline-start: auto;

  .locked & {
    justify-content: center;
    margin-inline-start: 0;
  }
}

.deck {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 2;
}

.watching-now {
  position: relative;
  block-size: var(--profile-watching-height);
}

.locked-message {
  position: absolute;
  inset-block-end: 0;
  inline-size: 100%;
  background-color: var(--color-profile-private-message-bg);
  text-align: center;

  & h2 {
    margin: 25px 0 15px;
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-headings);
  }

  & p {
    margin: 0 0 25px;
    font-family: var(--font-headings);
    font-size: var(--font-size-private-subtitle);
    line-height: var(--line-height-headings);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-cover {
    transition: none;
  }
}

/* Phones only have to be usable: the slim cover grows to fit its wrapped lines, and the buttons drop under them. */
@media (width < 768px) {
  .profile-cover.slim {
    block-size: auto;
  }

  .slim :is(.stage, .deck) {
    position: relative;
    inset: auto;
  }

  .slim .stage {
    padding-block: calc(var(--top) + 15px) 15px;
  }

  h1 {
    font-size: var(--font-size-h2);
  }

  .locked-message h2 {
    margin: 25px 0 15px;
    font-size: var(--font-size-h2);
  }

  .locked-message p {
    padding-inline: 20px;
    font-size: var(--font-size-h5);
  }
}
</style>
