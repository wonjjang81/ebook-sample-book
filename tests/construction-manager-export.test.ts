import { describe, expect, it } from 'vitest'
import { buildConstructionManagerSelection } from '../client/src/lib/constructionManagerExport'

describe('construction manager selection export', () => {
  it('exports selected samples using samplebook-selection/v1', () => {
    const result = buildConstructionManagerSelection(' 9월 현장 ', [{
      id: '1-1', productNo: '92102-1', name: '화이트', brand: '개나리', category: '도배', specs: ['방염'],
    }], { '1-1': { location: ' 거실 ', memo: ' 포인트 ' } })

    expect(result).toMatchObject({
      schema: 'samplebook-selection/v1', project: { name: '9월 현장' },
      items: [{ id: '1-1', quantity: 1, note: { location: '거실', memo: '포인트' } }],
    })
  })

  it('requires a project and at least one selected product', () => {
    expect(() => buildConstructionManagerSelection('', [], {})).toThrow('프로젝트')
    expect(() => buildConstructionManagerSelection('현장', [], {})).toThrow('선택한 제품')
  })
})
