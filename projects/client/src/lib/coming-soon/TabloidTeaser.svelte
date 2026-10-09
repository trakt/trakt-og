<!--
  "Dead website rises from grave!": the front page of a supermarket tabloid, The Nightly Binge, lying on a desk.
  Newsprint grain, a center fold and aged edges sit over the page in ::before and ::after.
-->
<script lang="ts">
import { fitToParent } from './fitToParent.ts';
import TraktMark from '$lib/components/brand/TraktMark.svelte';

const stories = [
  { headline: 'Local ghost refuses to skip intro', deck: "“It's part of the experience,” it moaned." },
  {
    headline: 'Man finishes nine-season show, immediately starts over',
    deck: 'Family describes him as “at peace, but pale.”',
  },
  {
    headline: 'Classic layout spotted near abandoned server',
    deck: "Witnesses say it's been revamped: same sidebar, sharper fangs. Exclusive pictures on page 13.",
  },
  { headline: "Spoilers: we won't", deck: 'Even the undead have standards.', loud: true },
];

// Bar widths for the price box's barcode, in SVG units.
const barcode = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2];
const bars = barcode.reduce<ReadonlyArray<{ x: number; width: number }>>(
  (placed, width, index) => {
    const last = placed.at(-1);
    const x = last ? last.x + last.width + 1 + (index % 3 === 0 ? 1 : 0) : 0;
    return [...placed, { x, width }];
  },
  [],
);
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&family=Anton&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
  />
</svelte:head>

