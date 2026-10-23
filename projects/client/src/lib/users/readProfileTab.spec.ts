import { describe, expect, it } from 'vitest';
import { readProfileTab } from './readProfileTab.ts';

const frameOf = (profile: { isPrivate: boolean; isLocked: boolean }) => ({ profile, isSelf: false });
const PUBLIC = frameOf({ isPrivate: false, isLocked: false });
const VISIBLE = frameOf({ isPrivate: true, isLocked: false });
const LOCKED = frameOf({ isPrivate: true, isLocked: true });

type Read = { token: string | null; framed: boolean };

/** A tab that records each read's token and whether it knew the frame. */
function tab() {
  const reads: Read[] = [];
  const read = ({ token, frame }: { token: string | null; frame?: unknown }) => {
    reads.push({ token, framed: frame !== undefined });
    return Promise.resolve(token ?? 'anonymous');
  };
  return { reads, read };
}

const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value)));

describe('util: readProfileTab', () => {
  describe('before the frame lands', () => {
    it('should read a public profile once, without the token, alongside the frame', async () => {
      const { reads, read } = tab();
      const pending = readProfileTab({ fetch, token: 'abc', frame: later(PUBLIC), read });
      expect(reads.map(({ token }) => token)).toEqual([null]);
      expect(await pending).toEqual({ frame: PUBLIC, result: 'anonymous' });
      expect(reads).toEqual([{ token: null, framed: false }]);
    });

    it('should cancel the anonymous read of a private profile the viewer may see and use the token', async () => {
      const signals: (AbortSignal | null | undefined)[] = [];
      const reads: (string | null)[] = [];
      const fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
        signals.push(init?.signal);
        return later(new Response());
      };
      const result = await readProfileTab({
        fetch,
        token: 'abc',
        frame: later(VISIBLE),
        read: async ({ fetch: send, token }) => {
          reads.push(token);
          await send('https://apiz.trakt.tv/users/tester/history');
          return token ?? 'anonymous';
        },
      });
      expect(result).toEqual({ frame: VISIBLE, result: 'abc' });
      expect(reads).toEqual([null, 'abc']);
      expect(signals.at(0)?.aborted).toBe(true);
      expect(signals.at(1)).toBeUndefined();
    });

    it('should cancel the anonymous read of a locked profile and read nothing else', async () => {
      const signals: (AbortSignal | null | undefined)[] = [];
      const fetch = (_input: RequestInfo | URL, init?: RequestInit) => {
        signals.push(init?.signal);
        return later(new Response());
      };
      const read = async ({ fetch: send }: { fetch: typeof globalThis.fetch }) => {
        await send('https://apiz.trakt.tv/users/tester/history');
        throw new Error('cancelled');
      };
      expect(await readProfileTab({ fetch, token: 'abc', frame: later(LOCKED), read })).toEqual({
        frame: LOCKED,
        result: null,
      });
      expect(signals).toHaveLength(1);
      expect(signals.at(0)?.aborted).toBe(true);
    });

    it('should fail with the anonymous read when a public profile uses it', async () => {
      const read = () => Promise.reject(new Error('down'));
      await expect(readProfileTab({ fetch, token: null, frame: later(PUBLIC), read })).rejects.toThrow('down');
    });
  });

  describe('with the frame already loaded', () => {
    it('should read a public profile once without the token', async () => {
      const { reads, read } = tab();
      expect(await readProfileTab({ fetch, token: 'abc', frame: PUBLIC, read })).toEqual({
        frame: PUBLIC,
        result: 'anonymous',
      });
      expect(reads).toEqual([{ token: null, framed: true }]);
    });

    it('should read a private profile the viewer may see once with the token', async () => {
      const { reads, read } = tab();
      expect((await readProfileTab({ fetch, token: 'abc', frame: VISIBLE, read })).result).toBe('abc');
      expect(reads.map(({ token }) => token)).toEqual(['abc']);
    });

    it('should read nothing for a locked profile', async () => {
      const { reads, read } = tab();
      expect((await readProfileTab({ fetch, token: 'abc', frame: LOCKED, read })).result).toBeNull();
      expect(reads).toEqual([]);
    });
  });
});
