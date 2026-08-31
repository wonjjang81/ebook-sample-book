import type { Sample } from '@/data/sampleData';

export const PRODUCT_COLOR_FAMILIES = [
  '화이트', '아이보리/크림', '베이지', '그레이지', '그레이', '블랙',
  '브라운', '레드/핑크', '오렌지/옐로', '그린', '블루', '퍼플', '멀티', '미분류',
] as const;

export type ProductColorFamily = typeof PRODUCT_COLOR_FAMILIES[number];
export type MaterialGradeFilter = 'all' | '실크' | '합지' | '프리미엄';

const COLOR_RULES: Array<{ family: ProductColorFamily; hex: string; words: string[] }> = [
  { family: '그레이지', hex: '#b8afa3', words: ['그레이지', 'greige'] },
  { family: '그레이', hex: '#9ca3af', words: ['그레이', 'grey', 'gray', '실버', 'silver', '애쉬', 'ash', '스모크', 'smoke', '포그', 'fog'] },
  { family: '아이보리/크림', hex: '#eee5ce', words: ['아이보리', 'ivory', '크림', 'cream', '바닐라', '오트밀', '에그쉘', '마스카포네'] },
  { family: '베이지', hex: '#cbb89d', words: ['베이지', 'beige', '샌드', 'sand', '토프', 'taupe', '카푸치노', '카라멜'] },
  { family: '화이트', hex: '#f8fafc', words: ['화이트', 'white', '스노우', 'snow', '클라우드', 'cloud'] },
  { family: '블랙', hex: '#27272a', words: ['블랙', 'black', '차콜', 'charcoal'] },
  { family: '브라운', hex: '#8b6b4a', words: ['브라운', 'brown', '모카', 'mocha', '월넛', 'walnut'] },
  { family: '레드/핑크', hex: '#e9a3ac', words: ['레드', 'red', '핑크', 'pink', '로즈', 'rose', '블러쉬', 'blush'] },
  { family: '오렌지/옐로', hex: '#e8b45c', words: ['오렌지', 'orange', '옐로', 'yellow', '버터', 'apricot', '애프리콧'] },
  { family: '그린', hex: '#78977a', words: ['그린', 'green', '세이지', 'sage', '올리브', 'olive'] },
  { family: '블루', hex: '#718dab', words: ['블루', 'blue', '네이비', 'navy'] },
  { family: '퍼플', hex: '#9b83ad', words: ['퍼플', 'purple', '라벤더', 'lavender'] },
  { family: '멀티', hex: '#a78bfa', words: ['멀티', 'multi', '컬러풀', 'colorful'] },
];

const DEFAULT_COLOR = { name: '미등록', family: '미분류' as const, hex: '#cbd5e1' };

export function getProductColorInfo(sample: Sample): { name: string; family: ProductColorFamily; hex: string } {
  const explicitFamily = PRODUCT_COLOR_FAMILIES.find((family) => family === sample.colorFamily);
  const text = [sample.color, sample.name, ...sample.specs].filter(Boolean).join(' ').toLocaleLowerCase('ko-KR');
  const matchedRule = COLOR_RULES.find((rule) => rule.family === explicitFamily)
    ?? COLOR_RULES.find((rule) => rule.words.some((word) => text.includes(word)));
  if (!matchedRule && explicitFamily === '미분류') return { ...DEFAULT_COLOR, name: sample.color?.trim() || DEFAULT_COLOR.name };
  if (!matchedRule) return DEFAULT_COLOR;
  return { name: sample.color?.trim() || matchedRule.family, family: matchedRule.family, hex: matchedRule.hex };
}

export function getProductPattern(sample: Sample): string {
  return sample.pattern?.trim() || sample.line?.trim() || '미분류';
}

export function isPremiumProduct(sample: Sample): boolean {
  if (sample.grade?.trim() === '프리미엄') return true;
  const text = [sample.collection, sample.line, sample.name, ...sample.specs].filter(Boolean).join(' ').toLocaleLowerCase('ko-KR');
  return ['프리미엄', '하이엔드', '최고급', '포티스', '디아망'].some((word) => text.includes(word));
}

export function matchesMaterialGrade(sample: Sample, filter: MaterialGradeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === '프리미엄') return isPremiumProduct(sample);
  return sample.materialType?.includes(filter) ?? false;
}

export function getSimilarColorSamples(sample: Sample, samples: Sample[], limit = 12): Sample[] {
  const color = getProductColorInfo(sample);
  if (color.family === '미분류') return [];
  return samples
    .filter((candidate) => candidate.id !== sample.id && getProductColorInfo(candidate).family === color.family)
    .sort((a, b) => {
      const score = (candidate: Sample) => Number(candidate.brand === sample.brand) * 2 + Number(candidate.collection === sample.collection);
      return score(b) - score(a);
    })
    .slice(0, limit);
}
