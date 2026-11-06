<!--
  The fanart header turns into a refinement terminal: a file's progress along the top, a grid of numbers that bob and
  swell under the pointer, and five bins above the title. One cluster of numbers jitters at a time; clicking it, or
  Enter on the focused grid, sends its numbers into the emptiest bin, whose lid opens on its four tempers. Six refines
  fill a file; the first two end in a waffle party and open the next on a click. The last, Cold Harbor, ends with
  elevator doors closing over the terminal and the Lumon logo coming up on them; riding again opens them on the first
  file. Typing "coldharbor" skips to that end. It sits over the shade but under the title and the ratings strip.
  Reduced motion holds the grid still, marks
  the cluster by brightness, and shows the doors without sliding them.
-->
<script lang="ts">
import { page } from '$app/state';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import { pageKey } from './pageKey.ts';
import { typedSequence } from './typedSequence.ts';

type Bin = { units: number; tempers: number[] };
type Flight = { digit: string; x0: number; y0: number; x1: number; y1: number; start: number };

const FILES = ['Siena', 'Dranesville', 'Cold Harbor'];
const TEMPERS = ['WO', 'FC', 'DR', 'MA'];
const BINS = 5;
// A bin holds as many units as refines fill a file, and each refine pours one unit per bin, so the sixth refine tops
// every bin off at once.
const REFINES = 6;
const FLIGHT_MS = 650;
const STAGGER_MS = 35;
const LID_MS = 1400;
const CHEAT = 'coldharbor';

const random = (min: number, max: number) => min + Math.random() * (max - min);
const digit = () => String(Math.floor(random(0, 10)));
const empty = (): Bin[] => Array.from({ length: BINS }, () => ({ units: 0, tempers: TEMPERS.map(() => 0) }));
const percent = (bin: Bin) => Math.round((bin.units / REFINES) * 100);

let file = $state(0);
let bins = $state(empty());
let open = $state<number>();
let finished = $state(false);
let doors = $state<'closing' | 'closed' | 'opening'>();
const progress = $derived(Math.round(bins.reduce((sum, bin) => sum + percent(bin), 0) / BINS));
const refiner = $derived(page.data.user?.firstName || page.data.user?.slug);
const binEls: HTMLElement[] = [];
const timers: number[] = [];
let grid: HTMLCanvasElement | undefined;
let resume: (() => void) | undefined;
let typed = { keys: '', at: 0 };

const later = (ms: number, then: () => void) => timers.push(window.setTimeout(then, ms));
const emptiest = () => {
  const units = bins.map((bin) => bin.units);
  return units.indexOf(Math.min(...units));
};

/** Pours a refine into the emptiest bins and opens the first one's lid for a moment. True once every bin is full. */
function deposit() {
  const first = emptiest();
  for (let pour = BINS; pour > 0; ) {
    const bin = bins[emptiest()];
    if (!bin || bin.units === REFINES) break;
    const take = Math.min(pour, REFINES - bin.units);
    bin.units += take;
    pour -= take;
    bin.tempers = bin.tempers.map(() => (bin.units === REFINES ? 100 : Math.min(100, percent(bin) * random(0.6, 1.1))));
  }
  open = first;
  later(LID_MS, () => {
    if (open === first) open = undefined;
  });
  const done = bins.every(({ units }) => units === REFINES);
  if (done) later(900, () => {
    if (doors) return;
    if (file === FILES.length - 1) doors = 'closing';
    else finished = true;
  });
  return done;
}

/** Typing the last file's name anywhere on the page skips straight to its end. */
function cheat(event: KeyboardEvent) {
  const key = pageKey(event)?.toLowerCase();
  if (!key || doors) return;
  typed = typedSequence(typed, key, event.timeStamp, CHEAT);
  if (typed.keys !== CHEAT) return;
  typed = { keys: '', at: 0 };
  file = FILES.length - 1;
  bins = empty().map((bin) => ({ units: REFINES, tempers: bin.tempers.map(() => 100) }));
  finished = false;
  doors = 'closing';
}

function restart(next: number) {
  file = next;
  bins = empty();
  finished = false;
  resume?.();
}

function nextFile() {
  restart(file + 1);
  grid?.focus();
}

function ondoors() {
  if (doors === 'closing') doors = 'closed';
  else if (doors === 'opening') {
    doors = undefined;
    grid?.focus();
  }
}

function rideAgain() {
  restart(0);
  doors = 'opening';
}

const focus: Attachment<HTMLElement> = (node) => node.focus();

