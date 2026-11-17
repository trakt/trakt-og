import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createViewerNote } from './createViewerNote.svelte.ts';
import { fetchPrivateNote } from './fetchPrivateNote.ts';

vi.mock('../auth/viewerFetch.ts', () => ({ viewerFetch: () => fetch }));
vi.mock('./fetchPrivateNote.ts', () => ({ fetchPrivateNote: vi.fn() }));

const note = { id: 8, text: 'Rewatch it', createdAt: null, updatedAt: null };
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.mocked(fetchPrivateNote).mockReset();
});

const track = (params: () => Parameters<typeof createViewerNote>[0] extends () => infer P ? P : never) => {
  let viewer!: ReturnType<typeof createViewerNote>;
  cleanups.push(
    $effect.root(() => {
      viewer = createViewerNote(params);
    }),
  );
  flushSync();
  return viewer;
};

describe('createViewerNote', () => {
  it('should not read anything signed out', () => {
    const viewer = track(() => ({ item: { type: 'movie', id: 1, slug: 'x' }, signedIn: false }));

    expect(viewer.note).toBeNull();
    expect(fetchPrivateNote).not.toHaveBeenCalled();
  });

  it('should read the note with no token of its own, and show it once it lands', async () => {
    vi.mocked(fetchPrivateNote).mockResolvedValue(note);
    const viewer = track(() => ({ item: { type: 'movie', id: 1, slug: 'x' }, signedIn: true }));

    expect(viewer.note).toBeNull();
    await vi.waitFor(() => expect(viewer.note).toEqual(note));
    expect(fetchPrivateNote).toHaveBeenCalledWith(expect.objectContaining({ token: null }));
  });

  it("should not show one item's note on the next", async () => {
    vi.mocked(fetchPrivateNote).mockResolvedValue(note);
    let id = $state(1);
    const viewer = track(() => ({ item: { type: 'show', id, slug: 'x' }, signedIn: true }));
    await vi.waitFor(() => expect(viewer.note).toEqual(note));

    vi.mocked(fetchPrivateNote).mockReturnValue(new Promise(() => {}));
    id = 2;
    flushSync();

    expect(viewer.note).toBeNull();
  });
});
