/** A link out from a summary's sidebar: text ("IMDB") or, with `icon`, an icon named by `label` (JustWatch). */
export interface ExternalLink {
  readonly label: string;
  readonly href: string;
  /** Raw SVG from `$lib/icons`. */
  readonly icon?: string;
  /** The tooltip, when it differs from the label ("@handle"). */
  readonly title?: string;
  /** The logo's color under the pointer, as a CSS color: the site's brand color. */
  readonly color?: string;
}
