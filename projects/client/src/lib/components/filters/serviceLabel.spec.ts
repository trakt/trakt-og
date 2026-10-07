import { describe, expect, it } from 'vitest';
import { serviceLabel } from './serviceLabel.ts';

describe('util: serviceLabel', () => {
  it('should keep a name with no store suffix as it is', () => {
    expect(serviceLabel('Netflix')).toEqual({ label: 'Netflix' });
  });

  it('should move a store suffix into a tag', () => {
    expect(serviceLabel('Paramount+ (on Amazon)')).toEqual({ label: 'Paramount+', tag: 'Amazon' });
    expect(serviceLabel('Pluto TV (free)')).toEqual({ label: 'Pluto TV', tag: 'Free' });
  });

  it('should match the suffix in any case', () => {
    expect(serviceLabel('Starz (On Apple TV)')).toEqual({ label: 'Starz', tag: 'Apple TV' });
  });
});
