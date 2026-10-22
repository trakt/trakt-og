/** What a network card shows beyond the user: the VIP veteran title and when the follow started. */
export type NetworkExtra = {
  /** The VIP veteran title: "Veteran" or "Legend". */
  readonly veteran: string | null;
  /** The follow's approval date, as the API's ISO timestamp. */
  readonly since: string | null;
};
