// 공유 데이터 파일 - EbookViewer와 SampleDetail에서 함께 사용

// 4단계 계층 구조 (카테고리 > 브랜드 > 제품군 > 라인)
export const CATEGORIES = [
  {
    id: 1,
    name: '도배',
    brands: [
      {
        name: '개나리',
        groups: [
          { name: '방염벽지', lines: ['프리모', 'Plaster&Paint', 'Simple Fabric', 'Urban Fabric', 'Kids', 'Ceiling'] },
        ],
      },
      { name: '신한', groups: [{ name: '일반벽지', lines: ['모던', '클래식'] }] },
      { name: '프리미엄', groups: [{ name: '프리미엄벽지', lines: ['럭셔리', '프리스티지'] }] },
    ],
  },
  {
    id: 2,
    name: '타일',
    brands: [
      { name: '세라믹', groups: [{ name: '세라믹타일', lines: ['클래식', '모던'] }] },
      { name: '포세린', groups: [{ name: '포세린타일', lines: ['프리미엄', '스탠다드'] }] },
    ],
  },
  {
    id: 3,
    name: '필름',
    brands: [
      { name: '3M', groups: [{ name: '데코필름', lines: ['데코', '프로텍션'] }] },
    ],
  },
  {
    id: 4,
    name: '장판',
    brands: [
      { name: '럭셔리', groups: [{ name: '장판', lines: ['프리미엄', '스탠다드'] }] },
    ],
  },
  {
    id: 5,
    name: '마루',
    brands: [
      { name: '오크', groups: [{ name: '마루', lines: ['내추럴', '모던'] }] },
    ],
  },
  {
    id: 6,
    name: '줄눈',
    brands: [
      { name: '줄눈', groups: [{ name: '줄눈', lines: ['스탠다드'] }] },
    ],
  },
  {
    id: 7,
    name: '탄성',
    brands: [
      { name: '탄성', groups: [{ name: '탄성코트', lines: ['스탠다드'] }] },
    ],
  },
];

export interface Sample {
  id: string;
  productNo: string;
  name: string;
  brand: string;
  line: string;
  specs: string[];
  image: string;
  categoryId?: number;
  materialType?: string;
  collection?: string;
  description?: string;
  detailSections?: Array<{ title: string; description: string }>;
  sourceLabel?: string;
}

export interface EditableSample extends Sample {
  categoryId: number;
  status: 'published' | 'draft';
  isCustom?: boolean;
}

export interface ManagedCategory {
  id: number;
  name: string;
  visible: boolean;
  order: number;
}

const CATEGORY_STORAGE_KEY = 'ebook-managed-categories-v1';

export function getManagedCategories(): ManagedCategory[] {
  const defaults = CATEGORIES.map((category, index) => ({
    id: category.id,
    name: category.name,
    visible: true,
    order: index,
  }));
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || 'null');
    if (!Array.isArray(saved)) return defaults;
    return saved
      .filter((item) => item && Number.isFinite(item.id) && typeof item.name === 'string')
      .map((item, index) => ({ id: item.id, name: item.name, visible: item.visible !== false, order: Number.isFinite(item.order) ? item.order : index }))
      .sort((a, b) => a.order - b.order);
  } catch {
    return defaults;
  }
}

export function saveManagedCategories(categories: ManagedCategory[]) {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories.map((category, order) => ({ ...category, order }))));
}

const PRIMO_COLLECTION_DESCRIPTION = '프리모는 공간과 삶의 질을 업그레이드하는 개나리벽지의 하이엔드 실크벽지 컬렉션입니다. 부드러운 디자인과 섬세한 엠보싱, 우수한 시공성 및 생활 내구성을 중심으로 설계되었습니다.';

