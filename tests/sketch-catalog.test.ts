import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_SKETCH_SERIES: Record<string, string[]> = {
  15132: ['1', '2', '3', '4', '5', '6'],
  15131: ['1', '2', '3', '4', '5', '6', '7', '8'],
  15130: ['1', '2', '3', '4', '5', '6', '7', '8'],
  15123: ['1', '2', '3', '4', '5', '6'],
  15128: ['1', '2', '3', '4', '5', '6', '7', '8'],
  15127: ['1', '2', '3', '4', '5', '6', '7'],
  15126: ['1', '2', '3', '4', '5', '6', '7'],
  15125: ['1', '2', '3', '4'],
  15124: ['1', '2', '3', '4', '5'],
  15129: ['1', '2', '3', '4', '5', '6'],
  15122: ['1', '2', '3', '4', '5', '6'],
  15121: ['1', '2', '3', '4'],
  15120: ['1', '2', '3'],
  15112: ['1', '2', '3'],
  15111: ['1', '2'],
  15118: ['1', '2', '3'],
  15105: ['1', '2', '3'],
  15116: ['1', '2', '3', '4', '7'],
  15113: ['1', '2', '3'],
  15117: ['1', '2', '3'],
  15119: ['1', '2', '3', '5'],
  15110: ['1', '2', '3'],
  15114: ['1', '2', '6', '7'],
  15053: ['1'],
  15115: ['1'],
  15106: ['1', '2'],
  C9643: ['10', '11', '20'],
  C8052: ['1', '3'],
};

const EXPECTED_SKETCH_FAMILIES: Record<string, string> = {
  15132: '크랙스톤', 15131: '섬세한 직물', 15130: '매트 피니시', 15123: '부드러운 촉감',
  15128: '패널스톤', 15127: '컬러블룸', 15126: '딥스톤', 15125: '러프 쉐이드',
  15124: '색다른 느낌', 15129: '도톰한 코튼', 15122: '화려한 시선', 15121: '스페셜 페인트',
  15120: '아트 테라조', 15112: '핸디코트', 15111: '모래알 터치', 15118: '규조토 샌드',
  15105: '그날의 약속', 15116: '고요의 정원', 15113: '한가로운 오후', 15117: '일상의 온기',
  15119: '소중한 시간', 15110: '아침햇살', 15114: '나만의 휴식', 15053: '조용한 사색',
  15115: '모던 클레이', 15106: '즐거운 소식', C9643: '천장지', C8052: '천장지',
};

describe('Sketch catalog', () => {
  it('publishes all 120 wallpaper variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '스케치');

    expect(products).toHaveLength(120);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(120);
    expect(new Set(products.map((sample) => sample.id)).size).toBe(120);
    expect(products.every((sample) => sample.id === `sketch-${sample.productNo.toLowerCase()}`)).toBe(true);
    expect(products.every((sample) => sample.brand === '신한')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete swatch-code set in the public catalog', () => {
    const expected = Object.entries(EXPECTED_SKETCH_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const actual = sampleData.ALL_SAMPLES
      .filter((sample) => sample.collection === '스케치')
      .map((sample) => sample.productNo)
      .sort();

    expect(actual).toEqual(expected);

    for (const sample of sampleData.ALL_SAMPLES.filter((item) => item.collection === '스케치')) {
      const series = sample.productNo.split('-')[0];
      expect(sample.line).toBe(EXPECTED_SKETCH_FAMILIES[series]);
    }
  });

  it('adds the Shinhan silk and Sketch path while preserving existing categories', () => {
    const untouchedCategory = { id: 2, name: '타일', brands: [{ name: '기존 타일', groups: [] }] };
    const source = [
      {
        id: 1,
        name: '도배',
        brands: [{ name: '신한', groups: [{ name: '기존', lines: ['기존 라인'] }] }],
      },
      untouchedCategory,
    ];

    const result = sampleData.ensureCatalogCollections(source);
    const shinhan = result[0].brands.find((brand: { name: string }) => brand.name === '신한');
    const silk = shinhan.materialTypes.find((item: { name: string }) => item.name === '실크');
    const sketch = silk.groups.find((group: { name: string }) => group.name === '스케치');

    expect(shinhan.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(result[1]).toEqual(untouchedCategory);
    expect(sketch.lines).toContain('크랙스톤');
    expect(sketch.lines).toContain('스페셜 페인트');
    expect(sketch.lines).toContain('천장지');
    expect(new Set(sketch.lines).size).toBe(27);
  });

  it('keeps shared product families scoped to Sketch', () => {
    const sketch = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '스케치' && sample.line === '패널스톤')!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection === '리빙')!;

    expect(sampleData.sampleMatchesCatalogSelection(sketch, { group: '스케치', line: '패널스톤' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '스케치', line: unrelated.line })).toBe(false);
  });

  it('provides catalog details and manual image placeholders', () => {
    const sample = sampleData.ALL_SAMPLES.find((item) => item.collection === '스케치')!;
    const ceiling = sampleData.ALL_SAMPLES.find((item) => item.collection === '스케치' && item.line === '천장지')!;

    expect(sample.description).toContain('감각적인 실크벽지');
    expect(sample.detailSections?.map((section) => section.title)).toContain('다채로운 컬러와 디자인');
    expect(sample.sourceLabel).toBe('신한벽지 SKETCH all new 공개 카탈로그');
    expect(ceiling.specs).toContain('천장용');
    expect(sample.image).toBe('');
  });
});
