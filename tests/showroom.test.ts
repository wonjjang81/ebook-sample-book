import { describe, expect, it } from 'vitest';
import {
  getRoomSurfaces,
  isSampleCompatibleWithSurface,
  sortPointsClockwise,
  BUILTIN_SHOWROOM_PHOTOS,
  SHOWROOM_PHOTO_SLOTS,
} from '../client/src/lib/showroom';

describe('E샘플북 쇼룸', () => {
  it('공간별로 적용 가능한 표면을 구분한다', () => {
    expect(getRoomSurfaces('living').map((surface) => surface.id)).toEqual(['wall', 'floor', 'furniture']);
    expect(getRoomSurfaces('kitchen').map((surface) => surface.id)).toEqual(['cabinet-upper', 'cabinet-lower', 'wall', 'floor', 'cabinet']);
    expect(getRoomSurfaces('entrance').map((surface) => surface.id)).toEqual(['shoe-cabinet', 'wall', 'floor']);
    expect(getRoomSurfaces('bathroom').map((surface) => surface.id)).toEqual(['bath-wall', 'bath-floor', 'grout']);
  });

  it('기본 사진에 독립된 필름 알파 채널을 연결한다', () => {
    expect(SHOWROOM_PHOTO_SLOTS.filter(slot => slot.roomId === 'entrance')).toHaveLength(3);
    const kitchen = BUILTIN_SHOWROOM_PHOTOS['showroom-kitchen-01'];
    expect(kitchen.masks['cabinet-upper']).not.toBe(kitchen.masks['cabinet-lower']);
    expect(BUILTIN_SHOWROOM_PHOTOS['showroom-entrance-01'].masks['shoe-cabinet']).toContain('alpha.svg');
    for (const surface of ['cabinet-upper', 'cabinet-lower', 'shoe-cabinet'] as const) {
      expect(isSampleCompatibleWithSurface({ categoryId: 3 }, surface)).toBe(true);
      expect(isSampleCompatibleWithSurface({ categoryId: 1 }, surface)).toBe(false);
    }
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

