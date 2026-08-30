import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_LOHAS_SERIES: Record<string, string[]> = {
  '87493': ['1', '2', '3', '4', '5'], '87492': ['1', '2', '3', '4', '5', '6'],
  '87491': ['1', '2', '3', '4', '5'], '87490': ['1', '2', '3', '4', '5'],
  '87456': ['1', '2', '3', '4', '5', '7', '8'], '87489': ['1', '2', '3', '4', '5'],
  '87488': ['1', '2', '3', '4'], '87487': ['1', '2', '3', '4'], '87486': ['1', '2', '3', '4', '5'],
  '87483': ['1', '2', '3', '4'], '87481': ['1', '2', '3', '4'], '87480': ['1', '2', '3', '4', '5'],
  '87479': ['1', '2', '3', '4'], '87478': ['1', '2', '3'], '87485': ['1', '2'], '87484': ['1', '2'],
  '87482': ['1', '2', '3'], '87477': ['1', '2'], '87476': ['1', '2', '3', '4', '5'],
  '87475': ['1', '2', '3', '4'], '87474': ['1', '2', '3'], '87472': ['1'], '87471': ['1', '2', '3', '4'],
  '87470': ['1', '2', '3', '4'], '87469': ['1', '2', '3', '4'], '87468': ['1', '2', '3'],
  '87467': ['1', '2', '3', '4'], '87464': ['1', '2'], '87461': ['1', '2', '5'],
  '87460': ['1', '2', '3', '5'], '87457': ['1', '2'], '87451': ['1', '7'], '87450': ['1'],
  '54170': ['1', '2'], '54160': ['1', '2'], '54013': ['1', '2'],
};

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

  it('matches the complete swatch-code set printed in the catalog', () => {
    const expected = Object.entries(EXPECTED_LOHAS_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '로하스+')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
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

  it('does not mix products from collections that share the same family name', () => {
    const sampleMatchesCatalogSelection = (sampleData as typeof sampleData & {
      sampleMatchesCatalogSelection?: (sample: sampleData.Sample, selection: { group?: string; line?: string }) => boolean;
    }).sampleMatchesCatalogSelection;
    const lohasPlaster = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '로하스+' && sample.line === '플라스터');
    const primoPlaster = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '프리모' && sample.line === '플라스터');

    expect(sampleMatchesCatalogSelection?.(lohasPlaster!, { group: '로하스+', line: '플라스터' })).toBe(true);
    expect(sampleMatchesCatalogSelection?.(primoPlaster!, { group: '로하스+', line: '플라스터' })).toBe(false);
  });

  it('keeps detail-page navigation inside the selected collection', () => {
    const getCatalogLinemates = (sampleData as typeof sampleData & {
      getCatalogLinemates?: (sample: sampleData.Sample & { categoryId: number }, samples: Array<sampleData.Sample & { categoryId: number }>) => sampleData.Sample[];
    }).getCatalogLinemates;
    const lohasPlaster = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '로하스+' && sample.line === '플라스터')! as sampleData.Sample & { categoryId: number };

    const linemates = getCatalogLinemates?.(lohasPlaster, sampleData.ALL_SAMPLES as Array<sampleData.Sample & { categoryId: number }>);

    expect(linemates?.length).toBeGreaterThan(1);
    expect(linemates?.every((sample) => sample.collection === '로하스+')).toBe(true);
  });
});
