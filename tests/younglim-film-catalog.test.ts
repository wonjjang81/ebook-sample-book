import { describe, expect, it } from 'vitest';
import { ALL_SAMPLES, ensureCatalogCollections, sampleMatchesCatalogSelection } from '../client/src/data/sampleData';

describe('Younglim official film catalog', () => {
  const samples = ALL_SAMPLES.filter(s => s.categoryId === 3 && s.brand === '영림');
  it('includes all 359 unique products with safe stable IDs', () => {
    expect(samples).toHaveLength(359);
    expect(new Set(samples.map(s => s.productNo)).size).toBe(359);
    expect(new Set(samples.map(s => s.id)).size).toBe(359);
    expect(samples.every(s => /^[a-z0-9-]+$/.test(s.id))).toBe(true);
    expect(samples.find(s => s.productNo === 'PW958-1')?.name).toContain('영림159');
  });
  it('preserves official designs and does not invent unclassified products or colors', () => {
    expect(samples.filter(s => s.line === '미분류')).toHaveLength(16);
    expect(samples.filter(s => s.line === '우드')).toHaveLength(139);
    expect(samples.every(s => s.color === undefined)).toBe(true);
    expect(samples.find(s => s.productNo === 'PX457')?.specs).toContain('방염가능필름');
    expect(samples.find(s => s.productNo === 'PX457-1')?.specs).not.toContain('방염가능필름');
  });
  it('uses only official public HTTPS image URLs', () => {
    expect(samples.every(s => s.image.startsWith('https://s3.ap-northeast-2.amazonaws.com/younglim-bucket/'))).toBe(true);
  });
  it('merges the sidebar without overwriting custom categories or the 3M brand', () => {
    const source = [{ id: 3, name: '필름', brands: [{ name: '3M', groups: [{ name: '기존', lines: ['사용자 라인'] }] }] }];
    const once = ensureCatalogCollections(source);
    expect(ensureCatalogCollections(once)).toEqual(once);
    expect(source[0].brands).toHaveLength(1);
    expect(once[0].brands[0]).toEqual(source[0].brands[0]);
    expect(once[0].brands.find(b => b.name === '영림')?.groups[0].lines).toContain('스톤&마블');
    const younglim: any = once[0].brands.find(b => b.name === '영림');
    expect(younglim.materialTypes[0].name).toBe('인테리어필름');
    expect(younglim.materialTypes[0].groups[0].lines).toContain('우드');
  });
  it('supports collection and design filtering without mixing the existing 3M product', () => {
    expect(sampleMatchesCatalogSelection(samples[0], { group: '인테리어필름&시트', line: '스톤&마블' })).toBe(true);
    expect(sampleMatchesCatalogSelection(ALL_SAMPLES.find(s => s.id === '3-1')!, { group: '인테리어필름&시트' })).toBe(false);
  });
});