const PRIMO_COMMON_DETAILS = [
  { title: '부드러운 리얼 텍스처', description: '부드러운 디자인과 섬세한 엠보싱이 어우러져 만질수록 깊이 있는 고급스러움을 연출합니다.' },
  { title: '무늬 맞춤 없는 편리한 시공성', description: '시간이 지나도 이음새가 벌어지거나 티 나지 않도록 설계되어 한 폭의 벽처럼 깨끗하고 미니멀한 공간을 완성합니다.' },
  { title: '더 향상된 두께감', description: '벽면 상태에 관계없이 시공 완성도가 높고, 긁힘과 찍힘에 강한 초내구성으로 깔끔함을 오래 유지합니다.' },
  { title: '생활 스크래치에 강한 고내구성', description: '생활 중 발생하는 찍힘과 긁힘 부담을 줄여 프리미엄 공간의 완성도를 오래 유지하도록 돕습니다.' },
];

const PRIMO_FAMILY_DETAILS: Record<string, Array<{ title: string; description: string }>> = {
  세이프가드: [
    { title: '반려동물제품 PS 인증', description: '반려동물 제품의 안전성과 품질 기준을 충족한 고기능성 제품군입니다.' },
    { title: '내스크래치성 30N', description: '기존 기준 12N 대비 강화된 내스크래치성을 확보해 반려동물과 함께하는 공간에 적합합니다.' },
    { title: '필름 같은 견고한 표면', description: '강한 표면 처리로 모서리나 걸레받이 주변이 쉽게 찢기거나 긁히지 않고 이음매도 깔끔하게 마감됩니다.' },
  ],
  플라스터: [
    { title: '깊고 사실적인 엠보 텍스처', description: '회벽과 스톤의 자연스러운 깊이와 변화를 표현해 손으로 완성한 듯한 입체적 공간을 연출합니다.' },
  ],
  페인트: [
    { title: '정제된 페인트 질감', description: '매트하고 차분한 페인트 표면감을 벽지의 편리한 시공성과 함께 제공합니다.' },
  ],
  패브릭: [
    { title: '편안한 패브릭 표면감', description: '섬세한 직물 조직과 부드러운 촉감으로 차분하고 안락한 실내 분위기를 완성합니다.' },
  ],
  천장용: [
    { title: '벽과 천장의 통일감', description: '프리모 벽면 제품과 조화되는 밝고 단정한 천장 마감으로 공간 전체의 완성도를 높입니다.' },
  ],
};

const PRIMO_SERIES = [
  { family: '세이프가드', series: '99705', variants: ['1', '2', '3', '4'] },
  { family: '세이프가드', series: '99704', variants: ['1', '2', '3'] },
  { family: '세이프가드', series: '99703', variants: ['1', '2', '3'] },
  { family: '세이프가드', series: '99702', variants: ['1', '2'] },
  { family: '세이프가드', series: '99701', variants: ['1', '2', '3'] },
  { family: '플라스터', series: '99128', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '99127', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '99126', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '99125', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '99124', variants: ['1', '2'] },
  { family: '플라스터', series: '99123', variants: ['1', '2'] },
  { family: '플라스터', series: '99121', variants: ['1', '2', '3'] },
  { family: '플라스터', series: '99117', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '99116', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '99115', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '99113', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '99112', variants: ['1', '2', '3'] },
  { family: '페인트', series: '99110', variants: ['1', '2', '5'] },
  { family: '페인트', series: '99109', variants: ['1'] },
  { family: '패브릭', series: '99120', variants: ['1', '2', '3', '4'] },
  { family: '패브릭', series: '99119', variants: ['1', '2', '3', '4'] },
  { family: '패브릭', series: '99118', variants: ['1', '2'] },
  { family: '패브릭', series: '99106', variants: ['1', '4', '6'] },
  { family: '패브릭', series: '99105', variants: ['1', '2', '5', '6'] },
  { family: '패브릭', series: '99104', variants: ['1', '2'] },
  { family: '천장용', series: '99001', variants: ['1'] },
] as const;

