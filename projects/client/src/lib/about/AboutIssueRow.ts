/** One open or closed issue from GitHub, its first label and the day it opened or closed. */
export type AboutIssueRow = {
  readonly number: number;
  readonly title: string;
  readonly label: string | null;
  readonly at: string;
};
