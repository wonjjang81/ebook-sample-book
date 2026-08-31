import { describe, expect, it } from 'vitest';
import type { Sample } from '../client/src/data/sampleData';
import { getProductColorInfo, getProductPattern, getSimilarColorSamples, isPremiumProduct, matchesMaterialGrade } from '../client/src/lib/productMetadata';

const base: Sample = { id: 'a', productNo: 'DF008-02', name: '디아망 포티스 스타코', brand: 'LX', line: '스타코', collection: '디아망포티스', materialType: '실크', color: '미스트 그레이지', pattern: '스타코', grade: '프리미엄', specs: ['고내구성'], image: '' };

describe('product metadata', () => {
  it('uses explicit color and pattern metadata', () => {
    expect(getProductColorInfo(base)).toMatchObject({ name: '미스트 그레이지', family: '그레이지' });
    expect(getProductPattern(base)).toBe('스타코');
    expect(isPremiumProduct(base)).toBe(true);
    expect(matchesMaterialGrade(base, '실크')).toBe(true);
    expect(matchesMaterialGrade(base, '프리미엄')).toBe(true);
  });

  it('infers colors from existing product text and leaves unknown colors unclassified', () => {
    expect(getProductColorInfo({ ...base, id: 'b', color: undefined, name: '프리모 크랙 아이보리', grade: undefined, collection: '프리모' }).family).toBe('아이보리/크림');
    expect(getProductColorInfo({ ...base, id: 'c', color: undefined, name: '무지 제품', specs: [] }).family).toBe('미분류');
  });

  it('ranks same-brand and same-collection similar colors first', () => {
    const closest = { ...base, id: 'b', color: '웜 그레이지' };
    const other = { ...base, id: 'c', brand: '신한', collection: '리빙', color: '샌드 그레이지' };
    expect(getSimilarColorSamples(base, [other, closest, base]).map((item) => item.id)).toEqual(['b', 'c']);
  });
});
