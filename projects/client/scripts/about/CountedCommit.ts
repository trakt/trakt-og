import type { AboutWeek } from './AboutWeek.ts';

/** A `feat`, `fix` or `perf` commit on main, filed under the week it landed in. */
export interface CountedCommit {
  readonly sha: string;
  readonly email: string;
  readonly week: string;
  readonly type: AboutWeek['commits'][number]['type'];
  readonly scope: string;
  readonly subject: string;
}
