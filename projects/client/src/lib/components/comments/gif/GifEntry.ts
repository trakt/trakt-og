type GifSource = { readonly url: string; readonly width: number; readonly height: number };

/** A Klipy GIF in the picker: the small one for the grid, the medium one a comment posts, a still for reduced motion. */
export type GifEntry = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly preview: GifSource;
  readonly full: GifSource;
  readonly still?: GifSource | null;
};