<main>
  <article {@attach fitToParent}>
    <header>
      <div class="masthead-row">
        <p class="ear">
          <strong>Tonight's forecast</strong>
          100% chance of reruns. Low: the ratings. High: the stakes.
        </p>
        <p class="masthead">The Nightly Binge</p>
        <div class="ear price">
          <p><strong>Late edition</strong> 25¢</p>
          <svg aria-hidden="true" viewBox="0 0 64 24" preserveAspectRatio="none">
            {#each bars as bar, index (index)}
              <rect x={bar.x} y="0" width={bar.width} height="24" />
            {/each}
          </svg>
        </div>
      </div>
      <div class="dateline">
        <span class="flag">World's #1 source for undead websites</span>
        <span>All Hallows' Edition · Vol. XIII · No. 13</span>
        <span>Page A1</span>
      </div>
    </header>

    <div class="spread">
      <div class="lead">
        <h1>Dead website rises from <span class="red">grave!</span></h1>
        <p class="deck">Experts baffled. Watchlists intact.</p>
        <p class="byline">By A. Ghostwriter, Staff Spectre</p>

        <div class="story">
          <figure>
            <svg
              role="img"
              aria-label="Grainy photo of the Trakt logo clawing out of a dirt mound under a full moon, stamped Actual Photo"
              viewBox="0 0 400 250"
            >
              <pattern id="tabloid-dots" width="3" height="3" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.7" fill="#fff" opacity="0.16" />
              </pattern>
              <filter id="tabloid-gray">
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <filter id="tabloid-soft">
                <feGaussianBlur stdDeviation="0.7" />
              </filter>
              <filter id="tabloid-grain" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch" />
                <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 -0.35" />
              </filter>
              <radialGradient id="tabloid-moon">
                <stop offset="0.45" stop-color="#bbb" />
                <stop offset="1" stop-color="#bbb" stop-opacity="0" />
              </radialGradient>
              <g filter="url(#tabloid-soft)">
                <rect width="400" height="250" fill="#262626" />
                <circle cx="320" cy="60" r="60" fill="url(#tabloid-moon)" opacity="0.5" />
                <circle cx="320" cy="60" r="32" fill="#b5b5b5" />
                <g filter="url(#tabloid-gray)"
                  transform="translate(200 128) rotate(-12) scale(1.15) translate(-49.05 -49.05)">
                  <TraktMark face="#ddd" ink="#ed1c24" />
                </g>
                <path d="M0 250 L0 200 C60 196 110 176 170 178 C230 180 290 192 400 210 L400 250Z" fill="#161616" />
                <path
                  d="M136 186 l-10 -26 l8 2 l-2 -14 l8 12 l2 -12 l4 14 l6 -8 l-4 20Z M262 190 l10 -24 l-8 2 l4 -12 l-8 10 l-4 -10 l-2 14 l-6 -6 l4 20Z"
                  fill="#7a7a7a"
                />
              </g>
              <rect width="400" height="250" fill="url(#tabloid-dots)" />
              <rect width="400" height="250" filter="url(#tabloid-grain)" opacity="0.35" />
              <g transform="rotate(-10 80 50)">
                <rect x="20" y="30" width="130" height="38" fill="none" stroke="#ed1c24" stroke-width="4" />
                <text
                  x="85"
                  y="57"
                  text-anchor="middle"
                  textLength="112"
                  lengthAdjust="spacingAndGlyphs"
                  class="stamp"
                  font-size="20"
                  fill="#ed1c24"
                >ACTUAL PHOTO</text>
              </g>
            </svg>
            <figcaption>
              The site emerging overnight, “looking exactly how we remembered,” witnesses say.
              <span class="credit">Photo: anonymous séance attendee</span>
            </figcaption>
          </figure>

          <div class="body">
            <p>
              <strong>THE ARCHIVE —</strong> Witnesses report the classic Trakt clawing its way out of the archive late
              last night, still remembering every episode they ever watched. “It knew I never finished season four,” said
              one shaken viewer. “It didn't judge. It just tracked.”
            </p>
            <p>
              Authorities urge calm and say the site is <em>not dead, just resting</em>. Neighbors described a faint glow
              from an abandoned server room, followed by the unmistakable sound of a sidebar loading.
            </p>
            <p>
              “I checked in to a show I hadn't touched in years,” said a second witness, who asked not to be named for
              fear of spoilers. “It remembered my rating. It remembered everything.”
            </p>
            <p>
              Experts would not say when the site will fully rise. “Soon,” one told this paper, before vanishing into the
              fog.
            </p>
            <p class="jump">Continued on page 13 ▸</p>
          </div>
        </div>
      </div>

      <aside>
        <p class="inside">Also inside</p>
        {#each stories as story (story.headline)}
          <section>
            <h2 class:red={story.loud}>{story.headline}</h2>
            <p>{story.deck}</p>
          </section>
        {/each}
      </aside>
    </div>

    <p class="banner">OG Reanimated · Coming soon · Story still developing</p>
  </article>
</main>

<style>
:global(html) {
  color-scheme: light;
}

:global(body) {
  margin: 0;
  background: var(--tabloid-desk-base);
}

main {
  block-size: 100dvh;
  box-sizing: border-box;
  padding: var(--tabloid-padding);
  overflow: hidden;
  display: grid;
  place-items: safe center;
  font-family: var(--font-tabloid-body);
  color: var(--tabloid-ink);
  background: var(--tabloid-desk);

  & p {
    margin: 0;
  }
}

article {
  position: relative;
  inline-size: 100%;
  min-block-size: 100%;
  transform-origin: top center;
  max-inline-size: var(--tabloid-max);
  margin-inline: auto;
  box-sizing: border-box;
  padding: var(--tabloid-paper-padding);
  background: var(--tabloid-paper);
  box-shadow: var(--tabloid-shadow);
  transform: rotate(var(--tabloid-tilt));
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-gap);

  /* Newsprint grain, the center fold and yellowed edges, multiplied into the ink like the real thing. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--tabloid-fold), var(--tabloid-age), var(--tabloid-noise);
    background-size: auto, auto, var(--tabloid-noise-size) var(--tabloid-noise-size);
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* Light from the upper left, catching the top of the fold. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--tabloid-light);
    mix-blend-mode: soft-light;
    pointer-events: none;
  }
}

header {
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-header-gap);
}

.masthead-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tabloid-column-gap);
}

.ear {
  flex: 0 1 var(--tabloid-ear);
  padding: var(--tabloid-ear-padding);
  border: 1px solid var(--tabloid-ink);
  font-size: var(--font-size-tabloid-ear);
  line-height: 1.35;

  & strong {
    display: block;
    font-family: var(--font-tabloid-headline);
    font-weight: 400;
    font-size: var(--font-size-tabloid-ear-title);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
}

.price {
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-caption-gap);
  text-align: center;

  & p strong {
    display: inline;
  }

  & svg {
    display: block;
    block-size: var(--tabloid-barcode-height);
    fill: var(--tabloid-ink);
  }
}

.masthead {
  flex: 1;
  text-align: center;
  font-family: var(--font-tabloid-masthead);
  font-weight: 700;
  font-size: var(--font-size-tabloid-masthead);
  line-height: 1;
}

.dateline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--tabloid-header-gap);
  padding-block: var(--tabloid-dateline-padding);
  border-block: 3px double var(--tabloid-ink);
  font-family: var(--font-tabloid-headline);
  font-size: var(--font-size-tabloid-dateline);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.flag {
  padding: var(--tabloid-flag-padding);
  background: var(--brand-primary);
  color: var(--tabloid-paper-ink);
}

.spread {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--tabloid-column-gap);
}

.lead {
  flex: 999 1 var(--tabloid-lead-basis);
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-gap);
}

h1 {
  margin: 0;
  font-family: var(--font-tabloid-headline);
  font-weight: 400;
  font-size: var(--font-size-tabloid-headline);
  line-height: 0.9;
  text-transform: uppercase;
}

.red {
  color: var(--brand-primary);
}

.deck {
  font-family: var(--font-tabloid-headline);
  font-size: var(--font-size-tabloid-deck);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.byline {
  font-size: var(--font-size-tabloid-byline);
  font-style: italic;
}

.story {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--tabloid-story-gap);
}

figure {
  margin: 0;
  flex: 1 1 var(--tabloid-photo-basis);
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-caption-gap);

  & svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    border: 1px solid var(--tabloid-ink);
  }
}

/* textLength holds the stamp to its box even while Anton loads or if it never does. */
.stamp {
  font-family: var(--font-tabloid-headline);
}

figcaption {
  font-size: var(--font-size-tabloid-caption);
  font-style: italic;
  line-height: 1.4;
}

.credit {
  display: block;
  font-family: var(--font-tabloid-headline);
  font-style: normal;
  font-size: var(--font-size-tabloid-credit);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: end;
}

.body {
  flex: 1 1 var(--tabloid-body-basis);
  min-inline-size: 0;
  columns: 2;
  column-gap: var(--tabloid-story-gap);
  column-rule: 1px solid var(--tabloid-rule);
  font-size: var(--font-size-tabloid-body);
  line-height: 1.55;
  text-align: justify;
  hyphens: auto;

  & p + p {
    margin-block-start: var(--tabloid-caption-gap);
    text-indent: 1.2em;
  }

  & p:first-child::first-letter {
    float: inline-start;
    margin-inline-end: 4px;
    font-family: var(--font-tabloid-headline);
    font-size: 3.4em;
    line-height: 0.85;
  }
}

.jump {
  font-family: var(--font-tabloid-headline);
  font-size: var(--font-size-tabloid-credit);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: end;
}

aside {
  flex: 1 1 var(--tabloid-aside-basis);
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--tabloid-gap);
  padding-inline-start: var(--tabloid-story-gap);
  border-inline-start: 1px solid var(--tabloid-ink);

  /* base.css paints sections as surfaces; on newsprint they're just stories. */
  & section {
    padding-block-end: var(--tabloid-section-padding);
    border-block-end: 1px solid var(--tabloid-rule);
    background: none;

    &:last-child {
      border: none;
    }
  }

  & h2 {
    margin: 0;
    font-family: var(--font-tabloid-headline);
    font-weight: 400;
    font-size: var(--font-size-tabloid-story);
    line-height: 1.05;
    text-transform: uppercase;
  }

  & section p {
    margin-block-start: var(--tabloid-caption-gap);
    font-size: var(--font-size-tabloid-deck-small);
    line-height: 1.5;
  }
}

.inside {
  align-self: flex-start;
  padding: var(--tabloid-flag-padding);
  background: var(--tabloid-ink);
  color: var(--tabloid-paper-ink);
  font-family: var(--font-tabloid-headline);
  font-size: var(--font-size-tabloid-inside);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.banner {
  padding: var(--tabloid-banner-padding);
  background: var(--brand-primary);
  color: var(--tabloid-paper-ink);
  text-align: center;
  font-family: var(--font-tabloid-headline);
  font-size: var(--font-size-tabloid-banner);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
</style>