const pin: Attachment<HTMLElement> = (node) => {
  const shade = document.querySelector('.fanart-header .shadow-base');
  if (shade) shade.after(node);
  else node.hidden = true;
  return () => {
    timers.forEach(clearTimeout);
    node.remove();
  };
};

const refinery: Attachment<HTMLCanvasElement> = (canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  grid = canvas;
  let scale = 1;
  let width = 0;
  let height = 0;
  let cell = 0;
  let cols = 0;
  let rows = 0;
  let offsetX = 0;
  let offsetY = 0;
  let color = '';
  let font = '';
  let cells: { digit: string; phase: number; hidden: boolean }[] = [];
  let cluster: number[] = [];
  let flights: Flight[] = [];
  let pointer: { x: number; y: number } | undefined;
  let busy = false;
  let frame = 0;

  const at = (index: number) => ({
    x: offsetX + ((index % cols) + 0.5) * cell,
    y: offsetY + (Math.floor(index / cols) + 0.5) * cell,
  });

  function pickCluster() {
    const col = Math.floor(random(2, cols - 2));
    const row = Math.floor(random(1, rows - 1));
    cluster = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const r = row + dy;
        const c = col + dx;
        const reach = Math.hypot(dx, dy);
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        if (reach <= 1 || (reach <= 2.3 && Math.random() > 0.55)) cluster.push(r * cols + c);
      }
    }
  }

  function layout() {
    scale = Math.min(2, devicePixelRatio);
    width = canvas.width = Math.round(canvas.clientWidth * scale);
    height = canvas.height = Math.round(canvas.clientHeight * scale);
    cell = 34 * scale;
    cols = Math.floor(width / cell);
    rows = Math.floor(height / cell);
    offsetX = (width - cols * cell) / 2;
    offsetY = (height - rows * cell) / 2;
    const style = getComputedStyle(canvas);
    color = style.color;
    font = style.getPropertyValue('--font-mono');
    cells = Array.from({ length: cols * rows }, () => ({ digit: digit(), phase: random(0, 6.28), hidden: false }));
    flights = [];
    if (!busy) pickCluster();
  }

  const onCluster = (x: number, y: number) =>
    !busy && cluster.some((index) => Math.hypot(x - at(index).x, y - at(index).y) < cell * 0.75);

  function refine() {
    const binBox = binEls[emptiest()]?.getBoundingClientRect();
    if (busy || finished || cluster.length === 0 || !binBox) return;
    busy = true;
    const box = canvas.getBoundingClientRect();
    const x1 = (binBox.left + binBox.width / 2 - box.left) * scale;
    const y1 = (binBox.top - box.top) * scale;
    const now = performance.now();
    const members = cluster;
    const still = prefersReducedMotion.current;
    members.forEach((index, order) => {
      const cell = cells[index];
      if (!cell) return;
      const { x, y } = at(index);
      if (!still) flights.push({ digit: cell.digit, x0: x, y0: y, x1, y1, start: now + order * STAGGER_MS });
      cell.hidden = true;
    });
    cluster = [];
    later(still ? 0 : FLIGHT_MS + members.length * STAGGER_MS, () => {
      members.forEach((index) => {
        const cell = cells[index];
        if (cell) Object.assign(cell, { digit: digit(), hidden: false });
      });
      if (deposit()) return;
      later(450, () => {
        pickCluster();
        busy = false;
      });
    });
  }

  resume = () => {
    pickCluster();
    busy = false;
  };

  function paint(time: number) {
    const still = prefersReducedMotion.current;
    ctx!.clearRect(0, 0, width, height);
    ctx!.fillStyle = color;
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    const focusX = pointer?.x ?? (0.55 + 0.25 * Math.sin(time / 5200)) * width;
    const focusY = pointer?.y ?? (0.5 + 0.25 * Math.cos(time / 4300)) * height;
    cells.forEach((each, index) => {
      if (each.hidden) return;
      const { x, y } = at(index);
      const near = Math.max(0, 1 - Math.hypot(x - focusX, y - focusY) / (150 * scale));
      const scary = cluster.includes(index);
      const shake = scary && !still ? 1.8 * scale : 0;
      const bob = still ? 0 : Math.sin(time / 900 + each.phase) * (1 + near * 4) * scale;
      ctx!.globalAlpha = Math.min(1, 0.32 + near * 0.6 + (scary ? (still ? 0.5 : 0.25) : 0));
      ctx!.font = `${(13 + near * 11 + (scary ? 3 : 0)) * scale}px ${font}`;
      ctx!.fillText(
        each.digit,
        x + Math.sin(time / 45 + each.phase * 7) * shake,
        y + bob + Math.cos(time / 38 + each.phase * 5) * shake,
      );
    });
    flights = flights.filter((flight) => {
      const progress = Math.min(1, Math.max(0, (time - flight.start) / FLIGHT_MS));
      const eased = progress * progress * (3 - 2 * progress);
      ctx!.globalAlpha = 1 - progress * 0.4;
      ctx!.font = `${(18 - progress * 8) * scale}px ${font}`;
      ctx!.fillText(
        flight.digit,
        flight.x0 + (flight.x1 - flight.x0) * eased,
        flight.y0 + (flight.y1 - flight.y0) * eased - Math.sin(progress * Math.PI) * 40 * scale,
      );
      return progress < 1;
    });
    ctx!.globalAlpha = 1;
    frame = requestAnimationFrame(paint);
  }

  const point = (event: PointerEvent | MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    return { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale };
  };
  canvas.addEventListener('pointermove', (event) => {
    pointer = point(event);
    canvas.style.cursor = onCluster(pointer.x, pointer.y) ? 'pointer' : '';
  });
  canvas.addEventListener('pointerleave', () => (pointer = undefined));
  canvas.addEventListener('click', (event) => {
    const { x, y } = point(event);
    if (onCluster(x, y)) refine();
  });
  canvas.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    refine();
  });

  const observer = new ResizeObserver(layout);
  observer.observe(canvas);
  frame = requestAnimationFrame(paint);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    resume = undefined;
    grid = undefined;
  };
};
</script>

