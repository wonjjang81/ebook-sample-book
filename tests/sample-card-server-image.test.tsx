import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductImagesProvider, setProductImageSnapshotForTests } from '../client/src/hooks/useProductImage';
import { SampleCard } from '../client/src/components/SampleCard';

const sample = {
  id: 'lohas-87493-1',
  productNo: '87493-1',
  name: '로하스 제품',
  brand: '개나리',
  line: '로하스',
  specs: ['실크벽지'],
  image: '/images/default.jpg',
};

describe('제품 목록 서버 이미지', () => {
  afterEach(() => {
    setProductImageSnapshotForTests({});
    vi.unstubAllGlobals();
  });

  it('등록된 서버 썸네일을 기본 이미지보다 우선 표시한다', () => {
    setProductImageSnapshotForTests({
      [sample.id]: {
        version: 'v1',
        thumbUrl: '/api/product-images/lohas-87493-1/v1/thumb',
        originalUrl: '/api/product-images/lohas-87493-1/v1/original',
      },
    });

    const html = renderToStaticMarkup(
      <ProductImagesProvider autoLoad={false}>
        <SampleCard sample={sample} />
      </ProductImagesProvider>,
    );

    expect(html).toContain('/api/product-images/lohas-87493-1/v1/thumb');
    expect(html).not.toContain('/images/default.jpg');
  });
});

