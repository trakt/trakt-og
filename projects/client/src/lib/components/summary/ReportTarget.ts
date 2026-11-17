/** What the dialog reports, with its public permalink. */
export interface ReportTarget {
  readonly type: 'user' | 'comment';
  readonly id: number | string;
  /** The dialog's heading: a member's name, or "Comment by" its author. Left blank, it reads "Report comment". */
  readonly title: string;
  readonly href: string;
  /** The header art: a profile's cover. */
  readonly fanart?: string;
}
