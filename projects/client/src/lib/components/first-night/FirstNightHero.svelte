<!--
  A new member's welcome wall, in place of the dashboard greeting. It opens with who they are (the avatar and display
  name to set), then importing from TV Time, IMDb or Letterboxd, then offers most watched and trending posters to mark seen in place. The progress toward the first ten
  titles is FirstNightProgress, the bar that sticks above it.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import ToggleChips from '$lib/components/toggle-chips/ToggleChips.svelte';
import circleCheck from '$lib/icons/regular/circle-check.svg?raw';
import fileImport from '$lib/icons/regular/file-import.svg?raw';
import type { FirstNight, FirstNightTab } from '$lib/firstNight/firstNight';
import AvatarPicker from './AvatarPicker.svelte';
import ImportStrip from './ImportStrip.svelte';
import NamePrompt from './NamePrompt.svelte';
import { savedName } from '$lib/firstNight/savedName.svelte';
import PickPoster from './PickPoster.svelte';

interface Props {
  firstNight: Promise<FirstNight>;
  firstName: string;
  /** Set a display name yet? Until then the greeting leaves the username out and asks for one. */
  named: boolean;
  avatarUrl: string;
}

const { firstNight, firstName, named, avatarUrl }: Props = $props();
const id = $props.id();
// A name set here greets them at once, without reloading the wall.
const shownName = $derived(savedName.value?.split(' ').at(0) ?? firstName);
const hasName = $derived(named || !!savedName.value);
let tab = $state<FirstNightTab['key']>('shows');
</script>

{#await firstNight}
  <section class="first-night loading" aria-label="Welcome to Trakt" aria-busy="true"></section>
{:then night}
  {@const current = night.tabs.find((each) => each.key === tab) ?? night.tabs.at(0)}
  <section class="first-night" aria-labelledby={id}>
    {#if night.backdrop}<img class="backdrop" src={night.backdrop} alt="" />{/if}
    <div class="glow"></div>
    <Container>
      <div class="wall">
        <header class="intro">
          <AvatarPicker src={avatarUrl} />
          <div class="hello">
            <p class="eyebrow">Tonight's premiere</p>
            <h1 {id}>Welcome to Trakt{hasName ? `, ${shownName}` : ''}. <span>Let's fill your shelf.</span></h1>
            {#if !hasName}<NamePrompt quiet onsaved={() => {}} />{/if}
          </div>
        </header>
        <div class="segment">
          <PanelHeading id="{id}-import" title="Import Your History" icon={fileImport} />
          <ImportStrip />
        </div>
        <div class="segment">
          <PanelHeading id="{id}-seen" title="What Have You Seen?" icon={circleCheck} />
          <ToggleChips label="Titles to pick from" options={night.tabs.map(({ key, label }) => ({ id: key, label }))}
            bind:selected={() => current?.key ?? tab, (key) => (tab = key as FirstNightTab['key'])} />
          {#if current}
            <div class="posters">
              {#each current.picks as pick (pick.key)}
                <PickPoster {pick} action="seen" />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </Container>
  </section>
{:catch}
  <!-- The charts are public; if they fail, the plain dashboard is still there. -->
{/await}

<style>
/* Always over dark art, so the poster cards take their Dark Knight colors in either theme. */
.first-night {
  color-scheme: dark;
  position: relative;
  overflow: hidden;
  background: var(--color-first-night-bg);
  color: var(--color-first-night-text);

  &.loading {
    min-block-size: 520px;
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: var(--first-night-backdrop-opacity);
  object-position: var(--first-night-backdrop-position);
}

.glow {
  position: absolute;
  inset: 0;
  background: var(--first-night-glow);
}

.wall {
  position: relative;
  display: grid;
  gap: calc(var(--gutter) * 1.25);
  padding-block: var(--gutter) calc(var(--gutter) * 1.5);
}

/* Who you are on Trakt: the avatar to change, then the greeting and the name to set. */
.intro {
  display: flex;
  align-items: center;
  gap: var(--first-night-intro-gap);
}

.hello {
  display: grid;
  gap: var(--space-sm-inline);
  min-inline-size: 0;

  /* The eyebrow sits right on the greeting. */
  & .eyebrow {
    margin-block-end: calc(var(--space-sm-inline) * -1 + 2px);
  }
}

.segment {
  display: grid;
  gap: 10px;
}

.eyebrow {
  margin: 0;
  color: var(--color-first-night-gold);
  font-size: var(--font-size-first-night-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-first-night-label);
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: inherit;
  font-size: var(--font-size-first-night-title);
  font-weight: 800;
  line-height: 1.05;
  text-wrap: balance;

  span {
    color: var(--brand-primary);
  }
}

/* Two rows of eight across the page column; tablets take four. */
.posters {
  display: grid;
  grid-template-columns: repeat(var(--first-night-wall-columns), minmax(0, 1fr));
  gap: var(--gutter);
  padding-block-start: var(--space-xs-inline);

  @media (width < 992px) {
    grid-template-columns: repeat(var(--first-night-wall-columns-narrow), minmax(0, 1fr));
  }
}
</style>
