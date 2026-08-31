import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_IRIS_SERIES: Record<string, string[]> = {
  6892: ['1', '2', '3', '4', '5', '6', '7'],
  6891: ['1', '2', '3', '4', '5'],
  6890: ['1', '2', '3', '4', '5', '6'],
  6889: ['1', '2', '3', '4', '5', '6'],
  6888: ['1', '2', '3', '4', '5', '6'],
  6887: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  6886: ['1', '2', '3', '4'],
  6885: ['1', '2', '3', '4', '5'],
  6884: ['1', '2', '3', '4', '5'],
  6873: ['1', '2', '3', '4', '5', '6'],
  6872: ['1', '2', '3', '5'],
  6871: ['1', '2', '3', '6', '7'],
  6883: ['1', '2'],
  6882: ['1', '2', '3'],
  6791: ['1', '7'],
  6866: ['1', '2'],
  6867: ['1', '2'],
  6771: ['2'],
  6881: ['1'],
  6858: ['1'],
  6880: ['1', '2', '3'],
  6879: ['1'],
  6766: ['1'],
  6804: ['2'],
  6767: ['1'],
  6878: ['1'],
  6792: ['2', '5'],
  6877: ['1'],
  6851: ['1', '2'],
  6876: ['1'],
  6875: ['1', '2'],
  6776: ['1'],
  6852: ['1', '2', '3'],
  6853: ['1', '2', '3'],
  6869: ['1', '2', '3'],
  6794: ['2', '3'],
  6870: ['1', '2', '3'],
  6861: ['1', '2'],
  C6819: ['1', '2'],
  C7335: ['1', '10'],
  C7475: ['1', '10', '11'],
  T126: ['1', '2'],
  T124: ['1', '2'],
  T101: ['1'],
  T121: ['2'],
};

const EXPECTED_IRIS_DESIGNS: Record<string, string> = {
  6892: '코르델', 6891: '크리즈', 6890: '샤드', 6889: '바티스', 6888: '펌블',
  6887: '스너그', 6886: '제이프', 6885: '네슬', 6884: '라플', 6873: '글레이',
  6872: '플라넬', 6871: '벡터', 6883: '심스톤', 6882: '크레터', 6791: '몰러',
  6866: '엠보스', 6867: '도트스톤', 6771: '돌출콘크리트', 6881: '미스틱', 6858: '덴버',
  6880: '텍톤', 6879: '동양화', 6766: '한지', 6804: '레온', 6767: '상평통보',
  6878: '시티빌', 6792: '슈츠', 6877: '르꼴레', 6851: '아벨', 6876: '큐티파이',
  6875: '슬릿', 6776: '뭉게뭉게', 6852: '링크', 6853: '벤지', 6869: '펠트',
  6794: '루키', 6870: '에반', 6861: '오즈', C6819: '롤링샌드', C7335: '스톤샌드',
  C7475: '아트실링', T126: '네오타일', T124: '심플타일', T101: '마블', T121: '스톤',
};

describe('Shinhan Iris wide paper catalog', () => {
  it('publishes all 129 variants without bundled images', () => {
    const products = sampleData.ALL_SAMPLES.filter(
      (sample) => sample.brand === '신한' && sample.collection === '광폭합지',
    );

    expect(products).toHaveLength(129);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(129);
    expect(new Set(products.map((sample) => sample.id)).size).toBe(129);
    expect(products.every((sample) => sample.id === `iris-${sample.productNo.toLowerCase()}`)).toBe(true);
    expect(products.every((sample) => sample.materialType === '합지')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('matches the complete swatch-code set and product names in the public catalog', () => {
    const expected = Object.entries(EXPECTED_IRIS_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const products = sampleData.ALL_SAMPLES.filter(
      (sample) => sample.brand === '신한' && sample.collection === '광폭합지',
    );

    expect(products.map((sample) => sample.productNo).sort()).toEqual(expected);
    for (const sample of products) {
      const series = sample.productNo.split('-')[0];
      const expectedLine = series.startsWith('C') ? '천장지' : series.startsWith('T') ? '타일벽지' : EXPECTED_IRIS_DESIGNS[series];
      expect(sample.line).toBe(expectedLine);
      expect(sample.name).toContain(EXPECTED_IRIS_DESIGNS[series]);
    }
  });

  it('adds the Shinhan paper and wide-paper path while preserving existing categories', () => {
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
    const paper = shinhan.materialTypes.find((item: { name: string }) => item.name === '합지');
    const widePaper = paper.groups.find((group: { name: string }) => group.name === '광폭합지');

    expect(shinhan.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(result[1]).toEqual(untouchedCategory);
    expect(widePaper.lines).toContain('코르델');
    expect(widePaper.lines).toContain('천장지');
    expect(widePaper.lines).toContain('타일벽지');
    expect(new Set(widePaper.lines).size).toBe(40);
  });

  it('keeps the same collection name separated by brand', () => {
    const iris = sampleData.ALL_SAMPLES.find(
      (sample) => sample.brand === '신한' && sample.collection === '광폭합지' && sample.line === '코르델',
    )!;
    const gaenari = sampleData.ALL_SAMPLES.find(
      (sample) => sample.brand === '개나리' && sample.collection === '광폭합지',
    )!;

    expect(iris.brand).toBe('신한');
    expect(gaenari.brand).toBe('개나리');
    expect(iris.id).toMatch(/^iris-/);
    expect(gaenari.id).not.toMatch(/^iris-/);
  });

  it('provides catalog details and manual image placeholders', () => {
    const sample = sampleData.ALL_SAMPLES.find(
      (item) => item.brand === '신한' && item.collection === '광폭합지' && item.productNo === '6892-1',
    )!;
    const ceiling = sampleData.ALL_SAMPLES.find(
      (item) => item.brand === '신한' && item.collection === '광폭합지' && item.productNo === 'C7475-1',
    )!;
    const tile = sampleData.ALL_SAMPLES.find(
      (item) => item.brand === '신한' && item.collection === '광폭합지' && item.productNo === 'T126-1',
    )!;

    expect(sample.description).toContain('아이리스');
    expect(sample.detailSections?.map((section) => section.title)).toContain('내구성 강화 코팅');
    expect(sample.sourceLabel).toBe('KCC신한벽지 IRIS 공개 카탈로그');
    expect(ceiling.line).toBe('천장지');
    expect(ceiling.specs).toContain('천장용');
    expect(tile.line).toBe('타일벽지');
    expect(tile.specs).toContain('타일 패턴');
    expect(sample.image).toBe('');
  });
});
