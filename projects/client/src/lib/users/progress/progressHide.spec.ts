import { describe, expect, it } from 'vitest';
import { hideOptionsFor, readProgressHide } from './progressHide.ts';

describe('readProgressHide', () => {
  it('should read the saved toggles and drop unknown ones', () => {
    const search = new URLSearchParams();
    expect(readProgressHide({ cookie: 'ended,bogus,airing', search, type: 'watched' })).toEqual(['ended', 'airing']);
  });

  it('should add Completed while the URL asks for it', () => {
    const search = new URLSearchParams('hide_completed=true');
    expect(readProgressHide({ cookie: 'ended', search, type: 'watched' })).toEqual(['ended', 'completed']);
    expect(readProgressHide({ cookie: 'completed', search, type: 'watched' })).toEqual(['completed']);
  });

  it('should skip Rewatching on the Rewatching tab', () => {
    const search = new URLSearchParams();
    expect(readProgressHide({ cookie: 'rewatching,ended', search, type: 'rewatching' })).toEqual(['ended']);
    expect(hideOptionsFor('rewatching').map(({ id }) => id)).not.toContain('rewatching');
    expect(hideOptionsFor('dropped').map(({ id }) => id)).toContain('rewatching');
  });

  it('should offer only Completed and Not Completed on Franchises', () => {
    const search = new URLSearchParams();
    expect(hideOptionsFor('franchises').map(({ id }) => id)).toEqual(['completed', 'not-completed']);
    expect(readProgressHide({ cookie: 'ended,not-completed,completed', search, type: 'franchises' })).toEqual([
      'not-completed',
      'completed',
    ]);
  });
});
