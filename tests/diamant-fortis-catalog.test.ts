import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

const EXPECTED_FORTIS_SERIES: Record<string, string[]> = {
  DF001: ['01', '02'],
  DF002: ['01', '02'],
  DF003: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
  DF004: ['01', '02', '03', '04', '05', '06'],
  DF005: ['01', '02', '03', '04'],
  DF006: ['01', '02', '03'],
  DF007: ['01', '02', '03', '04', '05', '06'],
  DF008: ['01', '02', '03', '04'],
  DF010: ['01'],
  DF011: ['01'],
  DF012: ['01', '02', '03', '04', '05', '06'],
  DF013: ['01', '02', '03', '04', '05'],
  DF014: ['01', '02', '03', '04', '05'],
  DF015: ['01', '02', '03', '04'],
  DF016: ['01'],
  DF017: ['01'],
  DF018: ['01', '02', '03', '04'],
};

const EXPECTED_FORTIS_DESIGNS: Record<string, string> = {
  DF001: '유러피안 플라스터',
  DF002: '프렌치 워시',
  DF003: '솔리드 페인팅',
  DF004: '스웨이드 페인트',
  DF005: '마이크로 시멘트',
  DF006: '샌드 스톤',
  DF007: '브러쉬드 페인트',
  DF008: '스타코',
  DF010: '샌드 웨이브',
  DF011: '컬러풀 트위드',
  DF012: '플레인 캔버스',
  DF013: '마이크로 코튼',
  DF014: '린넨',
  DF015: '심플 부클레',
  DF016: '크랙 스톤',
  DF017: '트레버틴',
  DF018: '소프트 니트',
};

describe('LX Diamant Fortis catalog', () => {
  it('publishes all 64 unique variants with bundled product images', () => {
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '디아망포티스');

    expect(products).toHaveLength(64);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(64);
    expect(new Set(products.map((sample) => sample.id)).size).toBe(64);
    expect(products.every((sample) => sample.id === `diamant-fortis-${sample.productNo.toLowerCase()}`)).toBe(true);
    expect(products.every((sample) => sample.brand === 'LX')).toBe(true);
    expect(products.every((sample) => sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.image === `/images/wallpaper/diamant-fortis/${sample.productNo}.jpg`)).toBe(true);
    expect(products.every((sample) => existsSync(fileURLToPath(new URL(`../client/public${sample.image}`, import.meta.url))))).toBe(true);
  });

  it('matches the complete unique product-code set and design names in the official sample book', () => {
    const expected = Object.entries(EXPECTED_FORTIS_SERIES)
      .flatMap(([series, variants]) => variants.map((variant) => `${series}-${variant}`))
      .sort();
    const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '디아망포티스');

    expect(products.map((sample) => sample.productNo).sort()).toEqual(expected);
    for (const sample of products) {
      const series = sample.productNo.split('-')[0];
      expect(sample.line).toBe(EXPECTED_FORTIS_DESIGNS[series]);
      expect(sample.name).toContain(EXPECTED_FORTIS_DESIGNS[series]);
    }
  });

  it('adds the LX silk and Diamant Fortis path while preserving existing categories', () => {
    const untouchedCategory = { id: 2, name: '타일', brands: [{ name: '기존 타일', groups: [] }] };
    const source = [
      {
        id: 1,
        name: '도배',
        brands: [{ name: 'LX', groups: [{ name: '기존', lines: ['기존 라인'] }] }],
      },
      untouchedCategory,
    ];

    const result = sampleData.ensureCatalogCollections(source);
    const lx = result[0].brands.find((brand: { name: string }) => brand.name === 'LX');
    const silk = lx.materialTypes.find((item: { name: string }) => item.name === '실크');
    const fortis = silk.groups.find((group: { name: string }) => group.name === '디아망포티스');

    expect(lx.groups).toEqual([{ name: '기존', lines: ['기존 라인'] }]);
    expect(result[1]).toEqual(untouchedCategory);
    expect(fortis.lines).toContain('유러피안 플라스터');
    expect(fortis.lines).toContain('브러쉬드 페인트');
    expect(fortis.lines).toContain('소프트 니트');
    expect(fortis.lines).toContain('플레인 캔버스');
    expect(new Set(fortis.lines).size).toBe(17);
  });

  it('scopes shared design names to Diamant Fortis', () => {
    const fortis = sampleData.ALL_SAMPLES.find(
      (sample) => sample.collection === '디아망포티스' && sample.line === '스타코',
    )!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection !== '디아망포티스')!;

    expect(sampleData.sampleMatchesCatalogSelection(fortis, { group: '디아망포티스', line: '스타코' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '디아망포티스', line: unrelated.line })).toBe(false);
  });

  it('provides official catalog details and scratch-care specifications', () => {
    const sample = sampleData.ALL_SAMPLES.find(
      (item) => item.collection === '디아망포티스' && item.productNo === 'DF003-01',
    )!;

    expect(sample.description).toContain('디아망 포티스');
    expect(sample.detailSections?.map((section) => section.title)).toContain('필름처럼 강한 내구성');
    expect(sample.detailSections?.map((section) => section.title)).toContain('리얼 프린팅 디자인');
    expect(sample.specs).toContain('PS인증 14N 이상');
    expect(sample.sourceLabel).toBe('LX Z:IN 디아망 포티스 공식 샘플북');
    expect(sample.image).toBe('/images/wallpaper/diamant-fortis/DF003-01.jpg');
  });
});
