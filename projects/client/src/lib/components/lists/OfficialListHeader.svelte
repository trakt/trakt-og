<!--
  An official list's cover, built like a profile's slim one: the list's art under the site header (which takes its tint),
  the Trakt logo as the avatar, "Trakt" in the profile name's size, and an "Official List" glass pill under it.
-->
<script lang="ts">
import defaultCover from '$lib/assets/profile-cover-default.jpg';
import logo from '$lib/assets/trakt-logo-red.png';
import Container from '$lib/components/container/Container.svelte';
import { headerArt } from '$lib/components/header/headerArt';
import CoverPill from '$lib/components/users/CoverPill.svelte';
import Icon from '$lib/icons/Icon.svelte';
import traktIcon from '$lib/icons/trakt/trakt-v2.svg?raw';

const { image }: { image?: string } = $props();
const cover = $derived(image ?? defaultCover);
</script>

<section class="official-cover" style:--cover="url('{cover}')" aria-label="Official Trakt list"
  {@attach headerArt(cover)}>
  {#if image}<div class="shadow"></div>{/if}
  <div class="stage">
    <Container>
      <div class="about">
        <img class="avatar" src={logo} alt="" width="72" height="72" />
        <div class="identity">
          <h1>Trakt</h1>
          <div class="pills"><CoverPill><Icon svg={traktIcon} />Official List</CoverPill></div>
        </div>
      </div>
    </Container>
  </div>
</section>

<style>
.official-cover {
  position: relative;
  z-index: 1;
  block-size: calc(var(--header-height) + var(--official-list-cover-height));
  overflow: hidden;
  background: var(--cover) 50% 20% / cover no-repeat var(--color-page);
  color: var(--color-text-inverse);
}

.shadow {
  position: absolute;
  inset: 0;
  background: var(--gradient-profile-shadow);
}

/* The room under the header, with the name block in its middle. */
.stage {
  position: absolute;
  inset: var(--header-height) 0 0;
  z-index: 1;
  display: grid;
  align-content: center;
}

.about {
  display: flex;
  align-items: end;
  gap: var(--profile-slim-gap);
}

.avatar {
  display: block;
  flex: none;
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
}

h1 {
  margin: 0;
  font-size: var(--font-size-profile-name);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-shadow: var(--text-shadow-profile-name);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--profile-pill-gap);
}
</style>
