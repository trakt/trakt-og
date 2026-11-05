<!--
  The taste match breakdown the cover's match pill opens, in the art dialogs' frame. The header is a face-off on the
  owner's cover, under a radial tint in the level's color: your avatar, an arcade "VS" (in the box office figures'
  face) and theirs, over the cover's match pill, large. A hidden title names the dialog. Soulmates' hearts and
  Co-stars' stars fall softly through the header. Under it, the shared topics and six of
  the shared favorites at random, read the first time it opens, each under a heading whose rule is its part of the
  score. Topics are tinted by how telling they are, the most telling marked ✦. Different universe's header is a night
  sky.
    <MatchDialog bind:open {match} {owner} />
-->
<script lang="ts">
import { page } from '$app/state';
import { prefersReducedMotion } from 'svelte/motion';
import type { Attachment } from 'svelte/attachments';
import { holdHover } from '#lib/extras/holdHover.ts';
import MatchBlast from '#lib/extras/match-blast.svelte';
import MatchScene from '#lib/extras/match-scene.svelte';
import defaultCover from '#lib/assets/profile-cover-default.jpg';
import Dialog from '#lib/components/dialog/Dialog.svelte';
import EmptyNote from '#lib/components/empty/EmptyNote.svelte';
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';
import sparkle from '#lib/icons/solid/sparkle.svg?raw';
import { fetchSharedFavorites } from '#lib/users/match/fetchSharedFavorites.ts';
import { matchLevelIcon } from '#lib/users/match/matchLevelIcon.ts';
import type { UserMatch } from '#lib/users/match/UserMatch.ts';
import { PLACEHOLDER_AVATAR } from '#lib/users/placeholderAvatar.ts';
import type { FavoriteCard } from '#lib/users/profile/toProfileSummary.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import MatchBadge from './MatchBadge.svelte';

interface Props {
  open: boolean;
  match: UserMatch;
  owner: Pick<ProfileUser, 'slug' | 'firstName' | 'avatarUrl' | 'coverUrl'>;
  /** Sample posters for a demo. Left out, it reads the owner's favorites. */
  loadFavorites?: () => Promise<readonly FavoriteCard[]>;
}

let { open = $bindable(), match, owner, loadFavorites }: Props = $props();

// One row of posters.
const SHOWN = 6;
// Each falling icon: where it starts across the header (%), its size (em), how long one fall takes (s), and how far
// into its fall it is when the dialog opens (s), so the header never opens empty.
const DROPS = [
  [6, 0.8, 9, -1],
  [16, 1.1, 11, -6],
  [27, 0.7, 8, -3],
  [38, 0.9, 10, -8],
  [52, 0.75, 12, -2],
  [63, 1, 9.5, -5],
  [74, 0.8, 11, -9],
  [85, 1.05, 8.5, -4],
  [94, 0.7, 10, -7],
] as const;

const key = $derived(match.level.key);
const icon = $derived(matchLevelIcon[key]);
const falling = $derived(key === 'soulmates' || key === 'co-stars');
const style = $derived(
  [
    `--match: var(--color-match-${key})`,
    `--match-end: var(--color-match-${key}-end)`,
    `--match-text: var(--color-match-${key}-text)`,
  ].join('; '),
);
const viewerAvatar = $derived(page.data.user?.avatarUrl ?? PLACEHOLDER_AVATAR);
const sharedCount = $derived(match.sharedFavorites.movies.length + match.sharedFavorites.shows.length);
const favorites = $derived(
  sharedCount === 0 ? null : (loadFavorites?.() ?? fetchSharedFavorites(owner.slug, match.sharedFavorites, SHOWN)),
);
const anyTop = $derived(match.sharedSubgenres.some(({ tier }) => tier === 'top'));

let playing = $state(false);
const play = holdHover(2000, () => {
  if (!prefersReducedMotion.current) playing = true;
});

