import type { CountedCommit } from './CountedCommit.ts';
import type { LogCommit } from './LogCommit.ts';
import { mondayOf } from './mondayOf.ts';

const SUBJECT = /^(feat|fix|perf)(?:\(([^)]*)\))?!?: (.+)$/;

/** The `feat`, `fix` and `perf` commits in a log, in its order, each with its week and first scope. */
export function countedCommits(log: ReadonlyArray<LogCommit>): ReadonlyArray<CountedCommit> {
  return log.flatMap((commit) => {
    const match = SUBJECT.exec(commit.subject.trim());
    const type = match?.[1];
    if (type !== 'feat' && type !== 'fix' && type !== 'perf') return [];

    return [{
      sha: commit.sha,
      email: commit.email,
      week: mondayOf(new Date(commit.committedAt)),
      type,
      scope: match?.[2]?.split(',').at(0)?.trim() ?? '',
      subject: match?.[3]?.trim() ?? '',
    }];
  });
}
