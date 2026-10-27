/** A visit through a shared link: the sharer's code and the page it opened. */
export interface ShareClick {
  readonly code: string;
  readonly url: string;
}
