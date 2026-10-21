<!--
  A birthday surprise: each Known For poster's rating heart floats off the page as a balloon on a string, in its
  rating's color, drifting as it rises. Mark the cards it rises from with `data-balloon="<rating color>"` inside `from`.
  It's decorative and never takes the pointer.
    <BalloonHearts from={knownForGrid} ondone={…} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import heart from '$lib/icons/solid/heart.svg?raw';
import type { Attachment } from 'svelte/attachments';

interface Props {
  from: HTMLElement;
  ondone: () => void;
}

const { from, ondone }: Props = $props();

type Balloon = { x: number; y: number; color: string; drift: readonly number[] };
let balloons = $state<Balloon[]>([]);

// Where each card's heart sits: near its bottom right, over the quick-icon bar's rating.
const launch: Attachment<HTMLElement> = () => {
  balloons = [...from.querySelectorAll<HTMLElement>('[data-balloon]')].map((card) => {
    const box = card.getBoundingClientRect();
    return {
      x: box.right - box.width * 0.2,
      y: box.top + box.height * 0.62,
      color: card.dataset.balloon ?? 'var(--rating-10)',
      drift: [Math.random() * 40 - 20, Math.random() * 80 - 40, Math.random() * 120 - 60],
    };
  });
};
</script>

<div class="sky" aria-hidden="true" {@attach launch}>
  {#each balloons as balloon, i (i)}
    <span class="balloon" style:left="{balloon.x}px" style:top="{balloon.y}px" style:color={balloon.color}
      style:--drift-1="{balloon.drift[0]}px" style:--drift-2="{balloon.drift[1]}px" style:--drift-3="{balloon.drift[2]}px"
      style:animation-delay="calc({i} * var(--balloon-stagger))"
      onanimationend={i === balloons.length - 1 ? ondone : undefined}><Icon svg={heart} /><i class="string"></i></span>
  {/each}
</div>

<style>
.sky {
  position: fixed;
  inset: 0;
  z-index: var(--z-easter);
  overflow: hidden;
  pointer-events: none;
}

.balloon {
  position: absolute;
  display: grid;
  justify-items: center;
  font-size: var(--balloon-size);
  translate: -50% -100%;
  filter: drop-shadow(var(--shadow-balloon));
  animation: float var(--balloon-duration) cubic-bezier(0.4, 0, 0.6, 1) both;
}

.string {
  inline-size: 1px;
  block-size: var(--balloon-string);
  background: linear-gradient(var(--color-balloon-string), transparent);
}

@keyframes float {
  0% {
    transform: none;
    opacity: 0;
  }

  8% {
    opacity: 1;
  }

  30% {
    transform: translate(var(--drift-1), -20vh) rotate(-6deg);
  }

  65% {
    transform: translate(var(--drift-2), -55vh) rotate(5deg);
  }

  100% {
    transform: translate(var(--drift-3), -110vh) rotate(-3deg);
    opacity: 0;
  }
}
</style>
