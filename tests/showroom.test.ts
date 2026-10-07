import { describe, expect, it } from 'vitest';
import {
  getRoomSurfaces,
  isSampleCompatibleWithSurface,
  sortPointsClockwise,
} from '../client/src/lib/showroom';

describe('E샘플북 쇼룸', () => {
  it('공간별로 적용 가능한 표면을 구분한다', () => {
    expect(getRoomSurfaces('living').map((surface) => surface.id)).toEqual(['wall', 'floor', 'furniture']);
    expect(getRoomSurfaces('kitchen').map((surface) => surface.id)).toEqual(['wall', 'floor', 'cabinet']);
    expect(getRoomSurfaces('bathroom').map((surface) => surface.id)).toEqual(['bath-wall', 'bath-floor', 'grout']);
  });

  it('표면에 맞는 자재 카테고리만 허용한다', () => {
    expect(isSampleCompatibleWithSurface({ categoryId: 1 }, 'wall')).toBe(true);
    expect(isSampleCompatibleWithSurface({ categoryId: 3 }, 'cabinet')).toBe(true);
    expect(isSampleCompatibleWithSurface({ categoryId: 5 }, 'floor')).toBe(true);
    expect(isSampleCompatibleWithSurface({ categoryId: 2 }, 'bath-wall')).toBe(true);
    expect(isSampleCompatibleWithSurface({ categoryId: 6 }, 'grout')).toBe(true);
    expect(isSampleCompatibleWithSurface({ categoryId: 1 }, 'floor')).toBe(false);
    expect(isSampleCompatibleWithSurface({ categoryId: 3 }, 'bath-floor')).toBe(false);
  });

  it('영역 점을 중심 기준 시계 방향으로 정렬한다', () => {
    expect(sortPointsClockwise([
      { x: 90, y: 90 },
      { x: 10, y: 10 },
      { x: 10, y: 90 },
      { x: 90, y: 10 },
    ])).toEqual([
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ]);
  });
});

