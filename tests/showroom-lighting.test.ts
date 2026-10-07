import { describe, expect, it } from 'vitest';
import { getLightingPixel, getLightingReference } from '../client/src/lib/showroomLighting';

describe('showroom neutral cabinet lighting', () => {
  it('retains shadows, neutral light, and bounded daylight highlights', () => {
    expect(getLightingPixel(110, 220)).toEqual({ shadow: 128, highlight: 0 });
    expect(getLightingPixel(220, 220)).toEqual({ shadow: 255, highlight: 0 });
    expect(getLightingPixel(255, 220).highlight).toBeGreaterThan(0);
    expect(getLightingPixel(255, 0).highlight).toBeLessThanOrEqual(56);
  });
  it('uses a robust reference and safely handles empty or very dark masks', () => {
    expect(getLightingReference([])).toBe(220);
    expect(getLightingReference([0, 10, 20])).toBe(96);
    expect(getLightingReference([200, 210, 220, 230, 255])).toBe(220);
  });
});
