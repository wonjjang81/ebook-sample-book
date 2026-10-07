export function readShowroomSelections(storage: Pick<Storage, 'getItem'>) {
  const readIds = (key: string): string[] => {
    try {
      const value: unknown = JSON.parse(storage.getItem(key) || '[]');
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  };
  const selected = new Set(readIds('selectedProducts'));
  const liked = new Set(readIds('likedProducts'));
  return { selected, liked, all: new Set([...selected, ...liked]) };
}