// Opening starts on the dialog itself, like Watch Now, not a ringed first poster: Tab reaches the posters from there.
const focusDialog: Attachment<HTMLElement> = (footer) => {
  if (!open) return;
  queueMicrotask(() => footer.closest('dialog')?.focus());
};
</script>

<!-- Media routes are mapped from the API's canonical slugs. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet sectionTitle(name: string, part: string, value: number)}
  <h3 class="section-title">
    {name}
    <span class="meter" aria-hidden="true"><span style:--value="{value}%"></span></span>
    <span class="part"><span class="visually-hidden">{part} alike:</span>{value}%</span>
  </h3>
{/snippet}

<Dialog bind:open title="Taste match with {owner.firstName}" size="xl" variant="art" lightDismiss>
  {#snippet header(titleId)}
    <header class={['header', key, { playing }]} {style}>
      <img class="art" src={owner.coverUrl ?? defaultCover} alt="" />
      <span class="tint" aria-hidden="true"></span>
      {#if falling}
        <div class="falls" aria-hidden="true">
          {#each DROPS as [x, size, fall, delay] (x)}
            <span class="drop" style:--x="{x}%" style:--size={size} style:--fall="{fall}s" style:--delay="{delay}s"
            ><Icon svg={icon} /></span>
          {/each}
        </div>
      {/if}
      <div class="stage">
        <h2 id={titleId} class="visually-hidden">Taste match with {owner.firstName}</h2>
        <div class="faceoff">
          <img src={viewerAvatar} alt="You" />
          <span class="vs-slot">
            <span class={['vs', { blown: playing }]} aria-hidden="true" {@attach play}>VS</span>
            {#if playing}<MatchBlast />{/if}
          </span>
          <img src={owner.avatarUrl} alt={owner.firstName} />
        </div>
        <MatchBadge {match} large />
      </div>
      {#if playing}<MatchScene level={key} ondone={() => (playing = false)} />{/if}
    </header>
  {/snippet}

  <div class={['match', key]} {style}>
    {#if match.sharedSubgenres.length > 0}
      <div>
        {@render sectionTitle('Shared topics', 'Topics', match.subgenres)}
        <ul class="topics">
          {#each match.sharedSubgenres as topic (topic.slug)}
            <li class={topic.tier}>{#if topic.tier === 'top'}<Icon svg={sparkle} />{/if}{topic.name}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if favorites}
      <div>
        {@render sectionTitle('Shared favorites', 'Favorites', match.favorites)}
        {#await favorites}
          <ul class="posters" aria-busy="true">
            {#each Array.from({ length: Math.min(sharedCount, SHOWN) }, (_, n) => n) as n (n)}
              <li><Shimmer inline="100%" block="100%" /></li>
            {/each}
          </ul>
        {:then cards}
          <ul class="posters">
            {#each cards.slice(0, SHOWN) as card (`${card.type}-${card.id}`)}
              <li>
                <Tooltip text={card.title}>
                  {#snippet trigger(tooltip)}
                    <a href={card.href} {...tooltip}>
                      {#if card.image}
                        <img src={card.image} alt={card.title} loading="lazy" decoding="async" />
                      {:else}
                        <span
                          class="blank"
                          style:background-image="linear-gradient(to bottom right, {card.gradient[0]}, {card.gradient[1]})"
                        >{card.title}</span>
                      {/if}
                    </a>
                  {/snippet}
                </Tooltip>
              </li>
            {/each}
          </ul>
        {:catch}
          <EmptyNote>Shared favorites didn't load.</EmptyNote>
        {/await}
      </div>
    {/if}
  </div>

  <footer class="footer" {style} {@attach focusDialog}>
    <p>Based on the topics you both watch most and the favorites you share.</p>
    {#if anyTop}<p class="mark-note"><Icon svg={sparkle} /> marks the topics that say the most about you two.</p>{/if}
  </footer>
</Dialog>

<style>
/* The art header: the owner's cover under the art dialogs' shade and the level's tint, glowing from the middle. */
.header {
  position: relative;
  display: grid;
  align-content: center;
  min-block-size: var(--match-header-min-height);
  overflow: hidden;
  color: var(--color-card-text);
  /* The arcade lettering (the "VS" and anything played over the header), in the level's colors. */
  --match-vs-fill: linear-gradient(
    color-mix(in srgb, var(--match) var(--match-vs-light-mix), var(--color-match-vs-light)) 10%,
    var(--match) 42%,
    var(--match-end) 55%,
    color-mix(in srgb, var(--match-end) var(--match-vs-dark-mix), var(--color-match-vs-dark)) 90%
  );
  --match-vs-stroke: color-mix(in srgb, var(--match-end) var(--match-vs-stroke-mix), var(--color-match-vs-dark));
  --match-vs-glow: drop-shadow(var(--shadow-match-vs-drop))
    drop-shadow(var(--shadow-match-vs-glow) color-mix(in srgb, var(--match) var(--match-vs-glow-mix), transparent));

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--gradient-dialog-art-shade);
  }
}

.art {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: center 30%;
}

.tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--match) var(--match-header-tint-mix), transparent),
    transparent var(--match-header-tint-reach)
  );

  .soulmates & {
    background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--match) var(--match-header-tint-mix), transparent),
      color-mix(in srgb, var(--match-end) var(--match-header-tint-mix), transparent) 35%,
      transparent var(--match-header-tint-reach)
    );
  }

  .different-universe & {
    background: var(--match-band-starfield), var(--color-match-space);
  }
}

/* Soulmates' hearts and Co-stars' stars, drifting down behind the face-off. Still with reduced motion, so hidden. */
.falls {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: none;
  overflow: hidden;
  pointer-events: none;
}

.drop {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: var(--x);
  color: var(--match);
  font-size: calc(var(--size) * var(--font-size-match-fall));
  line-height: 0;
  opacity: 0;
}

.stage {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: var(--match-header-gap);
  padding: var(--match-header-padding);
  transition: opacity var(--transition-match-poster);

  /* Dims once the "VS" has blown apart, for what plays over the header. */
  .playing & {
    opacity: var(--opacity-match-stage-dimmed);
    transition-delay: var(--delay-match-stage-dim);
  }
}

.faceoff {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);

  & img {
    inline-size: var(--match-avatar-size);
    block-size: var(--match-avatar-size);
    border: var(--match-avatar-border) solid var(--color-profile-avatar-border);
    border-radius: 50%;
    box-shadow: var(--shadow-profile-avatar);
    object-fit: cover;
  }

  .soulmates & img {
    box-shadow: var(--shadow-match-avatar-glow) var(--match);
  }
}

/* Its letters sit high in their line, so the slot drops it to the avatars' middle, with anything bursting from it. */
.vs-slot {
  position: relative;
  display: inline-grid;
  place-items: center;
  translate: 0 var(--match-vs-drop);
}

/* The fighting-game versus, in the box office figures' condensed face, leaning by a skew. */
.vs {
  padding-inline: var(--space-xs-inline);
  background: var(--match-vs-fill);
  background-clip: text;
  color: transparent;
  font-family: var(--font-box-office-figures);
  font-stretch: condensed;
  font-size: var(--font-size-match-vs);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-match-vs);
  line-height: 1;
  -webkit-text-stroke: 1px var(--match-vs-stroke);
  filter: var(--match-vs-glow);
  transform: skewX(var(--skew-match-vs));

  /* Held under the pointer it charges up, then blows apart. */
  @media (prefers-reduced-motion: no-preference) {
    cursor: crosshair;
    transition: scale var(--duration-match-vs-charge) ease-in;

    &:hover {
      scale: var(--scale-match-vs-charge);
    }
  }

  &.blown {
    animation: vs-blow var(--duration-match-vs-blow) ease-out forwards;
  }
}

@keyframes vs-blow {
  to {
    opacity: 0;
    scale: var(--scale-match-vs-blow);
  }
}

.match {
  display: grid;
  gap: var(--match-section-gap);
  padding: var(--dialog-art-body-top) var(--dialog-art-inline);
}

/* Watch Now's section label. Its rule to the edge is the section's part of the score. */
.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-watch-now-label);
  margin: 0 0 var(--space-watch-now-section);
  color: var(--color-watch-now-section);
  font-family: var(--font-headings);
  font-size: var(--font-size-watch-now-section);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-see-more);
  line-height: var(--line-height-base);
  text-transform: uppercase;
}

