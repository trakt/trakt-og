import { describe, expect, it } from 'vitest';
import { commentLanguage } from './commentLanguage.ts';

describe('util: commentLanguage', () => {
  it('should default to English, filtered, with nothing on the link', () => {
    expect(commentLanguage(null)).toEqual({ code: 'en', label: 'English', api: 'en', search: '' });
  });

  it('should filter by a picked language and keep it on the link', () => {
    expect(commentLanguage('pt')).toEqual({ code: 'pt', label: 'Portuguese', api: 'pt', search: 'language=pt' });
  });

  it('should send no filter for All', () => {
    expect(commentLanguage('all')).toMatchObject({ api: undefined, search: 'language=all' });
  });

  it('should fall back to English for a language that is not a choice', () => {
    expect(commentLanguage('xx').code).toBe('en');
  });
});
