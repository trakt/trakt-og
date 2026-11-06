<!--
  The title gets the opening credits: "Br" and "Ba" turn into periodic-table tiles, green smoke drifts over the fanart
  and faint formulas fade in and out of the sky on either side. Screen readers still read the plain title, and leaving
  the page puts its text back. Reduced motion holds the smoke still and the formulas in place.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';

type Formula = { text: string; x: number; y: number; size: number };

const TITLE = 'Breaking Bad';
const WORDS = [
  { number: 35, symbol: 'Br', weight: '79.904', rest: 'eaking ' },
  { number: 56, symbol: 'Ba', weight: '137.327', rest: 'd' },
];
const FORMULAS = ['C10H15N', '149.24', 'CH3'];
// The dark sky left and right of the faces, in percent of the header: left, top, width and height.
const ZONES = [
  [3, 16, 29, 34],
  [77, 16, 15, 30],
] as const;
const STILL: Formula[] = [
  { text: 'C10H15N', x: 6, y: 24, size: 18 },
  { text: '149.24', x: 80, y: 20, size: 20 },
  { text: 'CH3', x: 14, y: 46, size: 16 },
];
const SMOKE = '90 230 120';

const random = (min: number, max: number) => min + Math.random() * (max - min);
function formula(text: string): Formula {
  const [left, top, width, height] = ZONES[Math.random() < 0.6 ? 0 : 1];
  return { text, x: random(left, left + width), y: random(top, top + height), size: random(16, 23) };
}

let formulas = $state(FORMULAS.map(formula));
const shown = $derived(prefersReducedMotion.current ? STILL : formulas);

const title: Attachment<HTMLElement> = (node) => {
  const heading = document.querySelector('.fanart-header h1');
  const text = [...(heading?.childNodes ?? [])].find(
    (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim() === TITLE,
  );
  if (!text) {
    node.hidden = true;
    return;
  }
  const [before = '', after = ''] = (text.textContent ?? '').split(TITLE);
  text.replaceWith(before, node, after);
  return () => {
    const spaces = [node.previousSibling, node.nextSibling];
    node.replaceWith(text);
    spaces.forEach((space) => space?.nodeType === Node.TEXT_NODE && space.remove());
  };
};

const pin: Attachment<HTMLElement> = (node) => {
  const header = document.querySelector('.fanart-header');
  if (header) header.prepend(node);
  else node.hidden = true;
  return () => node.remove();
};

const smoke: Attachment<HTMLCanvasElement> = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const blobs = Array.from({ length: 22 }, () => ({
    x: random(-0.15, 1.15),
    y: random(0.12, 1),
    radius: random(0.12, 0.26),
    alpha: random(0.07, 0.15),
    speed: random(0.004, 0.012),
    phase: random(0, Math.PI * 2),
  }));
  let scale = 1;
  let width = 0;
  let height = 0;
  let visible = true;
  let frame = 0;

  function draw(now: number) {
    if (!ctx) return;
    const seconds = now / 1000;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const blob of blobs) {
      const x = (((blob.x + blob.speed * seconds + 0.3) % 1.6) - 0.3) * width;
      const y = (blob.y + Math.sin(seconds * 0.15 + blob.phase) * 0.04) * height;
      const radius = blob.radius * width;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgb(${SMOKE} / ${blob.alpha})`);
      glow.addColorStop(1, `rgb(${SMOKE} / 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }

  function layout() {
    scale = Math.min(2, devicePixelRatio);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    draw(prefersReducedMotion.current ? 0 : performance.now());
  }

  function loop(now: number) {
    if (visible && !prefersReducedMotion.current) draw(now);
    frame = requestAnimationFrame(loop);
  }

  const resized = new ResizeObserver(layout);
  resized.observe(canvas);
  const seen = new IntersectionObserver((entries) => (visible = entries.some((entry) => entry.isIntersecting)));
  seen.observe(canvas);
  frame = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(frame);
    resized.disconnect();
    seen.disconnect();
  };
};
</script>

<span class="element-title" {@attach title}>
  <span class="visually-hidden">{TITLE}</span>
  <span aria-hidden="true"
    >{#each WORDS as word (word.symbol)}<span class="tile"
        ><span class="number">{word.number}</span><span class="symbol">{word.symbol}</span><span class="weight"
          >{word.weight}</span
        ></span
      >{word.rest}{/each}</span
  >
</span>

<div class="lab" aria-hidden="true" {@attach pin}>
  <canvas {@attach smoke}></canvas>
  {#each shown as note, index (index)}
    <span
      class="formula"
      style:left="{note.x}%"
      style:top="{note.y}%"
      style:font-size="{note.size}px"
      style:animation-delay="{index * 1.3}s"
      onanimationiteration={() => (formulas[index] = formula(note.text))}
    >{note.text}</span>
  {/each}
</div>

<style>
.element-title {
  --tile-edge: #e8ffee;
  --tile-top: #3bb554;
  --tile-bottom: #1a7a31;
  --tile-glow: rgb(80 220 110 / 45%);
  --tile-text: #fff;
}

/* The tiles hang below the letters, so the heading sits higher off the ratings strip while they're in it. */
:global(.fanart-header h1:has(.element-title)) {
  margin-block-end: calc(var(--line-height-computed) / 2 + 10px);
}

/* Centered on the letters, so the line keeps the text's baseline and the year and certification sit on it. */
.tile {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  inline-size: 1.45em;
  block-size: 1.45em;
  margin-block: -0.25em;
  margin-inline-end: 0.06em;
  border: 2px solid var(--tile-edge);
  border-radius: 4px;
  background: linear-gradient(160deg, var(--tile-top), var(--tile-bottom));
  box-shadow: 0 0 17px var(--tile-glow);
  color: var(--tile-text);
  font-style: normal;
  line-height: 1;
  text-shadow: none;
}

.number {
  position: absolute;
  inset-block-start: 0.12em;
  inset-inline-start: 0.16em;
  font-size: 0.29em;
  font-weight: var(--font-weight-headings);
}

.symbol {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding-block-end: 0.12em;
  font-size: 0.8em;
}

.weight {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0.18em;
  font-size: 0.21em;
  font-weight: var(--font-weight-headings-light);
  text-align: center;
}

.lab {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  mix-blend-mode: screen;
}

.formula {
  --formula: #a6ffb4;
  --formula-glow: rgb(80 220 110 / 70%);
  --formula-shadow: #000;
  position: absolute;
  color: var(--formula);
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-shadow: 0 0 9px var(--formula-glow), 0 1px 2px var(--formula-shadow);
  white-space: nowrap;
  opacity: 0;
  animation: formula 3.9s ease-in-out infinite both;
}

@keyframes formula {
  30%,
  65% {
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .formula {
    opacity: 0.5;
    animation: none;
  }
}
</style>
