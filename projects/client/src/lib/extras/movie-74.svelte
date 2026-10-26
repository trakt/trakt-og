<!--
  A speedometer over the poster climbs to 88. At 88 a blue-white flash, the page and speedometer vanish and leave two
  fire trails burning across the window, then the page comes back with a second flash. Only the header stays.
  Decorative: it never takes the pointer, and with reduced motion it skips the flashes and the climb and simply fades.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import type { ExtraProps } from './extras.ts';

type Frames = Parameters<Element['animate']>[0];
type Timing = Exclude<Parameters<Element['animate']>[1], number | undefined>;

const { ondone }: ExtraProps = $props();

const TOP_SPEED = 88;
const CLIMB_MS = 1600;
const GONE_MS = 2300;
const RETURN_MS = 800;
const TRAIL_MS = 3400;

const FLASH: Frames = [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }];
const TRAIL: Frames = [
  { transform: 'scaleX(0)', opacity: 1 },
  { transform: 'scaleX(1)', opacity: 1, offset: 0.06 },
  { transform: 'scaleX(1)', opacity: 0.8, offset: 0.18 },
  { transform: 'scaleX(1)', opacity: 1, offset: 0.28 },
  { transform: 'scaleX(1)', opacity: 0.85, offset: 0.45 },
  { transform: 'scaleX(1)', opacity: 0 },
];
const TRAIL_STILL: Frames = [{ opacity: 1 }, { opacity: 0 }];

let speed = $state(0);

const run: Attachment<HTMLElement> = (root) => {
  const reduced = prefersReducedMotion.current;
  const page = document.querySelector('main');
  // It's rendered inside the page it hides, so it moves out first.
  document.body.append(root);
  const flash = root.querySelector('.flash');
  const meter = root.querySelector<HTMLElement>('.meter');
  const poster = document.querySelector('.summary-poster img, .summary-poster .placeholder')?.getBoundingClientRect();
  if (meter && poster && poster.bottom > 0 && poster.top < innerHeight) {
    meter.style.setProperty('--meter-x', `${poster.left + poster.width / 2}px`);
    meter.style.setProperty('--meter-y', `${poster.top + poster.height / 2}px`);
  }
  const trails = root.querySelectorAll('.trail');
  const animations: Animation[] = [];
  const timers: number[] = [];
  let frame = 0;

  const animate = (element: Element | null, keyframes: Frames, options: Timing) => {
    const animation = element?.animate(keyframes, options);
    if (animation) animations.push(animation);
    return animation;
  };
  const after = (ms: number, then: () => void) => timers.push(window.setTimeout(then, ms));

  animate(meter, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
  const climbStart = performance.now();
  const climb = (now: number) => {
    const progress = reduced ? 1 : Math.min(1, (now - climbStart) / CLIMB_MS);
    speed = Math.round(TOP_SPEED * progress * progress);
    if (progress < 1) frame = requestAnimationFrame(climb);
  };
  frame = requestAnimationFrame(climb);

  const hit = reduced ? 400 : CLIMB_MS;
  let gone: Animation | undefined;
  after(hit, () => {
    if (!reduced) animate(flash, FLASH, { duration: 500, easing: 'ease-out' });
    const vanish = { duration: reduced ? 400 : 60, fill: 'forwards' } as const;
    gone = animate(page, [{ opacity: 1 }, { opacity: 0 }], vanish);
    animate(meter, [{ opacity: 1 }, { opacity: 0 }], vanish);
    for (const trail of trails) {
      animate(trail, reduced ? TRAIL_STILL : TRAIL, { duration: TRAIL_MS, easing: 'ease-out', fill: 'forwards' });
    }
  });
  after(hit + GONE_MS, () => {
    gone?.cancel();
    animate(page, [{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 400 : 300, easing: 'ease-out' });
    if (!reduced) animate(flash, FLASH, { duration: 400, easing: 'ease-out' });
  });
  after(hit + GONE_MS + RETURN_MS, ondone);

  return () => {
    cancelAnimationFrame(frame);
    for (const timer of timers) clearTimeout(timer);
    for (const animation of animations) animation.cancel();
    root.remove();
  };
};
</script>

<div class="extra" aria-hidden="true" {@attach run}>
  <div class="trail high"></div>
  <div class="trail low"></div>
  <div class="flash"></div>
  <p class="meter"><b>{speed}</b> MPH</p>
</div>

<style>
.extra {
  --extra-readout: #ff3b30;
  --extra-readout-glow: rgb(255 59 48 / 70%);
  --extra-readout-bg: #0c0d0f;
  --extra-readout-edge: #55585f;
  --extra-readout-label: #c9c9c9;
  --extra-flash-core: #fff;
  --extra-flash-blue: #8fd8ff;
  --extra-flash-haze: rgb(143 216 255 / 25%);
  --extra-fire-edge: rgb(255 80 0 / 0%);
  --extra-fire-outer: #ff5a00;
  --extra-fire-mid: #ffb703;
  --extra-fire-core: #fff3b0;
  --extra-fire-glow: rgb(255 110 0 / 70%);
  --extra-fire-smoke: rgb(255 60 0 / 45%);

  position: fixed;
  inset: 0;
  z-index: var(--z-easter);
  overflow: hidden;
  pointer-events: none;
}

.flash {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(
    circle at 15% 70%,
    var(--extra-flash-core) 0%,
    var(--extra-flash-blue) 18%,
    var(--extra-flash-haze) 45%,
    transparent 70%
  );
}

.trail {
  position: absolute;
  inset-inline: 0;
  block-size: 10px;
  border-radius: 6px;
  opacity: 0;
  transform-origin: left center;
  background: linear-gradient(
    90deg,
    var(--extra-fire-edge) 0%,
    var(--extra-fire-outer) 10%,
    var(--extra-fire-mid) 35%,
    var(--extra-fire-core) 50%,
    var(--extra-fire-mid) 65%,
    var(--extra-fire-outer) 100%
  );
  box-shadow: 0 0 16px 4px var(--extra-fire-glow), 0 -10px 22px var(--extra-fire-smoke);

  &.high {
    inset-block-start: 62%;
  }

  &.low {
    inset-block-start: 70%;
  }
}

.meter {
  position: absolute;
  /* Centered on the poster, or on the window when the poster is scrolled away. */
  inset-block-start: var(--meter-y, 50%);
  inset-inline-start: var(--meter-x, 50%);
  translate: -50% -50%;
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  padding: 6px 12px;
  border: 2px solid var(--extra-readout-edge);
  border-radius: 6px;
  opacity: 0;
  background-color: var(--extra-readout-bg);
  color: var(--extra-readout-label);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--font-weight-headings-heavy);

  b {
    min-inline-size: 2ch;
    color: var(--extra-readout);
    font-size: 36px;
    line-height: 1;
    text-align: end;
    text-shadow: 0 0 10px var(--extra-readout-glow);
    font-variant-numeric: tabular-nums;
  }
}
</style>
