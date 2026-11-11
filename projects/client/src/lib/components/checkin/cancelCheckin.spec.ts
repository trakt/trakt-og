import { describe, expect, it, vi } from 'vitest';
import { cancelCheckin } from './cancelCheckin.ts';

const watching = {
  item: { type: 'episode', id: 1234 },
  title: 'Reacher',
  episode: { number: '1x02', title: 'First Dance' },
} as const;

function setup(status: number) {
  return {
    watching,
    remove: vi.fn(() => Promise.resolve(new Response(null, { status }))),
    notify: { success: vi.fn(), error: vi.fn() },
    clear: vi.fn(),
  };
}

describe('cancelCheckin', () => {
  it('should clear what the viewer is watching and name the check-in it cancelled', async () => {
    const params = setup(204);

    expect(await cancelCheckin(params)).toBe(true);
    expect(params.clear).toHaveBeenCalledOnce();
    expect(params.notify.success).toHaveBeenCalledWith('You cancelled your check in for Reacher 1x02 "First Dance".');
  });

  it('should keep it and say so when the cancel fails', async () => {
    const params = setup(500);

    expect(await cancelCheckin(params)).toBe(false);
    expect(params.clear).not.toHaveBeenCalled();
    expect(params.notify.error).toHaveBeenCalledOnce();
  });

  it('should stay quiet when rate limited', async () => {
    const params = setup(429);

    await cancelCheckin(params);
    expect(params.notify.error).not.toHaveBeenCalled();
  });
});
