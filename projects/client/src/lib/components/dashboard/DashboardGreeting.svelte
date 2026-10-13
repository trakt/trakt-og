<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import { headerArt } from '$lib/components/header/headerArt';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import CoverPill from '$lib/components/users/CoverPill.svelte';
import WatchingNowBar from '$lib/components/users/WatchingNowBar.svelte';
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import posterBackground from '$lib/assets/poster-bg.jpg';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { WatchingNow } from '$lib/users/WatchingNow';

const { user, memberSince, watching }: {
  user: ProfileUser;
  memberSince: string;
  watching: WatchingNow | null;
} = $props();
const cover = $derived(watching?.fanartUrl ?? (user.vip ? user.coverUrl : null));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- The profile header's look: avatar, name with the VIP label, and one glass pill with the full join date. -->
<section
  class={['greeting-cover', { watching, covered: cover }]}
  aria-labelledby="dashboard-heading"
  {@attach headerArt(cover ?? undefined)}
>
  <div class="background" style:background-image="url('{cover ?? posterBackground}')"></div>
  {#if cover}<div class="shadow"></div>{/if}
  <Container>
    <div class="greeting">
      <div class="identity">
        <a class="avatar-link" href="/users/{user.slug}" tabindex="-1" aria-hidden="true">
          <img src={user.avatarUrl} alt="" width="72" height="72" />
        </a>
        <div class="name-block">
          <h1 id="dashboard-heading">Hello, {user.firstName}{#if user.vip}<VipLabel badge={user.vip} />{/if}</h1>
          <CoverPill><Icon svg={calendar} />Joined <b>{memberSince}</b></CoverPill>
        </div>
      </div>
    </div>
  </Container>
  {#if watching}<WatchingNowBar {watching} owner="self" />{/if}
</section>

<style>
.greeting-cover {
  position: relative;
  padding-block-start: calc(var(--header-height) + var(--dashboard-greeting-top));
  color: var(--color-text-inverse);
  background-color: var(--color-profile-placeholder-bg);
  overflow: hidden;
  /* The same space under the greeting as above it, then the now-playing bar when something is playing. */
  padding-block-end: var(--dashboard-greeting-top);
  &.watching {
    padding-block-end: calc(var(--dashboard-greeting-top) + var(--profile-watching-height));
  }
}
.background,
.shadow {
  position: absolute;
  inset: 0;
}
.background {
  background-size: var(--profile-placeholder-size);
  filter: blur(var(--profile-placeholder-blur));
  background-color: var(--color-profile-placeholder-bg);
  opacity: var(--opacity-profile-placeholder);
  .covered & {
    background-position: center 20%;
    background-size: cover;
    filter: none;
    opacity: 1;
  }
}
.shadow {
  background: var(--gradient-profile-shadow);
}
.greeting {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: var(--gutter);
}
.identity {
  display: flex;
  align-items: end;
  gap: var(--profile-slim-gap);
}
.name-block {
  display: grid;
  justify-items: start;
  gap: var(--profile-slim-name-gap);
}
.avatar-link {
  flex-shrink: 0;
  img {
    display: block;
    inline-size: var(--profile-avatar-size-slim);
    block-size: var(--profile-avatar-size-slim);
    border: var(--profile-avatar-border) solid var(--color-profile-avatar-border);
    border-radius: 50%;
    box-shadow: var(--shadow-profile-avatar);
    object-fit: cover;
  }
}
h1 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  color: inherit;
  font-size: var(--font-size-profile-name);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-profile-name);
}
@media (width < 768px) {
  .avatar-link {
    display: none;
  }
  .greeting {
    flex-wrap: wrap;
  }
  h1 {
    font-size: var(--font-size-h2);
  }
}
</style>
