import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_WIDE_PAPER_SERIES: Record<string, string[]> = {
  '39394': ['1', '2', '3', '4', '5', '6'], '39393': ['1', '2', '3', '4', '5', '6', '7'],
  '39392': ['1', '2', '3', '4', '5'], '39391': ['1', '2', '3', '4', '5'],
  '39390': ['1', '2', '3', '4'], '39389': ['1', '2', '3'], '39388': ['1', '2'], '39387': ['1'],
  '28352': ['1', '2', '3', '4', '5', '6'], '39374': ['1', '2', '3', '4', '6', '7'],
  '28372': ['1', '2', '3', '4', '5', '6', '7'], '39386': ['1', '2', '3', '4', '5', '6'],
  '39385': ['1', '2', '3', '4'], '39384': ['1'], '39383': ['1', '2', '3', '4', '5'],
  '28371': ['1', '2', '3', '4', '5', '9'], '39369': ['1', '2', '3', '5', '6'],
  '39382': ['1', '2', '3', '4', '5'], '39371': ['1', '2', '3', '4', '6', '7', '8', '9'],
  '39381': ['1', '2'], '39380': ['1'], '39379': ['1', '2'], '39378': ['1', '2'],
  '39377': ['1', '2'], '28336': ['1', '2'], '39372': ['1', '2', '3'], '28348': ['2', '3'],
  '28366': ['1', '2', '3', '4'], '28370': ['1', '2', '5'], '28365': ['1', '2', '3', '5'],
  '28349': ['1', '2', '7'], '28364': ['1', '2', '3', '5', '6'], '28363': ['1', '2', '3', '4'],
  '39376': ['1'], '39375': ['1', '2'], '64023': ['1'], '64022': ['1'], '64014': ['1', '2'],
  '64024': ['1', '2'], '39034': ['1'], '29080': ['1', '2'], '28293': ['1', '2'],
};

describe('wide paper wallpaper catalog', () => {
  it('publishes all 145 Trendy variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '광폭합지');

    expect(products).toHaveLength(145);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(145);
    expect(products.every((sample) => sample.brand === '개나리')).toBe(true);
    expect(products.every((sample) => sample.materialType === '합지')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete wallpaper-code set printed in the catalog', () => {
    const expected = Object.entries(EXPECTED_WIDE_PAPER_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '광폭합지')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
  });

  it('adds the paper material and wide-paper path while preserving existing categories', () => {
    const source = [{
      id: 1,
      name: '도배',
      brands: [{ name: '개나리', materialTypes: [{ name: '실크벽지', groups: [{ name: '기존', lines: ['기존 라인'] }] }] }],
    }];

    const result = sampleData.ensureCatalogCollections(source);
    const gaenari = result[0].brands[0];
    const paper = gaenari.materialTypes.find((item: { name: string }) => item.name === '합지');
    const wide = paper.groups.find((group: { name: string }) => group.name === '광폭합지');

    expect(gaenari.materialTypes.some((item: { name: string }) => item.name === '실크벽지')).toBe(true);
    expect(wide.lines).toEqual(['패브릭', '플라스터·페인트', '디자인', '키즈', '타일패턴', '천장용']);
  });

  it('keeps the selection and detail navigation inside wide paper wallpaper', () => {
    const wideFabric = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '광폭합지' && sample.line === '패브릭')!;
    const artbookFabric = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '아트북' && sample.line === '패브릭')!;

    expect(sampleData.sampleMatchesCatalogSelection(wideFabric, { group: '광폭합지', line: '패브릭' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(artbookFabric, { group: '광폭합지', line: '패브릭' })).toBe(false);

    const linemates = sampleData.getCatalogLinemates(
      wideFabric as sampleData.Sample & { categoryId: number },
      sampleData.ALL_SAMPLES as Array<sampleData.Sample & { categoryId: number }>,
    );
    expect(linemates.length).toBeGreaterThan(1);
    expect(linemates.every((sample) => sample.collection === '광폭합지')).toBe(true);
  });
});
