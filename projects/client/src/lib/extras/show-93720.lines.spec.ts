import { describe, expect, it } from 'vitest';
import { terminalLines } from './show-93720.lines.ts';

const answer = (lines: ReturnType<typeof terminalLines>, index: number) => lines[index]?.text;

describe('terminalLines', () => {
  it('should name a guest and ask them to sign in', () => {
    const lines = terminalLines({ watched: 0, total: 45 });
    expect(answer(lines, 1)).toBe('guest');
    expect(answer(lines, 3)).toBe('sign in and we keep count. we always keep count.');
  });

  it('should count what is left for someone partway through', () => {
    expect(answer(terminalLines({ viewer: 'elliot', watched: 30, total: 45 }), 3)).toBe(
      "30 of 45 episodes. 15 to go. we're watching too.",
    );
  });

  it('should notice someone who finished', () => {
    const lines = terminalLines({ viewer: 'elliot', watched: 45, total: 45 });
    expect(answer(lines, 1)).toBe('elliot');
    expect(answer(lines, 3)).toBe('45 of 45 episodes. you finished. we noticed.');
  });

  it('should wait for someone who has not started', () => {
    expect(answer(terminalLines({ viewer: 'elliot', watched: 0, total: 45 }), 3)).toBe(
      "0 of 45 episodes. you haven't started. we can wait.",
    );
  });

  it('should alternate commands and answers', () => {
    expect(terminalLines({ watched: 0, total: 45 }).map(({ typed }) => typed)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
  });
});
