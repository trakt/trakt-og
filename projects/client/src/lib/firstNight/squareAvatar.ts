/** The avatar's stored size: square, as Trakt crops it. */
const SIZE = 512;

/**
 * A picked image as a centered square JPEG data URL, the body the avatar endpoint takes. Anything that isn't an
 * image the browser can draw rejects.
 */
export async function squareAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas to crop the avatar on.');
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.9);
}
