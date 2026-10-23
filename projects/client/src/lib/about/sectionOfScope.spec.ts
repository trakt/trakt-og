import { describe, expect, it } from 'vitest';
import { sectionOfScope } from './sectionOfScope.ts';

describe('sectionOfScope', () => {
  it('should name a scope by the section members know', () => {
    expect(sectionOfScope('users')).toBe('Profiles');
    expect(sectionOfScope('media')).toBe('Titles');
    expect(sectionOfScope('calendars')).toBe('Calendar');
  });

  it('should fold related scopes into one section', () => {
    expect(sectionOfScope('list')).toBe('Lists');
    expect(sectionOfScope('episode')).toBe('Shows');
    expect(sectionOfScope('icons')).toBe('Design');
  });

  it('should file infrastructure and unscoped commits under General', () => {
    expect(sectionOfScope('ci')).toBe('General');
    expect(sectionOfScope('auth')).toBe('General');
    expect(sectionOfScope('')).toBe('General');
  });
});
