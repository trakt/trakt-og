/** Keys typed further apart than this start a new sequence. */
export const SEQUENCE_GAP_MS = 1000;

type Typed = {
  readonly keys: string;
  readonly at: number;
};

/**
 * The keys typed so far toward `target`, after one more key. A key outside the target, or a pause longer than
 * `gap` (SEQUENCE_GAP_MS unless given), starts over. Only the last `target.length` keys are kept.
 */
export function typedSequence(previous: Typed, key: string, at: number, target: string, gap = SEQUENCE_GAP_MS): Typed {
  if (key.length !== 1 || !target.includes(key)) return { keys: '', at };
  const kept = at - previous.at > gap ? '' : previous.keys;
  return { keys: (kept + key).slice(-target.length), at };
}