.meter {
  flex: 1;
  block-size: var(--match-bar-height);
  overflow: hidden;
  border-radius: calc(var(--match-bar-height) / 2);
  background-color: var(--color-match-track);

  & span {
    display: block;
    inline-size: var(--value);
    block-size: 100%;
    background: linear-gradient(to right, var(--match), var(--match-end));
  }
}

.part {
  color: var(--color-text);
  font-size: var(--font-size-match-part);
  letter-spacing: normal;
  font-variant-numeric: tabular-nums;
}

.topics,
.posters {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* v3's three weights: the most telling glows in the level's color, the next two are tinted, the rest are faint. */
.topics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--match-topic-gap);

  & li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs-inline);
    padding: var(--match-topic-padding);
    border: 1px solid transparent;
    border-radius: var(--radius-match-topic);
    background-color: var(--color-match-topic-light-bg);
    color: var(--color-why-faint);
    font-size: var(--font-size-match-topic);
    font-weight: var(--font-weight-headings-heavy);
  }

  & .strong {
    border-color: color-mix(in srgb, var(--match) var(--match-topic-border-mix), var(--color-why-border));
    background-color: color-mix(in srgb, var(--match) var(--match-topic-tint-mix), transparent);
    color: var(--color-text);
  }

  & .top {
    border-color: var(--match);
    background-color: color-mix(in srgb, var(--match) var(--match-topic-top-mix), transparent);
    box-shadow: var(--shadow-match-topic-top) color-mix(in srgb, var(--match) var(--match-topic-glow-mix), transparent);
    color: var(--match-text);
  }
}

