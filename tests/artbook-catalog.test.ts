import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_ARTBOOK_SERIES: Record<string, string[]> = {
  '57233': ['1', '2', '3', '4', '5', '6', '7'], '57232': ['1', '2', '3', '4', '5', '6'],
  '57231': ['1', '2', '3', '4', '5', '6', '7'], '57230': ['1', '2', '3', '4', '5', '6'],
  '57229': ['1', '2', '3', '4', '5', '6'], '57228': ['1', '2', '3', '4', '5'],
  '57210': ['1', '2', '3', '6', '7', '8', '9', '10'], '57227': ['1', '2'],
  '57226': ['1', '2', '3', '4', '5', '6'], '57225': ['1', '2', '3', '4'],
  '57224': ['1', '2', '3', '4', '5'], '57223': ['1', '2', '3', '4'],
  '57219': ['1', '2', '3', '4', '5', '6', '7'], '57218': ['1', '2', '3', '4', '5', '6', '7', '8'],
  '57217': ['1', '2', '3', '4', '5', '6', '8'], '57215': ['1', '2', '3', '4'],
  '57206': ['1', '2', '3', '4', '6', '7'], '57205': ['1', '2', '3', '5'],
  '57198': ['1', '3'], '57196': ['1', '2', '3', '6', '9'], '57190': ['1', '2', '3', '5'],
  '57160': ['1', '28', '39', '40'], '57222': ['1'], '57221': ['1'],
  '57220': ['1', '2', '3', '4', '5'],
  '83204': ['2'], '83218': ['3'], '83210': ['1'], '83209': ['2'], '83206': ['1'],
  '54170': ['1', '2'], '54160': ['1', '2'], '54013': ['1', '2'],
};

describe('Artbook catalog', () => {
  it('publishes all 135 wallpaper variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '아트북');

    expect(products).toHaveLength(135);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(135);
    expect(products.every((sample) => sample.brand === '개나리')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크벽지')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
    expect(products.some((sample) => sample.productNo === '57233-1')).toBe(true);
    expect(products.some((sample) => sample.productNo.startsWith('PNST'))).toBe(false);
  });

  it('matches the complete wallpaper-code set printed in the catalog', () => {
    const expected = Object.entries(EXPECTED_ARTBOOK_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '아트북')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
  });

  it('adds the Artbook collection path while preserving existing categories', () => {
    const source = [{
      id: 1,
      name: '도배',
      brands: [{ name: '개나리', materialTypes: [{ name: '실크벽지', groups: [{ name: '기존', lines: ['기존 라인'] }] }] }],
    }];

    const result = sampleData.ensureCatalogCollections(source);
    const silk = result[0].brands[0].materialTypes[0];
    const artbook = silk.groups.find((group: { name: string }) => group.name === '아트북');

    expect(silk.groups.some((group: { name: string }) => group.name === '기존')).toBe(true);
    expect(artbook.lines).toEqual(['패브릭', '플라스터', '페인트', '텍스처', '기능성', '피너츠', '천장용']);
  });

  it('does not mix products from collections that share the same family name', () => {
    const artbookPlaster = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '아트북' && sample.line === '플라스터')!;
    const lohasPlaster = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '로하스+' && sample.line === '플라스터')!;

    expect(sampleData.sampleMatchesCatalogSelection(artbookPlaster, { group: '아트북', line: '플라스터' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(lohasPlaster, { group: '아트북', line: '플라스터' })).toBe(false);
  });
});
