/** A line under a tooltip's stat: "203 plays" with its "3d 2h 56m" gray and italic, after a dash in `color`. */
export type TooltipLine = Readonly<{
  text: string;
  /** The secondary stat, gray and italic after the text. */
  detail?: string;
  /** A CSS color for the dash in front, like `var(--color-progress-tip-watched)`. Left out, there's no dash. */
  color?: string;
  muted?: boolean;
}>;