.posters {
  display: grid;
  grid-template-columns: repeat(var(--match-posters), minmax(0, 1fr));
  gap: var(--dialog-art-columns-gap);

  & li {
    aspect-ratio: var(--ratio-poster);
  }

  & a {
    display: block;
    block-size: 100%;

    @media (prefers-reduced-motion: no-preference) {
      transition: transform var(--transition-match-poster);
    }

    &:is(:hover, :focus-visible) {
      transform: translateY(var(--match-poster-lift)) scale(var(--scale-match-poster));
    }
  }

  & :is(img, .blank) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border-radius: var(--radius-object);
    object-fit: cover;
  }
}

.blank {
  overflow: hidden;
  padding: var(--space-xs-inline);
  color: var(--color-card-text);
  font-size: var(--font-size-small);
}

/* One line per sentence. */
.footer {
  display: grid;
  padding: var(--dialog-art-footer-padding);
  border-block-start: 1px solid var(--color-dialog-art-border);
  background-color: var(--color-dialog-art-footer-bg);
  color: var(--color-why-faint);
  font-size: var(--font-size-small);

  & p {
    margin: 0;
  }
}

.mark-note :global(.icon) {
  color: var(--match);
}

@media (prefers-reduced-motion: no-preference) {
  .falls {
    display: block;
  }

  .drop {
    animation: fall var(--fall) linear var(--delay) infinite;
  }
}

@keyframes fall {
  0% {
    opacity: 0;
    transform: translateY(var(--match-fall-start)) rotate(calc(-1 * var(--match-fall-turn)));
  }

  15%,
  80% {
    opacity: var(--opacity-match-fall);
  }

  100% {
    opacity: 0;
    transform: translateY(var(--match-fall-distance)) rotate(var(--match-fall-turn));
  }
}

/* Tablets: smaller avatars. */
@media (width < 768px) {
  .faceoff img {
    inline-size: var(--match-avatar-size-narrow);
    block-size: var(--match-avatar-size-narrow);
  }
}
</style>
