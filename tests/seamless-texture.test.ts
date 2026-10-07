import { describe, expect, it } from 'vitest';
import { blendTextureEdges } from '../client/src/lib/seamlessTexture';

describe('display-only seamless edge correction', () => {
  it('matches opposite edges including corners and preserves the original buffer and center', () => {
    const w = 40, h = 30;
    const pixels = Uint8ClampedArray.from({ length: w * h * 4 }, (_, i) => i % 251);
    const original = new Uint8ClampedArray(pixels);
    const result = blendTextureEdges(pixels, w, h);
    const pixel = (x: number, y: number) => Array.from(result.slice((y * w + x) * 4, (y * w + x) * 4 + 4));
    for (let y = 0; y < h; y++) expect(pixel(0, y)).toEqual(pixel(w - 1, y));
    for (let x = 0; x < w; x++) expect(pixel(x, 0)).toEqual(pixel(x, h - 1));
    expect(pixel(20, 15)).toEqual(Array.from(original.slice((15 * w + 20) * 4, (15 * w + 20) * 4 + 4)));
    expect(pixels).toEqual(original);
    expect(result.length).toBe(pixels.length);
  });
  it('handles a one-pixel texture without altering it', () => {
    const pixels = new Uint8ClampedArray([12, 34, 56, 255]);
    expect(blendTextureEdges(pixels, 1, 1)).toEqual(pixels);
  });
});