<svelte:window onkeydown={cheat} />

<div class="refinery" {@attach pin}>
  <div class="bar">
    <span class="file">{FILES[file]}</span>
    <span class="meter"><i style:inline-size="{progress}%"></i></span>
    <span class="progress">{progress}% Complete</span>
    {#if refiner}<span>Refiner {refiner}</span>{/if}
  </div>

  <div class="grid">
    <canvas
      tabindex="0"
      aria-label="Numbers to refine. Press Enter to refine the scary ones."
      {@attach refinery}
    ></canvas>
  </div>

  {#if finished}
    <div class="finish">
      <span class="waffle" aria-hidden="true">{#each { length: 16 }, square (square)}<i></i>{/each}</span>
      <p class="done">{FILES[file]} 100% complete</p>
      <p>Lumon thanks you for your diligent work{refiner ? `, Refiner ${refiner}` : ''}. Enjoy your waffle party.</p>
      <button type="button" onclick={nextFile}>Open the next file</button>
    </div>
  {/if}

  <div class="bins">
    {#each bins as bin, index (index)}
      <div class={['bin', { open: open === index }]} bind:this={binEls[index]}>
        <div class="lid" aria-hidden="true">
          {#each TEMPERS as temper, t (temper)}
            <span class="temper">{temper}<span class="gauge"><i style:inline-size="{bin.tempers[t]}%"></i></span></span>
          {/each}
        </div>
        <span class="number">0{index + 1}</span>
        <span class="fill"><i style:inline-size="{percent(bin)}%"></i><b>{percent(bin)}%</b></span>
      </div>
    {/each}
  </div>

  {#if doors}
    <div class={['doors', doors]}>
      {#each ['left', 'right'] as side (side)}
        <div class={['door', side]} onanimationend={side === 'left' ? ondoors : undefined}>
          <!-- A globe: its rim, two parallels, and meridians that break around the wordmark. -->
          <svg class="logo" viewBox="0 0 260 132" aria-hidden="true">
            <g class="lines">
              <ellipse cx="130" cy="66" rx="127" ry="64"></ellipse>
              <path d="M30.9 26H229.1M30.9 106H229.1"></path>
              <path d="M94.6 40A39 62 0 0 1 165.4 40M93.5 88A39 62 0 0 0 166.5 88"></path>
              <path d="M53.3 40A84.5 62 0 0 1 206.7 40M51 88A84.5 62 0 0 0 209 88"></path>
            </g>
            <path d="M39 51.4h7.3v17.05h22v7.3H39Z"></path>
            <path
              d="M73.9 51.4h7.3v13a4 4 0 0 0 4 4h7.5a4 4 0 0 0 4-4v-13h7.3v15a9.35 9.35 0 0 1-9.35 9.35h-11.4a9.35 9.35 0 0 1-9.35-9.35Z"
            ></path>
            <path
              d="M108.9 75.75V51.4h6.6l12.1 16.6 12.1-16.6h6.6v24.35H139V63l-8.2 12.75h-6.4L116.2 63v12.75Z"
            ></path>
            <path
              fill-rule="evenodd"
              d="M156.2 51.4h16.9a5 5 0 0 1 5 5v14.35a5 5 0 0 1-5 5h-16.9a5 5 0 0 1-5-5V56.4a5 5 0 0 1 5-5ZM164.65 55c1.35 3.5 4.2 7.5 4.2 11.2a4.2 4.2 0 0 1-8.4 0c0-3.7 2.85-7.7 4.2-11.2Z"
            ></path>
            <path d="M183.9 75.75V51.4h7.6l21.6 15.1V51.4h7.3v24.35h-7.6l-21.6-15.15v15.15Z"></path>
          </svg>
        </div>
      {/each}
      {#if doors === 'closed'}
        <div class="sign">
          <p>{FILES[file]} 100% complete.</p>
          <p>Your outie thanks you{refiner ? `, Refiner ${refiner}` : ''}.</p>
          <button type="button" onclick={rideAgain} {@attach focus}>Ride again</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
.refinery {
  --refinery-bg: var(--color-error-scene-lumon);
  --refinery-ink: var(--color-error-scene-lumon-accent);
  --refinery-dim: color-mix(in srgb, var(--refinery-ink) 40%, transparent);
  /* The bar and the bins line up with the page container; the grid runs edge to edge. */
  --refinery-inline: max(calc(var(--gutter) / 2), calc((100% - var(--container-lg)) / 2 + var(--gutter) / 2));

  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas: 'bar' 'grid' 'bins';
  /* Under the fixed site header at the top; at the bottom, clear of the title row and the ratings strip. */
  padding-block: calc(var(--header-height) + 12px) calc(var(--stats-height) + 65px);
  background: var(--refinery-bg);
  color: var(--refinery-ink);
  font-family: var(--font-mono);
  /* The fanart shows for a beat, then the terminal fades in over it. */
  animation: reveal 1.2s ease-in 0.8s both;
}

.bar {
  grid-area: bar;
  display: flex;
  align-items: center;
  gap: 20px;
  padding-block-end: 10px;
  padding-inline: var(--refinery-inline);
  border-block-end: 1px solid var(--refinery-dim);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.file {
  font-size: 16px;
  font-weight: bold;
}

.meter {
  flex: 1;
  block-size: 14px;
  border: 1px solid var(--refinery-ink);

  i {
    display: block;
    block-size: 100%;
    background: var(--refinery-ink);
    transition: inline-size 0.6s;
  }
}

.progress {
  font-variant-numeric: tabular-nums;
}

/* The canvas is laid over its frame, so its pixel size (twice its CSS size on a retina screen) can't grow the row. */
.grid {
  position: relative;
  grid-area: grid;
}

canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  outline: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--refinery-ink);
  }
}

/* Positioned like the grid's frame and after it, so it covers the grid and takes the clicks. */
.finish {
  position: relative;
  grid-area: grid;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  background: color-mix(in srgb, var(--refinery-bg) 92%, transparent);
  text-align: center;

  p {
    margin: 0;
    color: var(--color-error-scene-text);
    font-family: var(--font-body);
    font-size: 16px;
  }

  .done {
    color: var(--refinery-ink);
    font-family: var(--font-mono);
    font-size: 20px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  button {
    padding: 8px 16px;
    border: 1px solid var(--refinery-ink);
    border-radius: var(--radius-control);
    background: none;
    color: var(--refinery-ink);
    font: inherit;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;

    &:is(:hover, :focus-visible) {
      background: var(--refinery-ink);
      color: var(--refinery-bg);
      outline: none;
    }
  }
}

.waffle {
  display: grid;
  grid-template-columns: repeat(4, 12px);
  gap: 3px;
  padding: 7px;
  border-radius: 50%;
  background: #c8913f;
  box-shadow: inset 0 0 0 3px #a5722c;

  i {
    block-size: 12px;
    border-radius: 2px;
    background: #8a5a1c;
  }
}

/* Above the title, on the right, clear of the poster rising in at the left. */
.bins {
  grid-area: bins;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  justify-self: end;
  inline-size: min(100%, 760px);
  margin-inline-end: var(--refinery-inline);
  padding-block-start: 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.bin {
  position: relative;
  display: grid;
  gap: 4px;
}

.number {
  padding-block: 4px;
  line-height: 1;
  border: 1px solid var(--refinery-ink);
  font-weight: bold;
  text-align: center;
}

.fill {
  position: relative;
  block-size: 18px;
  line-height: 1;
  border: 1px solid var(--refinery-ink);

  i {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--refinery-ink);
    transition: inline-size 0.6s;
  }

  b {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-weight: normal;
    mix-blend-mode: difference;
  }
}

.lid {
  position: absolute;
  inset: auto 0 calc(100% + 6px);
  display: grid;
  gap: 3px;
  padding: 8px;
  border: 1px solid var(--refinery-ink);
  background: var(--refinery-bg);
  opacity: 0;
  transform: translateY(8px) scaleY(0.6);
  transform-origin: bottom;
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: none;

  .open & {
    opacity: 1;
    transform: none;
  }
}

.temper {
  display: grid;
  grid-template-columns: 2.4em 1fr;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.gauge {
  block-size: 7px;
  border: 1px solid var(--refinery-dim);

  i {
    display: block;
    block-size: 100%;
    background: var(--refinery-ink);
  }
}

/* Brushed steel doors that meet in the middle; the logo sits across the seam, half on each, so it splits as they open. */
.doors {
  --door-ms: 1s;
  --door-steel: #aeb6b6;
  --door-steel-dark: #6c7676;
  --door-seam: #3a4242;
  --door-ink: #123d4f;
  --door-text: #0a2633;
  --door-paper: #e3e9e9;
  /* The middle of the space between the site header and the title row. */
  --door-middle: calc(50% + (var(--header-height) - var(--stats-height) - 53px) / 2);

  position: absolute;
  inset: 0;
  overflow: hidden;
}

.door {
  position: absolute;
  inset-block: 0;
  inline-size: 50%;
  overflow: hidden;
  background:
    repeating-linear-gradient(90deg, rgb(255 255 255 / 4%) 0 2px, transparent 2px 5px),
    linear-gradient(90deg, var(--door-steel-dark), var(--door-steel) 45%, var(--door-steel-dark));
  box-shadow: inset 0 0 40px rgb(0 0 0 / 35%);
  animation: var(--door-ms) cubic-bezier(0.6, 0, 0.3, 1) forwards;

  &.left {
    inset-inline-start: 0;
    border-inline-end: 1px solid var(--door-seam);
  }

  &.right {
    inset-inline-end: 0;
    border-inline-start: 1px solid var(--door-seam);
  }

  .closing &.left {
    animation-name: close-left;
  }

  .closing &.right {
    animation-name: close-right;
  }

  .opening &.left {
    animation-name: open-left;
  }

  .opening &.right {
    animation-name: open-right;
  }
}

.logo {
  position: absolute;
  inset-block-start: var(--door-middle);
  inline-size: 280px;
  translate: -50% calc(-50% - 24px);

  .left & {
    inset-inline-start: 100%;
  }

  .right & {
    inset-inline-start: 0;
  }

  .closing & {
    opacity: 0;
  }

  .closed & {
    animation: reveal 0.8s ease-out;
  }

  fill: var(--door-ink);

  .lines {
    fill: none;
    stroke: var(--door-ink);
    stroke-width: 2.6;
  }
}

/* Embossed into the steel: dark ink with a light edge under it. Over the bottom shade, so it stays crisp. */
.sign {
  position: absolute;
  inset-inline: 0;
  inset-block-start: calc(var(--door-middle) + 62px);
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 4px;
  color: var(--door-text);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 1px rgb(255 255 255 / 55%);
  animation: reveal 0.8s ease-out;

  p {
    margin: 0;
  }

  button {
    margin-block-start: 12px;
    padding: 9px 18px;
    border: 0;
    border-radius: var(--radius-control);
    background: var(--door-ink);
    color: var(--door-paper);
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.08em;
    text-shadow: none;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color var(--transition-card);

    &:hover {
      background: #000;
    }

    &:focus-visible {
      outline: 2px solid var(--door-ink);
      outline-offset: 2px;
    }
  }
}

/* The summary's shade, over the doors, so the title and year read on the steel. */
.doors::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: calc(var(--stats-height) + 120px);
  background: linear-gradient(to top, rgb(0 0 0 / 80%), transparent);
  content: '';
  pointer-events: none;
}

@keyframes close-left {
  from { translate: -100% 0; }
}

@keyframes close-right {
  from { translate: 100% 0; }
}

@keyframes open-left {
  to { translate: -100% 0; }
}

@keyframes open-right {
  to { translate: 100% 0; }
}

@keyframes reveal {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .meter i,
  .fill i,
  .lid {
    transition: none;
  }

  .refinery {
    animation: none;
  }

  /* Still long enough to end, so the doors move on to their next step. */
  .doors {
    --door-ms: 1ms;
  }
}
</style>
