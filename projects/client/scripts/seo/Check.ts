/** One assertion: `group` is its column in the report, `detail` says what was wrong. */
export interface Check {
  group: string;
  label: string;
  pass: boolean;
  detail?: string;
  /** A failure already tracked as an og issue ("#240"): reported, but it doesn't fail the run. */
  known?: string;
}
