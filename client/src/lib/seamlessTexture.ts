/** Match opposite borders without resizing or changing the central pattern. */
export function blendTextureEdges(pixels: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(pixels);
  const blendPairs = (horizontal: boolean) => {
    const length = horizontal ? width : height;
    const cross = horizontal ? height : width;
    const band = Math.min(24, Math.max(1, Math.floor(length * 0.06)), Math.floor(length / 2));
    for (let distance = 0; distance < band; distance++) {
      const t = band === 1 ? 0 : distance / (band - 1);
      const weight = 0.5 * (1 - t * t * (3 - 2 * t));
      for (let along = 0; along < cross; along++) {
        const a = 4 * (horizontal ? along * width + distance : distance * width + along);
        const b = 4 * (horizontal ? along * width + width - 1 - distance : (height - 1 - distance) * width + along);
        for (let channel = 0; channel < 4; channel++) {
          const first = result[a + channel], last = result[b + channel];
          result[a + channel] = first * (1 - weight) + last * weight;
          result[b + channel] = last * (1 - weight) + first * weight;
        }
      }
    }
  };
  blendPairs(true);
  blendPairs(false);
  return result;
}

/** Display-only copy. On CORS/size failures use the untouched source. */
export function createSeamlessTexture(image: HTMLImageElement): string | null {
  const width = image.naturalWidth, height = image.naturalHeight;
  if (width < 2 || height < 2 || width * height > 4_000_000) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, width, height);
    frame.data.set(blendTextureEdges(frame.data, width, height));
    context.putImageData(frame, 0, 0);
    return canvas.toDataURL('image/png');
  } catch { return null; }
}
