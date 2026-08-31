import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProductThumb } from '../client/src/hooks/useProductImage';

describe('product image deployment base path', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prefixes catalog thumbnails with the GitHub Pages base path', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });

    expect(getProductThumb('diamant-pr043-03', '/images/wallpaper/diamant/PR043-03.jpg'))
      .toBe('/ebook-sample-book/images/wallpaper/diamant/PR043-03.jpg');
  });

  it('keeps uploaded data thumbnails unchanged', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'data:image/jpeg;base64,uploaded' });

    expect(getProductThumb('diamant-pr043-03', '/images/wallpaper/diamant/PR043-03.jpg'))
      .toBe('data:image/jpeg;base64,uploaded');
  });
});
