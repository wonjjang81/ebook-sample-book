import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MaterialPatternImage } from '../client/src/components/MaterialPatternImage';
import { getProductPatternSrc, setProductImageSnapshotForTests } from '../client/src/hooks/useProductImage';

describe('native-size material patterns', () => {
  afterEach(() => { vi.unstubAllGlobals(); setProductImageSnapshotForTests({}); });
  it('repeats without cover/contain scaling and retains accessible image text', () => {
    const html = renderToStaticMarkup(<MaterialPatternImage src="/texture.jpg" alt="벽지" className="h-96 w-full" />);
    expect(html).toContain('background-repeat:repeat');
    expect(html).toContain('background-size:auto');
    expect(html).toContain('alt="벽지"');
    expect(html).not.toContain('object-cover');
    expect(html).not.toContain('scale-105');
  });
  it('prefers the server original to a resized thumbnail', () => {
    setProductImageSnapshotForTests({ p: { version: 'v', originalUrl: '/original', thumbUrl: '/thumb' } });
    expect(getProductPatternSrc('p', '/default')).toBe('/original');
  });
  it('retains local original and legacy thumbnail-only uploads', () => {
    vi.stubGlobal('localStorage', { getItem: (key: string) => ({ img_orig_p: '/local-original', img_thumb_q: '/legacy-thumb' }[key] ?? null) });
    expect(getProductPatternSrc('p')).toBe('/local-original');
    expect(getProductPatternSrc('q')).toBe('/legacy-thumb');
  });
});
