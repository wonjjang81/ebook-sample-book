import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_WALLGUARD_SERIES: Record<string, string[]> = {
  W2208: ['1', '2', '3', '4', '5', '6', '7'],
  W2206: ['1', '2'],
  W2205: ['1', '2', '3', '4', '5'],
  W2202: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  W2204: ['1', '2', '3', '4'],
  W2207: ['1', '2', '3', '4'],
  W2203: ['1', '2', '3', '4'],
  W2201: ['1', '2', '3', '4', '5'],
};

describe('Wallguard catalog', () => {
  it('publishes all 42 wallpaper variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '월가드');

    expect(products).toHaveLength(42);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(42);
    expect(products.every((sample) => sample.brand === '신한')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete swatch-code set in the public catalog', () => {
    const expected = Object.entries(EXPECTED_WALLGUARD_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '월가드')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
  });

  it('adds the Shinhan silk and Wallguard path while preserving existing categories', () => {
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
    const wallguard = silk.groups.find((group: { name: string }) => group.name === '월가드');

    expect(shinhan.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(wallguard.lines).toEqual(['샌디먼트', '앤티크월', '소프톤', '믹스톤', '콘크무드', '매트슬랩', '러프트', '하드릭']);
  });

  it('keeps shared product families scoped to Wallguard', () => {
    const wallguard = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '월가드' && sample.line === '믹스톤')!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '아트북')!;

    expect(sampleData.sampleMatchesCatalogSelection(wallguard, { group: '월가드', line: '믹스톤' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '월가드', line: unrelated.line })).toBe(false);
  });
});
