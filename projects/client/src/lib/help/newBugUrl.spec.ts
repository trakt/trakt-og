import { describe, expect, it } from 'vitest';
import { newBugUrl } from './newBugUrl.ts';

describe('newBugUrl', () => {
  it('should open a bug report on the og repo with the page link in its body', () => {
    const url = new URL(newBugUrl('https://og.trakt.tv/shows/breaking-bad?tab=seasons'));

    expect(`${url.origin}${url.pathname}`).toBe('https://github.com/trakt/trakt-og/issues/new');
    expect(url.searchParams.get('labels')).toBe('bug');
    expect(url.searchParams.get('body')).toMatch(
      /^\*\*Page:\*\* https:\/\/og\.trakt\.tv\/shows\/breaking-bad\?tab=seasons\n/,
    );
  });

  it('should ask what happened, what was expected and where', () => {
    expect(new URL(newBugUrl('https://og.trakt.tv/')).searchParams.get('body')).toContain(
      '**What happened?**\n\n**What did you expect?**\n\n**Browser and screen size:**',
    );
  });
});
