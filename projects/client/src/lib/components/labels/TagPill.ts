/**
 * One pill in TagPills: `primary` is the brand red, `light` the pale one, `badge` a bold, clear-filled pill with a
 * brighter outline (a rating certificate), and no kind the dark outlined default. A `lead` goes before the text in
 * bold, like a count pill's number. With `segments`, related tags share one pill split by thin lines (a runtime and
 * an episode count, two genres). A `color` fills the pill with that color instead (an episode's type, in its own
 * color). An `icon` (raw SVG) leads the pill, like GitHub's star and issue counts, and a `tint` colors the icon,
 * outline and fill lightly in that color. With `href` the pill is a link to another site, opened in a new tab. An
 * icon pill can drop its text for a `label` that a screen reader hears instead.
 */
export type TagPill =
  | {
      readonly text: string;
      readonly lead?: string;
      readonly kind?: 'primary' | 'light' | 'badge';
      readonly color?: string;
      readonly icon?: string;
      readonly tint?: string;
      readonly href?: string;
      /** What a screen reader hears, for a pill that's only an icon and a number. */
      readonly label?: string;
    }
  | { readonly segments: readonly string[] };
