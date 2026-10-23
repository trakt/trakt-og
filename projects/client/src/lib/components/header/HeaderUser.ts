/** What the header shows for the signed-in user. The layout maps it from the API user. */
export interface HeaderUser {
  readonly slug: string;
  /** OG shows the first name only. */
  readonly firstName: string;
  readonly avatarUrl: string;
  readonly isVip: boolean;
  /** When the account was made, for the getting-started pill's first 30 days. */
  readonly joinedAt: string | null;
  /** Whether the member set a display name, or the header falls back to their username. */
  readonly named: boolean;
}
