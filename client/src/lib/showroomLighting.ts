/** Relative neutral lighting for white cabinet reference photos, not a physical renderer. */
export function getLightingReference(luminances: number[]): number {
  if (!luminances.length) return 220;
  const sorted = [...luminances].sort((a, b) => a - b);
  return Math.max(96, sorted[Math.floor((sorted.length - 1) * 0.65)]);
}

export function getLightingPixel(luminance: number, reference: number) {
  const ratio = Math.max(0, Math.min(255, luminance)) / Math.max(96, reference);
  return {
    shadow: Math.round(255 * Math.min(1, ratio)),
    // Gentle screen blend preserves daylight without bleaching dark films to white.
    highlight: Math.round(255 * Math.min(0.22, Math.max(0, ratio - 1) * 0.55)),
  };
}
