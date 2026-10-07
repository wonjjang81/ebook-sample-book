import { describe, expect, it } from 'vitest';
import { ALL_SAMPLES, ensureCatalogCollections, sampleMatchesCatalogSelection } from '../client/src/data/sampleData';
import { BEST_WALLPAPER_PRODUCTS } from '../client/src/data/bestWallpaperData';

describe('LX Best wallpaper catalog', () => {
  const samples = ALL_SAMPLES.filter(sample => sample.collection === '베스트');
  it('includes all 135 official unique products without guessing colors or bundling images', () => {
    expect(samples).toHaveLength(135);
    expect(new Set(samples.map(sample => sample.id)).size).toBe(135);
    expect(samples.every(sample => sample.brand === 'LX' && sample.materialType === '실크' && sample.categoryId === 1 && sample.image === '')).toBe(true);
    for (const product of BEST_WALLPAPER_PRODUCTS) {
      expect(samples.find(sample => sample.productNo === product.productNo)).toMatchObject({
        id: `best-${product.productNo.toLowerCase()}`, line: product.design,
        pattern: product.design, color: product.color || undefined,
      });
    }
  });
  it('preserves official texture and ceiling classifications', () => {
    expect(samples.find(sample => sample.productNo === '82600-08')).toMatchObject({line:'양각 회벽',color:'미스티 그레이'});
    expect(samples.find(sample => sample.productNo === '8190-01')?.specs).toContain('천장용 추천');
    expect(new Set(BEST_WALLPAPER_PRODUCTS.map(product => product.theme)).size).toBe(5);
  });
  it('adds the category idempotently without removing the existing LX collections', () => {
    const source = [{id:1,name:'도배',brands:[{name:'LX',groups:[],materialTypes:[] as any[]}]}];
    const once = ensureCatalogCollections(source);
    const twice = ensureCatalogCollections(once);
    expect(twice).toEqual(once);
    expect(source[0].brands[0].materialTypes).toEqual([]);
    const silk = twice[0].brands[0].materialTypes.find(item => item.name === '실크');
    expect(silk.groups.map((group: any) => group.name)).toEqual(expect.arrayContaining(['베스트','디아망','디아망포티스']));
    expect(silk.groups.find((group: any) => group.name === '베스트').lines).toContain('양각 회벽');
  });
  it('limits collection filtering to Best rather than other similarly named patterns', () => {
    expect(sampleMatchesCatalogSelection(samples[0],{group:'베스트',line:samples[0].line})).toBe(true);
    expect(sampleMatchesCatalogSelection(ALL_SAMPLES.find(sample=>sample.collection==='디아망')!,{group:'베스트'})).toBe(false);
  });
});
