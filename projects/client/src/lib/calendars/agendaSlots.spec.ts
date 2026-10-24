import { describe, expect, it } from 'vitest';
import { agendaSlots } from './agendaSlots.ts';

describe('agendaSlots', () => {
  it('should group entries that share an air time, in order', () => {
    const entries = [
      { key: 'a', time: '9:00 pm' },
      { key: 'b', time: '9:00 pm' },
      { key: 'c', time: '10:00 pm' },
    ];
    expect(agendaSlots(entries)).toEqual([
      { time: '9:00 pm', entries: [entries[0], entries[1]] },
      { time: '10:00 pm', entries: [entries[2]] },
    ]);
  });

  it("should put a day's movies, which have no time, in one slot", () => {
    const entries = [{ key: 'movie-1' }, { key: 'movie-2' }, { key: 'episode-1', time: '8:00 pm' }];
    expect(agendaSlots(entries)).toEqual([
      { time: undefined, entries: [entries[0], entries[1]] },
      { time: '8:00 pm', entries: [entries[2]] },
    ]);
  });

  it('should start a new slot when a time comes back later in the day', () => {
    const entries = [
      { key: 'a', time: '8:00 pm' },
      { key: 'b', time: '9:00 pm' },
      { key: 'c', time: '8:00 pm' },
    ];
    expect(agendaSlots(entries).map(({ time }) => time)).toEqual(['8:00 pm', '9:00 pm', '8:00 pm']);
  });

  it('should have no slots for an empty day', () => {
    expect(agendaSlots([])).toEqual([]);
  });
});
