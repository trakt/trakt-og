<!--
  How far a comment is from the API's word minimum: a ring that fills as words come in, and "3/5 words". Both turn
  green once it's met, and the count drops the minimum. The textarea points at it, so screen readers hear the rule.
-->
<script lang="ts">
interface Props {
  id: string;
  words: number;
  min: number;
}

const { id, words, min }: Props = $props();
const met = $derived(words >= min);
</script>

<span class={['meter', { met }]} {id}>
  <span class="ring" style:--filled="{Math.min(words / min, 1) * 100}%" aria-hidden="true"></span>
  <span class="count">{met ? words : `${words}/${min}`} {words === 1 && met ? 'word' : 'words'}</span>
</span>

<style>
.meter {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-meter-gap);
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ring {
  --short: var(--color-comment-meter-short);
  flex: none;
  inline-size: var(--comment-meter-ring);
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(var(--short) var(--filled), var(--color-comment-rail) 0);
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - var(--comment-meter-ring-thickness)),
    #000 calc(100% - var(--comment-meter-ring-thickness))
  );
}

.met {
  color: var(--color-comment-meter-met);

  & .ring {
    --short: var(--color-comment-meter-met);
  }
}
</style>
