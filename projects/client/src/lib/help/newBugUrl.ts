import { ogRepoUrls } from '../about/ogRepoUrls.ts';

/** A new GitHub bug report for a page: the bug label set, and the page link and the questions already in its body. */
export function newBugUrl(page: string): string {
  const url = new URL(ogRepoUrls.newBug);
  url.searchParams.set(
    'body',
    [`**Page:** ${page}`, '**What happened?**', '**What did you expect?**', '**Browser and screen size:**'].join(
      '\n\n',
    ),
  );
  return url.href;
}
