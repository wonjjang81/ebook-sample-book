import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_FACADE_SERIES: Record<string, string[]> = {
  2023: ['1', '2', '3'],
  2022: ['1', '2', '3', '4'],
  2021: ['1', '2'],
  2020: ['1', '2', '3', '4', '5'],
  2019: ['1', '2', '3', '4'],
  2018: ['1', '2', '3', '4', '5'],
  2017: ['1', '2', '3'],
  2016: ['1', '2', '3', '4'],
  2015: ['1', '2', '3', '4'],
  2014: ['1', '2', '3'],
  2013: ['1', '2'],
  2012: ['1', '2', '3', '4', '5'],
  2011: ['1', '2', '3', '4'],
  2010: ['1', '2', '3'],
  2009: ['1'],
  2008: ['1', '2', '3', '4'],
  2007: ['1', '2', '3', '4'],
  2006: ['1', '2', '3', '4'],
  2005: ['1', '2'],
  2004: ['1', '2', '3', '4'],
  2003: ['1', '2'],
  2002: ['1', '2', '3'],
  2001: ['1', '2'],
};

const EXPECTED_LINES = [
  '마티스 플러스', '샤갈 플러스', '바그너 플러스', '마티스', '티치아노', '샤갈', '라파엘로', '다빈치',
  '아그네스', '테라코타', '베르메르', '바그너', '에드가', '프란츠', '카미유', '루벤스', '고야', '카를',
  '샤르댕', '클로드', '트래버틴', '피사로', '로시니',
];

describe('Facade catalog', () => {
  it('publishes all 77 wallpaper variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '파사드');

    expect(products).toHaveLength(77);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(77);
    expect(products.every((sample) => sample.brand === '신한')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete swatch-code set in the public catalog', () => {
    const expected = Object.entries(EXPECTED_FACADE_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '파사드')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
  });

  it('adds the Shinhan silk and Facade path while preserving existing categories', () => {
    const source = [{
      id: 1,
      name: '도배',
      brands: [
        { name: '개나리', materialTypes: [] },
        { name: '신한', groups: [{ name: '기존', lines: ['기존 라인'] }] },
      ],
    }];

    const result = sampleData.ensureCatalogCollections(source);
    const shinhan = result[0].brands.find((brand: { name: string }) => brand.name === '신한');
    const silk = shinhan.materialTypes.find((item: { name: string }) => item.name === '실크');
    const facade = silk.groups.find((group: { name: string }) => group.name === '파사드');

    expect(shinhan.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(facade.lines).toEqual(EXPECTED_LINES);
  });

  it('keeps shared product families scoped to Facade', () => {
    const facade = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '파사드' && sample.line === '샤갈')!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '월가드')!;

    expect(sampleData.sampleMatchesCatalogSelection(facade, { group: '파사드', line: '샤갈' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '파사드', line: unrelated.line })).toBe(false);
  });

  it('provides catalog details and an image placeholder for manual updates', () => {
    const sample = sampleData.ALL_SAMPLES.find((item) => item.collection === '파사드')!;

    expect(sample.description).toContain('하이엔드 실크벽지');
    expect(sample.detailSections?.map((section) => section.title)).toContain('부직포 원지의 시공 효율');
    expect(sample.sourceLabel).toBe('신한벽지 FACADE 공개 카탈로그');
    expect(sample.image).toBe('');
  });
});
