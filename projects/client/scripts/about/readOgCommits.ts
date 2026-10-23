import { git } from './git.ts';
import type { LogCommit } from './LogCommit.ts';

// og's first commit on top of the trakt-web history it was forked from. Everything before it isn't og's.
const FIRST_OG_COMMIT = '233a9354eb787abdc5e2457f5a23049cd9bee71b';

const SEPARATOR = '\x1f';

/** og's commits on a ref, newest first, dated by when they landed on main. */
export async function readOgCommits(ref: string): Promise<ReadonlyArray<LogCommit>> {
  const log = await git([
    'log',
    `--format=%H${SEPARATOR}%ae${SEPARATOR}%cI${SEPARATOR}%s`,
    `${FIRST_OG_COMMIT}^..${ref}`,
  ]);
  return log.split('\n').flatMap((line) => {
    const [sha, email, committedAt, subject] = line.split(SEPARATOR);
    return sha && email && committedAt && subject ? [{ sha, email, committedAt, subject }] : [];
  });
}
