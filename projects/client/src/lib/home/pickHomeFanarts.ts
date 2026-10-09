interface PickHomeFanartsParams<T> {
  pool: readonly T[];
  count: number;
  /** `Math.random`, or a fixed sequence in tests. */
  random: () => number;
}

/** `count` items from `pool` in a random order, without repeats: the first steps of a Fisher-Yates shuffle. */
export function pickHomeFanarts<T>({ pool, count, random }: PickHomeFanartsParams<T>): T[] {
  const picks = Math.min(count, pool.length);
  const shuffled = Array.from({ length: picks }).reduce<T[]>((deck, _, index) => {
    const swap = index + Math.floor(random() * (deck.length - index));
    const picked = deck.at(swap);
    const current = deck.at(index);
    if (picked === undefined || current === undefined) return deck;
    return deck.with(index, picked).with(swap, current);
  }, [...pool]);
  return shuffled.slice(0, picks);
}