const PRIMO_SAMPLES: Sample[] = PRIMO_SERIES.flatMap(({ family, series, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `primo-${productNo}`,
      productNo,
      name: `프리모 ${family} ${productNo}`,
      brand: '개나리',
      line: family,
      materialType: '실크벽지',
      collection: '프리모',
      specs: ['하이엔드 실크벽지', family, '고내구성', '무늬 맞춤 없음'],
      image: '',
      description: PRIMO_COLLECTION_DESCRIPTION,
      detailSections: [...PRIMO_COMMON_DETAILS, ...(PRIMO_FAMILY_DETAILS[family] ?? [])],
      sourceLabel: '개나리벽지 PRIMO 2026 카탈로그',
    };
  })
);

const LOHAS_COLLECTION_DESCRIPTION = '로하스+는 자연과 함께 숨 쉬는 공간과 건강한 삶을 지향하는 개나리벽지의 프리미엄 실크벽지 컬렉션입니다. 자연에서 영감을 받은 깊이 있는 표면과 친환경·안전 기준을 함께 담았습니다.';

const LOHAS_COMMON_DETAILS = [
  { title: '9년 연속 UL 그린가드 골드 등급', description: '실내 공기질과 저방출 기준을 고려한 제품으로 건강한 생활 공간을 만드는 데 적합합니다.' },
  { title: '환경과 안전을 고려한 소재', description: '저탄소 녹색제품, 환경표지 인증, 대한아토피협회 추천과 식물성 원료 PLA 코팅을 적용하고 8대 중금속 안전 기준을 확인했습니다.' },
  { title: '곰팡이 번식 억제', description: '항곰팡이 수지층을 적용해 일상 공간을 더욱 위생적으로 유지하도록 돕습니다.' },
  { title: '고압·고온 엠보싱', description: '고온 건조 공정으로 무늬의 깊이감이 오래 유지되며 정교한 엠보 기술로 자연스러운 리얼 텍스처를 구현합니다.' },
  { title: '정밀한 품질 관리', description: '자동 코팅 중량 제어 시스템과 글로벌 엠보 롤 전문기업 협업으로 색상 편차를 줄이고 독점 패턴을 완성합니다.' },
];

const LOHAS_FAMILY_DETAILS: Record<string, Array<{ title: string; description: string }>> = {
  플라스터: [{ title: '자연을 닮은 플라스터 질감', description: '회벽, 미네랄, 모래, 점토에서 영감을 받은 깊고 차분한 표면으로 편안한 공간을 연출합니다.' }],
  위브: [{ title: '섬세한 직물 조직', description: '코튼, 리넨, 부클레 등 패브릭 조직을 정교하게 표현해 따뜻하고 자연스러운 공간을 완성합니다.' }],
  디자인: [{ title: '공간의 포인트가 되는 패턴', description: '마블, 보태니컬, 아틀리에 감성의 패턴을 절제된 색상으로 표현해 다양한 인테리어에 조화됩니다.' }],
  페인트: [{ title: '도시적이고 차분한 페인트 표면', description: '어반·클레이 페인트의 매트한 감성을 실크벽지의 관리 편의성과 함께 제공합니다.' }],
  천장용: [{ title: '벽과 천장의 자연스러운 연결', description: '밝고 단정한 천장 전용 제품으로 로하스+ 벽면 컬렉션과 조화로운 마감을 제공합니다.' }],
};

