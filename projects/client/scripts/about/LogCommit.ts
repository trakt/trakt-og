/** One commit on main as `git log` reports it. The email only resolves a GitHub login and is never stored. */
export interface LogCommit {
  readonly sha: string;
  readonly email: string;
  readonly committedAt: string;
  readonly subject: string;
}
