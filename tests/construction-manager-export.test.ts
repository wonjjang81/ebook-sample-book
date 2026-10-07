import { describe, expect, it } from 'vitest'
import { buildConstructionManagerSelection, parseConstructionManagerLaunchContext } from '../client/src/lib/constructionManagerExport'

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

  it('accepts a construction manager launch context only when id and name are both present', () => {
    expect(parseConstructionManagerLaunchContext('?cmProjectId= cm-1 &cmProjectName=%EB%B3%91%EC%A0%90_%ED%9A%A8%EC%84%B1%ED%95%B4%EB%A7%81%ED%84%B4')).toEqual({
      canonicalProjectId: 'cm-1',
      projectName: '병점_효성해링턴',
    })
    expect(parseConstructionManagerLaunchContext('?cmProjectName=현장')).toBeNull()
  })
})
