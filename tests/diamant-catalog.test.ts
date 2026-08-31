import { describe, expect, it } from 'vitest';
import * as sampleData from '../client/src/data/sampleData';

describe('LX Diamant catalog', () => {
  const products = sampleData.ALL_SAMPLES.filter((sample) => sample.collection === '디아망');

  it('publishes all 80 unique official products without bundled images', () => {
    expect(products).toHaveLength(80);
    expect(new Set(products.map((sample) => sample.productNo)).size).toBe(80);
    expect(new Set(products.map((sample) => sample.id)).size).toBe(80);
    expect(products.every((sample) => sample.id === `diamant-${sample.productNo.toLowerCase()}`)).toBe(true);
    expect(products.every((sample) => sample.brand === 'LX' && sample.materialType === '실크')).toBe(true);
    expect(products.every((sample) => sample.collection === '디아망' && sample.grade === '프리미엄')).toBe(true);
    expect(products.every((sample) => sample.image === '')).toBe(true);
  });

  it('keeps official product names, colors, and ceiling recommendations', () => {
    expect(products.find((sample) => sample.productNo === 'PR043-07')).toMatchObject({ line: '마띠에르', color: '블랑 그레이지', pattern: '마띠에르' });
    expect(products.find((sample) => sample.productNo === 'PR051-02')).toMatchObject({ line: '호라이즌', color: '클라우디 블루' });
    expect(products.find((sample) => sample.productNo === 'PR003-10')).toMatchObject({ line: '크로쉐', color: '딥그린' });
    expect(products.find((sample) => sample.productNo === 'PR031-05')).toMatchObject({ line: '내추럴회벽', color: '애쉬 베이지' });
    expect(products.filter((sample) => sample.specs.includes('천장용 추천')).map((sample) => sample.productNo).sort()).toEqual(['PR028-01', 'PR031-01', 'PR044-01', 'PR048-01']);
  });

  it('adds the LX silk and Diamant category path without replacing Fortis', () => {
    const source = [{ id: 1, name: '도배', brands: [{ name: 'LX', groups: [] }] }];
    const result = sampleData.ensureCatalogCollections(source);
    const lx = result[0].brands[0];
    const silk = lx.materialTypes.find((item: { name: string }) => item.name === '실크');
    const diamant = silk.groups.find((group: { name: string }) => group.name === '디아망');

    expect(diamant.lines).toContain('마띠에르');
    expect(diamant.lines).toContain('린넨 캔버스');
    expect(diamant.lines).toContain('질석');
    expect(new Set(diamant.lines).size).toBe(30);
    expect(silk.groups.some((group: { name: string }) => group.name === '디아망포티스')).toBe(true);
  });

  it('scopes product-line filtering to the Diamant collection', () => {
    const diamant = products.find((sample) => sample.line === '마띠에르')!;
    const unrelated = sampleData.ALL_SAMPLES.find((sample) => sample.collection !== '디아망' && sample.line === diamant.line)
      ?? sampleData.ALL_SAMPLES.find((sample) => sample.collection !== '디아망')!;

    expect(sampleData.sampleMatchesCatalogSelection(diamant, { group: '디아망', line: '마띠에르' })).toBe(true);
    expect(sampleData.sampleMatchesCatalogSelection(unrelated, { group: '디아망', line: unrelated.line })).toBe(false);
  });

  it('provides basic and detailed official catalog information', () => {
    const sample = products.find((item) => item.productNo === 'PR044-04')!;
    expect(sample.name).toContain('샌드 스타코');
    expect(sample.description).toContain('디아망 아뜰리에');
    expect(sample.detailSections?.map((section) => section.title)).toContain('네 가지 텍스처 컬렉션');
    expect(sample.sourceLabel).toBe('LX Z:IN 디아망 공식 샘플북');
  });
});
