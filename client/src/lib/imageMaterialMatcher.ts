import type { Sample } from '@/data/sampleData';

const SIZE = 96;
const HUE_BINS = 12;

export interface ImageSignature {
  hueHistogram: number[];
  averageRgb: [number, number, number];
  brightness: number;
  saturation: number;
  contrast: number;
  edgeDensity: number;
}

export interface WhiteCalibration {
  gains: [number, number, number];
  confidence: number;
  averageRgb: [number, number, number];
  warnings: string[];
}

export interface MaterialMatch {
  sample: Sample;
  score: number;
  reasons: string[];
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    if (!source.startsWith('data:') && !source.startsWith('blob:')) image.crossOrigin = 'anonymous';
    image.src = source;
  });
}

function rgbToHue(r: number, g: number, b: number): { hue: number; saturation: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === rn) hue = ((gn - bn) / delta) % 6;
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { hue, saturation: max === 0 ? 0 : delta / max };
}

export async function extractImageSignature(source: string, calibration?: WhiteCalibration): Promise<ImageSignature> {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('이미지 분석을 지원하지 않는 브라우저입니다.');

  const scale = Math.max(SIZE / image.naturalWidth, SIZE / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (SIZE - width) / 2, (SIZE - height) / 2, width, height);
  const pixels = context.getImageData(0, 0, SIZE, SIZE).data;
  const histogram = Array(HUE_BINS).fill(0) as number[];
  const luminances: number[] = [];
  let red = 0;
  let green = 0;
  let blue = 0;
  let saturationTotal = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = Math.min(255, pixels[index] * (calibration?.gains[0] ?? 1));
    const g = Math.min(255, pixels[index + 1] * (calibration?.gains[1] ?? 1));
    const b = Math.min(255, pixels[index + 2] * (calibration?.gains[2] ?? 1));
    const hsv = rgbToHue(r, g, b);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    histogram[Math.min(HUE_BINS - 1, Math.floor(hsv.hue / (360 / HUE_BINS)))] += Math.max(0.1, hsv.saturation);
    luminances.push(luminance);
    saturationTotal += hsv.saturation;
    red += r;
    green += g;
    blue += b;
  }

  const count = SIZE * SIZE;
  const histogramTotal = histogram.reduce((sum, value) => sum + value, 0) || 1;
  const brightness = luminances.reduce((sum, value) => sum + value, 0) / count;
  const contrast = Math.sqrt(luminances.reduce((sum, value) => sum + (value - brightness) ** 2, 0) / count);
  let edges = 0;
  for (let y = 1; y < SIZE; y += 1) {
    for (let x = 1; x < SIZE; x += 1) {
      const position = y * SIZE + x;
      const delta = Math.abs(luminances[position] - luminances[position - 1]) + Math.abs(luminances[position] - luminances[position - SIZE]);
      if (delta > 0.14) edges += 1;
    }
  }

  return {
    hueHistogram: histogram.map((value) => value / histogramTotal),
    averageRgb: [Math.round(red / count), Math.round(green / count), Math.round(blue / count)],
    brightness,
    saturation: saturationTotal / count,
    contrast,
    edgeDensity: edges / ((SIZE - 1) * (SIZE - 1)),
  };
}

export async function analyzeWhiteReference(source: string): Promise<WhiteCalibration> {
  const signature = await extractImageSignature(source);
  const [red, green, blue] = signature.averageRgb;
  const target = Math.min(235, (red + green + blue) / 3);
  const rawGains: [number, number, number] = [target / Math.max(1, red), target / Math.max(1, green), target / Math.max(1, blue)];
  const gains = rawGains.map((gain) => Math.max(0.65, Math.min(1.55, gain))) as [number, number, number];
  const warnings: string[] = [];
  const brightness255 = signature.brightness * 255;
  const channelSpread = Math.max(red, green, blue) - Math.min(red, green, blue);
  if (brightness255 > 245) warnings.push('기준판이 과노출되었습니다.');
  if (brightness255 < 105) warnings.push('기준판이 너무 어둡습니다.');
  if (signature.contrast > 0.16) warnings.push('기준판에 그림자 또는 반사가 감지되었습니다.');
  if (channelSpread > 95) warnings.push('조명의 색 편향이 매우 강합니다.');
  let confidence = 100;
  confidence -= Math.min(30, Math.abs(205 - brightness255) * 0.35);
  confidence -= Math.min(25, signature.contrast * 120);
  confidence -= Math.min(25, channelSpread * 0.2);
  confidence -= warnings.length * 5;
  return { gains, confidence: Math.max(0, Math.round(confidence)), averageRgb: signature.averageRgb, warnings };
}

function distance(left: ImageSignature, right: ImageSignature): number {
  const histogram = left.hueHistogram.reduce((sum, value, index) => sum + Math.abs(value - right.hueHistogram[index]), 0) / 2;
  const rgb = Math.sqrt(left.averageRgb.reduce((sum, value, index) => sum + (value - right.averageRgb[index]) ** 2, 0)) / 441.67;
  return (
    histogram * 0.32 +
    rgb * 0.28 +
    Math.abs(left.brightness - right.brightness) * 0.16 +
    Math.abs(left.saturation - right.saturation) * 0.08 +
    Math.min(1, Math.abs(left.contrast - right.contrast) * 4) * 0.09 +
    Math.min(1, Math.abs(left.edgeDensity - right.edgeDensity) * 5) * 0.07
  );
}

function matchReasons(query: ImageSignature, candidate: ImageSignature): string[] {
  const reasons: string[] = [];
  const rgbDistance = Math.sqrt(query.averageRgb.reduce((sum, value, index) => sum + (value - candidate.averageRgb[index]) ** 2, 0));
  if (rgbDistance < 45) reasons.push('주조색 유사');
  if (Math.abs(query.brightness - candidate.brightness) < 0.08) reasons.push('명도 유사');
  if (Math.abs(query.contrast - candidate.contrast) < 0.035) reasons.push('질감 대비 유사');
  if (Math.abs(query.edgeDensity - candidate.edgeDensity) < 0.025) reasons.push('패턴 밀도 유사');
  return reasons.length > 0 ? reasons.slice(0, 3) : ['전체 시각 특성 유사'];
}

export async function findSimilarMaterials(
  querySource: string,
  samples: Sample[],
  onProgress?: (completed: number, total: number) => void,
  calibration?: WhiteCalibration,
): Promise<{ signature: ImageSignature; matches: MaterialMatch[]; analyzed: number }> {
  const query = await extractImageSignature(querySource, calibration);
  const candidates = samples.filter((sample) => sample.image.startsWith('/'));
  const matches: MaterialMatch[] = [];
  let completed = 0;

  for (let offset = 0; offset < candidates.length; offset += 6) {
    const batch = candidates.slice(offset, offset + 6);
    const results = await Promise.all(batch.map(async (sample) => {
      try {
        const signature = await extractImageSignature(sample.image);
        return { sample, signature };
      } catch {
        return null;
      }
    }));
    results.forEach((result) => {
      if (!result) return;
      const similarity = Math.max(0, 1 - distance(query, result.signature));
      const calibratedScore = Math.round(similarity * 100);
      matches.push({
        sample: result.sample,
        score: calibration ? Math.min(calibratedScore, calibration.confidence + 10) : calibratedScore,
        reasons: matchReasons(query, result.signature),
      });
    });
    completed += batch.length;
    onProgress?.(completed, candidates.length);
  }

  return { signature: query, matches: matches.sort((a, b) => b.score - a.score).slice(0, 12), analyzed: matches.length };
}
