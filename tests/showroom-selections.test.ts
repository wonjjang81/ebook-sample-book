import { describe, expect, it } from 'vitest';
import { readShowroomSelections } from '../client/src/lib/showroomSelections';
import { getShowroomPhotoSurfaces, isSampleCompatibleWithSurface } from '../client/src/lib/showroom';

describe('showroom selected and liked materials', () => {
  it('merges selected and liked products once while retaining source badges', () => {
    const saved: Record<string, string> = { selectedProducts: '["a","both"]', likedProducts: '["b","both"]' };
    const result = readShowroomSelections({ getItem: key => saved[key] });
    expect([...result.all]).toEqual(['a', 'both', 'b']);
    expect(result.selected.has('both')).toBe(true);
    expect(result.liked.has('both')).toBe(true);
  });
  it('invalid selected data does not hide valid liked products', () => {
    expect([...readShowroomSelections({ getItem: key => key === 'selectedProducts' ? '{broken' : '["film",null,3]' }).all]).toEqual(['film']);
    expect(readShowroomSelections({ getItem: () => { throw new Error('blocked'); } }).all.size).toBe(0);
  });
  it('cabinet photos expose film-only channels and reject other materials', () => {
    const kitchen = getShowroomPhotoSurfaces('kitchen', 'showroom-kitchen-01');
    const entrance = getShowroomPhotoSurfaces('entrance', 'showroom-entrance-01');
    expect(kitchen.map(surface => surface.id)).toEqual(['cabinet-upper', 'cabinet-lower']);
    expect(entrance.map(surface => surface.id)).toEqual(['shoe-cabinet']);
    for (const surface of [...kitchen, ...entrance]) {
      expect(isSampleCompatibleWithSurface({ categoryId: 3 }, surface.id)).toBe(true);
      for (const categoryId of [1, 2, 4, 5, 6]) expect(isSampleCompatibleWithSurface({ categoryId }, surface.id)).toBe(false);
    }
    expect(getShowroomPhotoSurfaces('kitchen', 'showroom-kitchen-02').map(surface => surface.id)).toContain('wall');
  });
});
