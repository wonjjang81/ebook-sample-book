import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SampleCard } from '../client/src/components/SampleCard';

function installStorage(entries: Record<string, string>) {
  const values = new Map(Object.entries(entries));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
}

const sample = {
  id: 'iris-6892-1',
  productNo: '6892-1',
  name: '아이리스 코르델 6892-1',
  brand: '신한',
  line: '코르델',
  specs: ['친환경 광폭합지'],
  image: '',
};

describe('SampleCard uploaded thumbnail', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the uploaded thumbnail when the catalog image is empty', () => {
    installStorage({ [`img_thumb_${sample.id}`]: 'data:image/jpeg;base64,uploaded-thumb' });

    const html = renderToStaticMarkup(<SampleCard sample={sample} />);

    expect(html).toContain('data:image/jpeg;base64,uploaded-thumb');
    expect(html).not.toContain('이미지 없음');
  });

  it('falls back to the catalog image when no uploaded thumbnail exists', () => {
    installStorage({});

    const html = renderToStaticMarkup(
      <SampleCard sample={{ ...sample, image: '/images/catalog-default.jpg' }} />,
    );

    expect(html).toContain('/images/catalog-default.jpg');
  });
});
