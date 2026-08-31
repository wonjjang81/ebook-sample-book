import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import SampleDetail from '../client/src/pages/SampleDetail';

describe('SampleDetail related product thumbnails', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders product-series thumbnails under the GitHub Pages base path', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });

    const html = renderToStaticMarkup(
      <Router ssrPath="/sample/diamant-pr043-03">
        <SampleDetail />
      </Router>,
    );

    expect(html).toContain('/ebook-sample-book/images/wallpaper/diamant/PR043-01.jpg');
    expect(html).not.toContain('src="/images/wallpaper/diamant/');
  });
});
