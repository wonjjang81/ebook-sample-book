import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_LIVING_SERIES: Record<string, string[]> = {
  70302: ['1', '2', '3', '4', '5', '6', '7', '8'],
  70301: ['1', '2', '3', '4', '5', '6'],
  70300: ['1', '2', '3', '4', '5', '6'],
  70299: ['1', '2', '3', '4', '5'],
  70298: ['1', '2', '3', '4'],
  70297: ['1', '2', '3', '4', '5'],
  70296: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  70295: ['1', '2', '3', '4', '5'],
  70293: ['1', '2', '3', '4'],
  70294: ['1', '2', '3', '4', '5'],
  70292: ['1', '2', '3'],
  70291: ['1', '2'],
  70290: ['1', '2'],
  70289: ['1'],
  70288: ['1', '2'],
  70287: ['1'],
  70244: ['1'],
  70277: ['1'],
  70285: ['1'],
  70286: ['1', '2', '3'],
  70283: ['1', '2', '4', '5'],
  70276: ['1', '2'],
  70213: ['10'],
  70274: ['1', '2'],
  70282: ['1', '2', '3'],
  70271: ['1', '2'],
  70245: ['1', '2', '5'],
  70254: ['1', '5', '6'],
  70281: ['1', '2'],
  70272: ['1', '2'],
  70278: ['1', '2', '3'],
  70279: ['1', '2', '5'],
  70280: ['1'],
  70253: ['1'],
  70233: ['1'],
  70243: ['1'],
  70269: ['2'],
  70221: ['2'],
  C8123: ['1', '2'],
  C8052: ['1', '3'],
  C9643: ['11', '10'],
};

describe('Living catalog', () => {
  it('publishes all 116 wallpaper variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '리빙');

    expect(products).toHaveLength(116);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(116);
    expect(products.every((sample) => sample.brand === '신한')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete swatch-code set in the public catalog', () => {
    const expected = Object.entries(EXPECTED_LIVING_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '리빙')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);
  });

  it('adds the Shinhan silk and Living path while preserving existing categories', () => {
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
    const living = silk.groups.find((group: { name: string }) => group.name === '리빙');

    expect(shinhan.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(living.lines).toContain('프라임 스톤');
    expect(living.lines).toContain('캐시미어');
    expect(living.lines).toContain('천장지');
    expect(new Set(living.lines).size).toBe(39);
  });

  it('keeps shared product families scoped to Living', () => {
    const living = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '리빙' && sample.line === '캐시미어')!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '파사드')!;

    expect(sampleData.sampleMatchesCatalogSelection(living, { group: '리빙', line: '캐시미어' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '리빙', line: unrelated.line })).toBe(false);
  });

  it('provides catalog details and manual image placeholders', () => {
    const sample = sampleData.ALL_SAMPLES.find((item) => item.collection === '리빙')!;
    const ceiling = sampleData.ALL_SAMPLES.find((item) => item.collection === '리빙' && item.line === '천장지')!;

    expect(sample.description).toContain('프리미엄 실크벽지');
    expect(sample.detailSections?.map((section) => section.title)).toContain('생활 흔적을 줄이는 손쉬운 관리');
    expect(sample.sourceLabel).toBe('신한벽지 Living 공개 카탈로그');
    expect(ceiling.specs).toContain('천장용');
    expect(sample.image).toBe('');
  });
});
