/** A run of a day's entries that share an air time. Movies have no time, so a day's movies share one slot. */
export type AgendaSlot<T> = { readonly time?: string; readonly entries: readonly T[] };

/** A day's entries, already in air order, grouped into the agenda's time slots. */
export function agendaSlots<T extends { readonly time?: string }>(entries: readonly T[]): AgendaSlot<T>[] {
  return entries.reduce<AgendaSlot<T>[]>((slots, entry) => {
    const last = slots.at(-1);
    if (!last || last.time !== entry.time) return [...slots, { time: entry.time, entries: [entry] }];
    return [...slots.slice(0, -1), { time: last.time, entries: [...last.entries, entry] }];
  }, []);
}