const LOHAS_SERIES = [
  { family: '플라스터', series: '87493', design: 'Serenity Wall', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '87492', design: 'Natural Plaster', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '87491', design: 'Luna Plaster', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '87490', design: 'Touch Coat', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '87456', design: 'Matte Plaster', variants: ['1', '2', '3', '4', '5', '7', '8'] },
  { family: '플라스터', series: '87489', design: 'Maison Plaster', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '87488', design: 'Mineral Plaster', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '87487', design: 'Straw Plaster', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '87486', design: 'Sand Plaster', variants: ['1', '2', '3', '4', '5'] },
  { family: '위브', series: '87483', design: 'Cotton Weave', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87481', design: 'Natural Weave', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87480', design: 'Dove Weave', variants: ['1', '2', '3', '4', '5'] },
  { family: '위브', series: '87479', design: 'Grain Weave', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87478', design: 'Layer Weave', variants: ['1', '2', '3'] },
  { family: '디자인', series: '87485', design: 'Classic Marble', variants: ['1', '2'] },
  { family: '디자인', series: '87484', design: 'Atelier', variants: ['1', '2'] },
  { family: '디자인', series: '87482', design: 'Botanical Stitch', variants: ['1', '2', '3'] },
  { family: '플라스터', series: '87477', design: 'Flow Plaster', variants: ['1', '2'] },
  { family: '플라스터', series: '87476', design: 'Clay Plaster', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터', series: '87475', design: 'French Plaster', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '87474', design: 'Volcanic Plaster', variants: ['1', '2', '3'] },
  { family: '디자인', series: '87472', design: 'Natural Accent', variants: ['1'] },
  { family: '디자인', series: '87471', design: 'Natural Accent', variants: ['1', '2', '3', '4'] },
  { family: '플라스터', series: '87470', design: 'Fine Plaster', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87469', design: 'New Cotton', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87468', design: 'Neo Linen', variants: ['1', '2', '3'] },
  { family: '위브', series: '87467', design: 'Bouclé', variants: ['1', '2', '3', '4'] },
  { family: '위브', series: '87464', design: 'Plain Weave', variants: ['1', '2'] },
  { family: '위브', series: '87461', design: 'Nouve', variants: ['1', '2', '5'] },
  { family: '위브', series: '87460', design: 'Bermuda', variants: ['1', '2', '3', '5'] },
  { family: '플라스터', series: '87457', design: 'Deep Plaster', variants: ['1', '2'] },
  { family: '페인트', series: '87451', design: 'Urban and Clay Paint', variants: ['1', '7'] },
  { family: '페인트', series: '87450', design: 'Urban and Clay Paint', variants: ['1'] },
  { family: '천장용', series: '54170', design: 'Ceiling', variants: ['1', '2'] },
  { family: '천장용', series: '54160', design: 'Ceiling', variants: ['1', '2'] },
  { family: '천장용', series: '54013', design: 'Ceiling', variants: ['1', '2'] },
] as const;

const LOHAS_SAMPLES: Sample[] = LOHAS_SERIES.flatMap(({ family, series, design, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `lohas-${productNo}`,
      productNo,
      name: `로하스+ ${design} ${productNo}`,
      brand: '개나리',
      line: family,
      materialType: '실크벽지',
      collection: '로하스+',
      specs: ['프리미엄 실크벽지', family, '친환경', 'PLA 코팅'],
      image: '',
      description: LOHAS_COLLECTION_DESCRIPTION,
      detailSections: [...LOHAS_COMMON_DETAILS, ...(LOHAS_FAMILY_DETAILS[family] ?? [])],
      sourceLabel: '개나리벽지 LOHAS+ 2026 카탈로그',
    };
  })
);

export function ensureCatalogCollections<T>(source: T): T {
  const next: any = structuredClone(source);
  const wallpaper = next.find((category: any) => category.id === 1 || category.name === '도배');
  const gaenari = wallpaper?.brands.find((brand: any) => brand.name === '개나리');
  if (!gaenari) return next;

  let silk = gaenari.materialTypes?.find((materialType: any) => materialType.name === '실크벽지');
  if (!silk) {
    silk = gaenari.materialTypes?.find((materialType: any) => materialType.name === '실크');
    if (silk) silk.name = '실크벽지';
  }
  if (!silk) {
    silk = { name: '실크벽지', groups: [] };
    gaenari.materialTypes = [...(gaenari.materialTypes ?? []), silk];
  }

  const collections = [
    { name: '프리모', lines: ['세이프가드', '플라스터', '페인트', '패브릭', '천장용'] },
    { name: '로하스+', lines: ['플라스터', '위브', '디자인', '페인트', '천장용'] },
  ];
  collections.reverse().forEach((collection) => {
    const existing = silk.groups?.find((group: any) => group.name === collection.name);
    if (existing) existing.lines = Array.from(new Set([...(existing.lines ?? []), ...collection.lines]));
    else silk.groups = [collection, ...(silk.groups ?? [])];
  });

  return next;
}

export function sampleMatchesCatalogSelection(
  sample: Sample,
  selection: { group?: string; line?: string },
): boolean {
  if (selection.group && ['프리모', '로하스+'].includes(selection.group) && sample.collection !== selection.group) return false;
  if (selection.line && sample.line !== selection.line) return false;
  return true;
}

// 카테고리별 샘플 데이터
export const MOCK_SAMPLES: Record<number, Sample[]> = {
  1: [
    ...PRIMO_SAMPLES,
    ...LOHAS_SAMPLES,
    // --- 프리모 컬렉션 ---
    { id: '1-1', productNo: '92102-1', name: '프리모 크랙 화이트', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '크랙 텍스처'], image: '/images/wallpaper/92102-1.jpg' },
    { id: '1-2', productNo: '92102-2', name: '프리모 크랙 아이보리', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '크랙 텍스처'], image: '/images/wallpaper/92102-2.jpg' },
    { id: '1-3', productNo: '92101-1', name: '프리모 회벽 화이트', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '리얼 회벽 텍스처'], image: '/images/wallpaper/92101-1.jpg' },
    { id: '1-4', productNo: '92101-2', name: '프리모 회벽 그레이', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '리얼 회벽 텍스처'], image: '/images/wallpaper/92101-2.jpg' },
    // --- Plaster&Paint 컬렉션 ---
    { id: '1-5', productNo: '91205-1', name: '플라스터 내추럴 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-1.jpg' },
    { id: '1-6', productNo: '91205-2', name: '플라스터 내추럴 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-2.jpg' },
    { id: '1-7', productNo: '91205-3', name: '플라스터 내추럴 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-3.jpg' },
    { id: '1-8', productNo: '91205-4', name: '플라스터 내추럴 다크', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-4.jpg' },
    { id: '1-9', productNo: '91204-1', name: '플라스터 우드 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-1.jpg' },
    { id: '1-10', productNo: '91204-2', name: '플라스터 우드 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-2.jpg' },
    { id: '1-11', productNo: '91204-3', name: '플라스터 우드 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-3.jpg' },
    { id: '1-12', productNo: '91193-1', name: '플라스터 스톤 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-1.jpg' },
    { id: '1-13', productNo: '91193-2', name: '플라스터 스톤 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-2.jpg' },
    { id: '1-14', productNo: '91193-3', name: '플라스터 스톤 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-3.jpg' },
    { id: '1-15', productNo: '91203-1', name: '플라스터 딥터치 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-1.jpg' },
    { id: '1-16', productNo: '91203-2', name: '플라스터 딥터치 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-2.jpg' },
    { id: '1-17', productNo: '91203-3', name: '플라스터 딥터치 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-3.jpg' },
    { id: '1-18', productNo: '91203-4', name: '플라스터 딥터치 다크', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-4.jpg' },
    { id: '1-19', productNo: '91202-1', name: '리얼페인트 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-1.jpg' },
    { id: '1-20', productNo: '91202-2', name: '리얼페인트 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-2.jpg' },
    { id: '1-21', productNo: '91202-3', name: '리얼페인트 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-3.jpg' },
    { id: '1-22', productNo: '91201-1', name: '리얼페인트 플레인 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-1.jpg' },
    { id: '1-23', productNo: '91201-2', name: '리얼페인트 플레인 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-2.jpg' },
    { id: '1-24', productNo: '91201-3', name: '리얼페인트 플레인 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-3.jpg' },
    { id: '1-25', productNo: '91190-1', name: '리얼페인트 라이트 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '라이트 텍스처'], image: '/images/wallpaper/91190-1.jpg' },
    { id: '1-26', productNo: '91190-2', name: '리얼페인트 라이트 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '라이트 텍스처'], image: '/images/wallpaper/91190-2.jpg' },
    { id: '1-27', productNo: '90138-1', name: '리얼페인트 베이직', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '베이직 텍스처'], image: '/images/wallpaper/90138-1.jpg' },
    // --- Simple Fabric 컬렉션 ---
    { id: '1-28', productNo: '91200-1', name: '심플패브릭 리넨 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-1.jpg' },
    { id: '1-29', productNo: '91200-2', name: '심플패브릭 리넨 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-2.jpg' },
    { id: '1-30', productNo: '91200-3', name: '심플패브릭 리넨 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-3.jpg' },
    { id: '1-31', productNo: '91199-1', name: '심플패브릭 소프트 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-1.jpg' },
    { id: '1-32', productNo: '91199-2', name: '심플패브릭 소프트 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-2.jpg' },
    { id: '1-33', productNo: '91199-3', name: '심플패브릭 소프트 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-3.jpg' },
    { id: '1-34', productNo: '91198-1', name: '심플패브릭 믹스 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-1.jpg' },
    { id: '1-35', productNo: '91198-2', name: '심플패브릭 믹스 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-2.jpg' },
    { id: '1-36', productNo: '91198-3', name: '심플패브릭 믹스 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-3.jpg' },
    { id: '1-37', productNo: '91198-4', name: '심플패브릭 믹스 베이지', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-4.jpg' },
    { id: '1-38', productNo: '91198-5', name: '심플패브릭 믹스 다크', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-5.jpg' },
    // --- Urban Fabric 컬렉션 ---
    { id: '1-39', productNo: '91187-1', name: '어반패브릭 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-1.jpg' },
    { id: '1-40', productNo: '91187-2', name: '어반패브릭 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-2.jpg' },
    { id: '1-41', productNo: '91187-4', name: '어반패브릭 라이트 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-4.jpg' },
    { id: '1-42', productNo: '91187-5', name: '어반패브릭 블루 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-5.jpg' },
    { id: '1-43', productNo: '91051-1', name: '어반패브릭 크림', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '크림 패브릭 텍스처'], image: '/images/wallpaper/91051-1.jpg' },
    { id: '1-44', productNo: '90142-1', name: '어반패브릭 플레인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-1.jpg' },
    { id: '1-45', productNo: '90142-2', name: '어반패브릭 플레인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-2.jpg' },
    { id: '1-46', productNo: '90142-3', name: '어반패브릭 플레인 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-3.jpg' },
    { id: '1-47', productNo: '91186-1', name: '터치패브릭 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패브릭 터치'], image: '/images/wallpaper/91186-1.jpg' },
    { id: '1-48', productNo: '91186-3', name: '터치패브릭 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패브릭 터치'], image: '/images/wallpaper/91186-3.jpg' },
    { id: '1-49', productNo: '90141-1', name: '터치패브릭 소프트 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '소프트 패브릭'], image: '/images/wallpaper/90141-1.jpg' },
    { id: '1-50', productNo: '90141-2', name: '터치패브릭 소프트 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '소프트 패브릭'], image: '/images/wallpaper/90141-2.jpg' },
    { id: '1-51', productNo: '91180-1', name: '어반 체크 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '체크 패브릭'], image: '/images/wallpaper/91180-1.jpg' },
    { id: '1-52', productNo: '91180-4', name: '어반 체크 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '체크 패브릭'], image: '/images/wallpaper/91180-4.jpg' },
    { id: '1-53', productNo: '91185-1b', name: '어반 패턴 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 텍스처'], image: '/images/wallpaper/91185-1b.jpg' },
    { id: '1-54', productNo: '91197-1', name: '어반 패턴 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 텍스처'], image: '/images/wallpaper/91197-1.jpg' },
    { id: '1-55', productNo: '91197-2', name: '어반 패턴 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 텍스처'], image: '/images/wallpaper/91197-2.jpg' },
    { id: '1-56', productNo: '91197-3', name: '어반 패턴 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 텍스처'], image: '/images/wallpaper/91197-3.jpg' },
    { id: '1-57', productNo: '91196-1', name: '어반 플레인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-1.jpg' },
    { id: '1-58', productNo: '91196-2', name: '어반 플레인 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-2.jpg' },
    { id: '1-59', productNo: '91196-3', name: '어반 플레인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-3.jpg' },
    { id: '1-60', productNo: '91185-1', name: '어반 스트라이프 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-1.jpg' },
    { id: '1-61', productNo: '91185-2', name: '어반 스트라이프 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-2.jpg' },
    { id: '1-62', productNo: '91185-4', name: '어반 스트라이프 블루', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-4.jpg' },
    { id: '1-63', productNo: '91194-1', name: '어반 라인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '라인 텍스처'], image: '/images/wallpaper/91194-1.jpg' },
    { id: '1-64', productNo: '91194-2', name: '어반 라인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '라인 텍스처'], image: '/images/wallpaper/91194-2.jpg' },
    { id: '1-65', productNo: '91182-1', name: '어반 믹스 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-1.jpg' },
    { id: '1-66', productNo: '91182-2', name: '어반 믹스 핑크', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-2.jpg' },
    { id: '1-67', productNo: '91182-3', name: '어반 믹스 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-3.jpg' },
    // --- Kids 컬렉션 ---
    { id: '1-68', productNo: '91181-2', name: '키즈 옐로우', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/91181-2.jpg' },
    { id: '1-69', productNo: '90139-1', name: '키즈 핑크', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-1.jpg' },
    { id: '1-70', productNo: '90139-3', name: '키즈 민트', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-3.jpg' },
    { id: '1-71', productNo: '90139-4', name: '키즈 라임', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-4.jpg' },
    // --- Ceiling 컬렉션 ---
    { id: '1-72', productNo: '90013-1', name: '천장 텍스처 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90013-1.jpg' },
    { id: '1-73', productNo: '90170-1', name: '천장 스무스 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90170-1.jpg' },
    { id: '1-74', productNo: '90170-2', name: '천장 스무스 아이보리', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90170-2.jpg' },
    { id: '1-75', productNo: '90160-1', name: '천장 플레인 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90160-1.jpg' },
    { id: '1-76', productNo: '90160-2', name: '천장 플레인 아이보리', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90160-2.jpg' },
    { id: '1-77', productNo: '91054-1', name: '천장 프리미엄 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용', '프리미엄'], image: '/images/wallpaper/91054-1.jpg' },
  ],
  2: [
    { id: '2-1', productNo: '82102-1', name: '세라믹 타일', brand: '세라믹', line: '클래식', specs: ['300x300', '광택'], image: 'https://via.placeholder.com/400x400?text=Tile+1' },
  ],
  3: [
    { id: '3-1', productNo: '72102-1', name: '3M 데코 필름', brand: '3M', line: '프리미엄', specs: ['투명', '방수'], image: 'https://via.placeholder.com/400x400?text=Film+1' },
  ],
  4: [
    { id: '4-1', productNo: '62102-1', name: '럭셔리 장판', brand: '럭셔리', line: '프리미엄', specs: ['방음', '내구성'], image: 'https://via.placeholder.com/400x400?text=Flooring+1' },
  ],
  5: [
    { id: '5-1', productNo: '52102-1', name: '오크 마루', brand: '오크', line: '내추럴', specs: ['천연 목재', '고급 마감'], image: 'https://via.placeholder.com/400x400?text=Wood+1' },
  ],
  6: [
    { id: '6-1', productNo: '42102-1', name: '줄눈 스탠다드', brand: '줄눈', line: '스탠다드', specs: ['방수', '내구성'], image: 'https://via.placeholder.com/400x400?text=Grout+1' },
  ],
  7: [
    { id: '7-1', productNo: '32102-1', name: '탄성코트 스탠다드', brand: '탄성', line: '스탠다드', specs: ['방수', '탄성'], image: 'https://via.placeholder.com/400x400?text=Coat+1' },
  ],
};

// 전체 샘플 flat 배열 (상세페이지 조회용)
export const ALL_SAMPLES: Sample[] = Object.entries(MOCK_SAMPLES).flatMap(([catId, samples]) =>
  samples.map((s) => ({ ...s, categoryId: Number(catId) }))
);

const CATALOG_KEY = 'ebook.catalog.samples.v1';
const HIDDEN_KEY = 'ebook.catalog.hidden.v1';

function publicAssetUrl(value: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return value;
  if (value.startsWith(import.meta.env.BASE_URL)) return value;
  return `${import.meta.env.BASE_URL}${value.slice(1)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function getCatalogSamples(includeDrafts = false): EditableSample[] {
  const saved = readJson<EditableSample[]>(CATALOG_KEY, []);
  const hidden = new Set(readJson<string[]>(HIDDEN_KEY, []));
  const savedById = new Map(saved.map((sample) => [sample.id, sample]));
  const base = ALL_SAMPLES.map((sample) => ({
    ...sample,
    categoryId: sample.categoryId ?? 1,
    status: 'published' as const,
    ...savedById.get(sample.id),
  }));
  const custom = saved.filter((sample) => !ALL_SAMPLES.some((baseSample) => baseSample.id === sample.id));
  return [...base, ...custom]
    .filter((sample) => !hidden.has(sample.id) && (includeDrafts || sample.status === 'published'))
    .map((sample) => ({ ...sample, image: publicAssetUrl(sample.image) }));
}

export function saveCatalogSample(sample: EditableSample): void {
  const saved = readJson<EditableSample[]>(CATALOG_KEY, []);
  const next = [...saved.filter((item) => item.id !== sample.id), sample];
  localStorage.setItem(CATALOG_KEY, JSON.stringify(next));
  const hidden = readJson<string[]>(HIDDEN_KEY, []).filter((id) => id !== sample.id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
}

export function deleteCatalogSample(id: string): void {
  const saved = readJson<EditableSample[]>(CATALOG_KEY, []).filter((sample) => sample.id !== id);
  localStorage.setItem(CATALOG_KEY, JSON.stringify(saved));
  const hidden = new Set(readJson<string[]>(HIDDEN_KEY, []));
  hidden.add(id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hidden)));
}

export function exportCatalogBundle(): string {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    samples: readJson<EditableSample[]>(CATALOG_KEY, []),
    hiddenSampleIds: readJson<string[]>(HIDDEN_KEY, []),
  }, null, 2);
}

export function importCatalogBundle(source: string): void {
  const bundle = JSON.parse(source) as { version?: number; samples?: EditableSample[]; hiddenSampleIds?: string[] };
  if (bundle.version !== 1 || !Array.isArray(bundle.samples) || !Array.isArray(bundle.hiddenSampleIds)) {
    throw new Error('지원하지 않는 샘플북 백업 파일입니다.');
  }
  const valid = bundle.samples.every((sample) => typeof sample.id === 'string' && typeof sample.productNo === 'string' && typeof sample.name === 'string' && Array.isArray(sample.specs));
  if (!valid) throw new Error('샘플 데이터 형식이 올바르지 않습니다.');
  localStorage.setItem(CATALOG_KEY, JSON.stringify(bundle.samples));
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(bundle.hiddenSampleIds));
}

// ID로 샘플 찾기
export function findSampleById(id: string): (Sample & { categoryId: number }) | undefined {
  const found = getCatalogSamples(true).find((s) => s.id === id);
  if (!found) return undefined;
  return { ...found, categoryId: found.categoryId ?? 1 };
}

// 카테고리 ID로 카테고리 이름 찾기
export function getCategoryName(categoryId: number): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.name ?? '';
}
