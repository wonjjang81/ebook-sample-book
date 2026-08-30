import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

describe('LOHAS+ catalog', () => {
  it('publishes all 127 catalog variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '로하스+');

    expect(products).toHaveLength(127);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(127);
    expect(products.every((sample) => sample.brand === '개나리')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크벽지')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
    expect(products.some((sample) => sample.productNo === '87450-1')).toBe(true);
    expect(products.some((sample) => sample.productNo.startsWith('87452-'))).toBe(false);
  });

  it('adds the LOHAS+ collection path while preserving existing categories', () => {
    const ensureCatalogCollections = (sampleData as typeof sampleData & {
      ensureCatalogCollections?: (tree: unknown[]) => any[];
    }).ensureCatalogCollections;
    const source = [{
      id: 1,
      name: '도배',
      brands: [{ name: '개나리', materialTypes: [{ name: '실크벽지', groups: [{ name: '기존', lines: ['기존 라인'] }] }] }],
    }];

    const result = ensureCatalogCollections?.(source);
    const silk = result?.[0].brands[0].materialTypes[0];
    const lohas = silk?.groups.find((group: { name: string }) => group.name === '로하스+');

    expect(silk?.groups.some((group: { name: string }) => group.name === '기존')).toBe(true);
    expect(lohas?.lines).toEqual(['플라스터', '위브', '디자인', '페인트', '천장용']);
  });
});
