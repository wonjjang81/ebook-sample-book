export type ConstructionManagerSelectionProduct = {
  id: string
  productNo: string
  name: string
  brand: string
  category: string
  specs: string[]
}

export type ProductNote = { location?: string; memo?: string }

export type ConstructionManagerLaunchContext = {
  canonicalProjectId: string
  projectName: string
}

export function parseConstructionManagerLaunchContext(search: string): ConstructionManagerLaunchContext | null {
  const params = new URLSearchParams(search)
  const canonicalProjectId = params.get('cmProjectId')?.trim() ?? ''
  const projectName = params.get('cmProjectName')?.trim() ?? ''
  if (!canonicalProjectId || !projectName) return null
  return { canonicalProjectId, projectName }
}

export function buildConstructionManagerSelection(
  projectName: string,
  products: ConstructionManagerSelectionProduct[],
  notes: Record<string, ProductNote>,
) {
  const name = projectName.trim()
  if (!name) throw new Error('프로젝트를 먼저 선택해 주세요.')
  if (products.length === 0) throw new Error('선택한 제품이 없습니다.')

  return {
    schema: 'samplebook-selection/v1' as const,
    exportedAt: new Date().toISOString(),
    project: { name },
    items: products.map(product => ({
      id: product.id,
      productNo: product.productNo,
      name: product.name,
      brand: product.brand,
      category: product.category,
      specs: product.specs,
      quantity: 1,
      note: {
        location: notes[product.id]?.location?.trim() ?? '',
        memo: notes[product.id]?.memo?.trim() ?? '',
      },
    })),
  }
}
