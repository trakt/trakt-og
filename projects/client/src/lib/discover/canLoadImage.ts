/** Whether the image at `url` loads and decodes, so a hero never lands on art that's missing. */
export async function canLoadImage(url: string): Promise<boolean> {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return true;
  } catch {
    return false;
  }
}
