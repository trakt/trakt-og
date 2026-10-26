import { describe, expect, it } from 'vitest';
import { withClientId } from './withClientId.ts';

describe('withClientId', () => {
  it('should add the client ID under the example’s lines', () => {
    expect(withClientId('# Standard\nPUBLIC_TRAKT_API=standard\n', 'abc')).toBe(
      '# Standard\nPUBLIC_TRAKT_API=standard\nTRAKT_CLIENT_ID=abc\n',
    );
  });

  it('should replace an earlier client ID instead of adding a second', () => {
    expect(withClientId('TRAKT_CLIENT_ID=old\r\nPUBLIC_TRAKT_API=production\r\n', 'new')).toBe(
      'PUBLIC_TRAKT_API=production\nTRAKT_CLIENT_ID=new\n',
    );
  });

  it('should drop a byte order mark Windows tools write', () => {
    expect(withClientId(`${String.fromCharCode(0xfeff)}PUBLIC_TRAKT_API=standard`, 'abc')).toBe(
      'PUBLIC_TRAKT_API=standard\nTRAKT_CLIENT_ID=abc\n',
    );
  });

  it('should write just the client ID into an empty file', () => {
    expect(withClientId('', 'abc')).toBe('TRAKT_CLIENT_ID=abc\n');
  });
});
