export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom';
export type SurfaceType = 'wall' | 'floor' | 'furniture' | 'cabinet' | 'bath-wall' | 'bath-floor' | 'grout';

export interface ShowroomSurface {
  id: SurfaceType;
  label: string;
  materialLabel: string;
  categoryIds: number[];
}

export interface ShowroomPoint {
  x: number;
  y: number;
}

export const ROOM_OPTIONS: Array<{ id: RoomType; label: string }> = [
  { id: 'living', label: '거실' },
  { id: 'bedroom', label: '안방' },
  { id: 'kitchen', label: '주방' },
  { id: 'bathroom', label: '욕실' },
];

export const SHOWROOM_PHOTO_SLOTS = ROOM_OPTIONS.flatMap((room) =>
  Array.from({ length: 3 }, (_, index) => ({
    id: `showroom-${room.id}-${String(index + 1).padStart(2, '0')}`,
    roomId: room.id,
    roomLabel: room.label,
    slot: index + 1,
    label: `${room.label} ${index + 1}`,
  })),
);

const WALL: ShowroomSurface = { id: 'wall', label: '벽', materialLabel: '도배지', categoryIds: [1] };
const FLOOR: ShowroomSurface = { id: 'floor', label: '바닥', materialLabel: '장판 · 마루 · 타일', categoryIds: [2, 4, 5] };
const FURNITURE: ShowroomSurface = { id: 'furniture', label: '가구', materialLabel: '필름', categoryIds: [3] };
const CABINET: ShowroomSurface = { id: 'cabinet', label: '싱크대 · 가구', materialLabel: '필름', categoryIds: [3] };
const BATH_WALL: ShowroomSurface = { id: 'bath-wall', label: '욕실 벽', materialLabel: '타일', categoryIds: [2] };
const BATH_FLOOR: ShowroomSurface = { id: 'bath-floor', label: '욕실 바닥', materialLabel: '타일', categoryIds: [2] };
const GROUT: ShowroomSurface = { id: 'grout', label: '줄눈', materialLabel: '줄눈', categoryIds: [6] };

const ROOM_SURFACES: Record<RoomType, ShowroomSurface[]> = {
  living: [WALL, FLOOR, FURNITURE],
  bedroom: [WALL, FLOOR, FURNITURE],
  kitchen: [WALL, FLOOR, CABINET],
  bathroom: [BATH_WALL, BATH_FLOOR, GROUT],
};

export function getRoomSurfaces(room: RoomType): ShowroomSurface[] {
  return ROOM_SURFACES[room];
}

export function isSampleCompatibleWithSurface(
  sample: { categoryId?: number },
  surface: SurfaceType,
): boolean {
  const target = Object.values(ROOM_SURFACES).flat().find((candidate) => candidate.id === surface);
  return Boolean(sample.categoryId && target?.categoryIds.includes(sample.categoryId));
}

export function sortPointsClockwise(points: ShowroomPoint[]): ShowroomPoint[] {
  if (points.length < 3) return points;
  const center = points.reduce(
    (total, point) => ({ x: total.x + point.x / points.length, y: total.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  return [...points].sort((left, right) => {
    const angleLeft = Math.atan2(left.y - center.y, left.x - center.x);
    const angleRight = Math.atan2(right.y - center.y, right.x - center.x);
    return angleLeft - angleRight;
  });
}
