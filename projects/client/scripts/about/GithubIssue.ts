/** The fields of a GitHub search result item the about page's repo numbers use. */
export interface GithubIssue {
  readonly number: number;
  readonly title: string;
  readonly labels: ReadonlyArray<{ readonly name: string }>;
  readonly created_at: string;
  readonly closed_at: string | null;
  readonly pull_request?: unknown;
}
