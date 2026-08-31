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
  color?: string;
  colorFamily?: string;
  pattern?: string;
  grade?: string;
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

const ARTBOOK_COLLECTION_DESCRIPTION = '아트북은 자연에서 영감을 받은 텍스처와 편안한 색감으로 일상 공간을 완성하는 개나리벽지의 친환경 실크벽지 컬렉션입니다. 패브릭·플라스터·페인트를 비롯한 다채로운 표면 표현과 기능성 디자인을 함께 담았습니다.';

const ARTBOOK_COMMON_DETAILS = [
  { title: '옥수수 유래 PLA 식물성 코팅', description: '천연 옥수수에서 유래한 식물성 수지(PLA)를 표면 코팅에 적용한 친환경 벽지입니다.' },
  { title: '곰팡이 발생 억제', description: '항곰팡이 수지층을 적용해 곰팡이 발생을 억제하고 실내 공간을 위생적으로 유지하도록 돕습니다.' },
  { title: '6년 연속 UL 그린가드 골드', description: '저방출 제품을 위한 UL 그린가드 골드 기준을 6년 연속 충족한 컬렉션입니다.' },
  { title: '생활 공간을 고려한 안전성', description: '환경표지 인증, 대한아토피협회 추천, KCL 안전성 테스트를 거쳤으며 납·수은·카드뮴 등 8대 중금속 불검출 기준을 확인했습니다.' },
];

const ARTBOOK_FAMILY_DETAILS: Record<string, Array<{ title: string; description: string }>> = {
  패브릭: [{ title: '섬세한 패브릭 조직', description: '직물의 짜임과 부드러운 촉감을 입체적으로 표현해 따뜻하고 편안한 공간을 연출합니다.' }],
  플라스터: [{ title: '자연스러운 플라스터 표면', description: '회벽과 미네랄에서 영감을 받은 불규칙한 결을 담아 차분하면서도 깊이 있는 벽면을 완성합니다.' }],
  페인트: [{ title: '매트한 페인트 감성', description: '정돈된 페인트 표면과 크림 화이트·베이지 계열의 편안한 색상으로 다양한 인테리어에 자연스럽게 어울립니다.' }],
  텍스처: [{ title: '공간에 깊이를 더하는 텍스처', description: '자연 소재의 결을 현대적으로 재해석한 표면과 절제된 색감으로 벽면에 은은한 입체감을 더합니다.' }],
  기능성: [{ title: '빛을 담는 축광 포인트', description: '빛을 저장했다가 어두운 환경에서 은은하게 발광하는 축광 디자인으로 특별한 포인트 공간을 연출합니다.' }],
  피너츠: [{ title: '피너츠 캐릭터 디자인', description: '스누피와 피너츠 캐릭터를 활용한 친근한 패턴으로 아이 방과 포인트 공간에 즐거운 분위기를 더합니다.' }],
  천장용: [{ title: '벽과 천장의 조화', description: '밝고 단정한 천장 전용 디자인으로 아트북 벽면 제품과 자연스럽게 이어지는 마감을 제공합니다.' }],
};

const ARTBOOK_SERIES = [
  { family: '패브릭', series: '57233', design: 'Real Fabric Touch', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '패브릭', series: '57232', design: 'Simple Fabric', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '57231', design: 'Plaster Wall', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '플라스터', series: '57230', design: 'Plaster Texture', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '57229', design: 'Raw Plaster', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '플라스터', series: '57228', design: 'Crafted Wall', variants: ['1', '2', '3', '4', '5'] },
  { family: '페인트', series: '57210', design: 'Paint Collection', variants: ['1', '2', '3', '6', '7', '8', '9', '10'] },
  { family: '텍스처', series: '57227', design: 'Art Texture', variants: ['1', '2'] },
  { family: '텍스처', series: '57226', design: 'Art Texture', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '텍스처', series: '57225', design: 'Art Texture', variants: ['1', '2', '3', '4'] },
  { family: '텍스처', series: '57224', design: 'Art Texture', variants: ['1', '2', '3', '4', '5'] },
  { family: '텍스처', series: '57223', design: 'Art Texture', variants: ['1', '2', '3', '4'] },
  { family: '텍스처', series: '57219', design: 'Art Texture', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '텍스처', series: '57218', design: 'Art Texture', variants: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { family: '텍스처', series: '57217', design: 'Art Texture', variants: ['1', '2', '3', '4', '5', '6', '8'] },
  { family: '텍스처', series: '57215', design: 'Art Texture', variants: ['1', '2', '3', '4'] },
  { family: '텍스처', series: '57206', design: 'Art Texture', variants: ['1', '2', '3', '4', '6', '7'] },
  { family: '텍스처', series: '57205', design: 'Art Texture', variants: ['1', '2', '3', '5'] },
  { family: '텍스처', series: '57198', design: 'Art Texture', variants: ['1', '3'] },
  { family: '텍스처', series: '57196', design: 'Art Texture', variants: ['1', '2', '3', '6', '9'] },
  { family: '텍스처', series: '57190', design: 'Art Texture', variants: ['1', '2', '3', '5'] },
  { family: '텍스처', series: '57160', design: 'Art Texture', variants: ['1', '28', '39', '40'] },
  { family: '기능성', series: '57222', design: 'Glow Wallpaper', variants: ['1'] },
  { family: '기능성', series: '57221', design: 'Glow Wallpaper', variants: ['1'] },
  { family: '텍스처', series: '57220', design: 'Art Texture', variants: ['1', '2', '3', '4', '5'] },
  { family: '피너츠', series: '83204', design: 'Peanuts Wallpaper', variants: ['2'] },
  { family: '피너츠', series: '83218', design: 'Peanuts Wallpaper', variants: ['3'] },
  { family: '피너츠', series: '83210', design: 'Peanuts Wallpaper', variants: ['1'] },
  { family: '피너츠', series: '83209', design: 'Peanuts Wallpaper', variants: ['2'] },
  { family: '피너츠', series: '83206', design: 'Peanuts Wallpaper', variants: ['1'] },
  { family: '천장용', series: '54170', design: 'Ceiling', variants: ['1', '2'] },
  { family: '천장용', series: '54160', design: 'Ceiling', variants: ['1', '2'] },
  { family: '천장용', series: '54013', design: 'Ceiling', variants: ['1', '2'] },
] as const;

const ARTBOOK_SAMPLES: Sample[] = ARTBOOK_SERIES.flatMap(({ family, series, design, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `artbook-${productNo}`,
      productNo,
      name: `아트북 ${design} ${productNo}`,
      brand: '개나리',
      line: family,
      materialType: '실크벽지',
      collection: '아트북',
      specs: ['친환경 실크벽지', family, 'PLA 식물성 코팅', '항곰팡이'],
      image: '',
      description: ARTBOOK_COLLECTION_DESCRIPTION,
      detailSections: [...ARTBOOK_COMMON_DETAILS, ...(ARTBOOK_FAMILY_DETAILS[family] ?? [])],
      sourceLabel: '개나리벽지 Artbook 카탈로그',
    };
  })
);

const WIDE_PAPER_COLLECTION_DESCRIPTION = '트랜디는 자연에서 영감을 받은 디자인과 다채로운 색감, 생활 친화적인 기능을 담은 개나리벽지의 프리미엄 광폭합지 컬렉션입니다. 포근한 패브릭부터 깔끔한 플라스터와 키즈·타일·천장 디자인까지 폭넓게 구성했습니다.';

const WIDE_PAPER_COMMON_DETAILS = [
  { title: '피톤치드로 더 쾌적하게', description: '피톤치드층이 실내 유해 물질 감소를 돕고 항균·항진균, 스트레스 완화와 심신 안정에 도움을 주도록 설계했습니다.' },
  { title: '수성잉크를 사용한 친환경 합지', description: '발암물질 부담을 줄인 수성인쇄층과 항균코팅층을 적용해 생활 공간에서 안심하고 사용할 수 있도록 했습니다.' },
  { title: '오염방지로 더 깨끗하게', description: '일상에서 생기는 오염을 보다 편리하게 관리할 수 있도록 표면 기능을 강화했습니다.' },
  { title: '검증된 친환경 품질', description: '환경표지 인증과 친환경 건축자재 인증을 받았으며 납·카드뮴·크롬·수은 등 8대 중금속 불검출 시험을 통과했습니다.' },
];

const WIDE_PAPER_FAMILY_DETAILS: Record<string, Array<{ title: string; description: string }>> = {
  패브릭: [{ title: '자연스러운 직물 질감', description: '섬세한 직물 조직과 부드러운 색감으로 포근하고 편안한 분위기를 만듭니다.' }],
  '플라스터·페인트': [{ title: '깔끔하고 모던한 표면', description: '스투코, 샌드 플라스터, 페인트와 스톤의 질감을 합지에 담아 차분하고 현대적인 공간을 완성합니다.' }],
  디자인: [{ title: '공간에 활력을 더하는 패턴', description: '플라워, 우드랜드와 장식 패턴을 다양한 색상으로 구성해 포인트 공간에 잘 어울립니다.' }],
  키즈: [{ title: '행복이 머무는 아이 공간', description: '부드러운 색과 친근한 패턴으로 아이 방에 편안하고 즐거운 분위기를 더합니다.' }],
  타일패턴: [{ title: '간편하게 연출하는 타일 감성', description: '타일의 정돈된 패턴을 광폭합지로 표현해 주방과 포인트 벽면을 손쉽게 연출합니다.' }],
  천장용: [{ title: '밝고 단정한 천장 마감', description: '벽면 제품과 자연스럽게 조화되는 천장 전용 디자인으로 공간 전체의 완성도를 높입니다.' }],
};

const WIDE_PAPER_SERIES = [
  { family: '패브릭', series: '39394', design: 'Bloom Cotton', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '패브릭', series: '39393', design: 'Eden Fabric', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '패브릭', series: '39392', design: 'Silhouette Cotton', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터·페인트', series: '39391', design: 'European Stucco', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터·페인트', series: '39390', design: 'Sand Plaster', variants: ['1', '2', '3', '4'] },
  { family: '플라스터·페인트', series: '39389', design: 'Art Stucco', variants: ['1', '2', '3'] },
  { family: '디자인', series: '39388', design: 'Forest Woodland', variants: ['1', '2'] },
  { family: '디자인', series: '39387', design: 'Floral Whisper', variants: ['1'] },
  { family: '디자인', series: '28352', design: 'La Beauté', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '패브릭', series: '39374', design: 'Soft Wall', variants: ['1', '2', '3', '4', '6', '7'] },
  { family: '패브릭', series: '28372', design: 'Twisted Texture', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '패브릭', series: '39386', design: 'Trendy Fabric', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '패브릭', series: '39385', design: 'Luxe Fleece Touch', variants: ['1', '2', '3', '4'] },
  { family: '패브릭', series: '39384', design: 'Trendy Fabric', variants: ['1'] },
  { family: '패브릭', series: '39383', design: 'Trendy Fabric', variants: ['1', '2', '3', '4', '5'] },
  { family: '패브릭', series: '28371', design: 'Raw Urban Touch', variants: ['1', '2', '3', '4', '5', '9'] },
  { family: '패브릭', series: '39369', design: 'Trendy Fabric', variants: ['1', '2', '3', '5', '6'] },
  { family: '플라스터·페인트', series: '39382', design: 'Ceramic Wall Serenity', variants: ['1', '2', '3', '4', '5'] },
  { family: '플라스터·페인트', series: '39371', design: 'Real Paint', variants: ['1', '2', '3', '4', '6', '7', '8', '9'] },
  { family: '플라스터·페인트', series: '39381', design: 'Real Travertine', variants: ['1', '2'] },
  { family: '플라스터·페인트', series: '39380', design: 'Line Plaster', variants: ['1'] },
  { family: '플라스터·페인트', series: '39379', design: 'Rugged Earth Texture', variants: ['1', '2'] },
  { family: '패브릭', series: '39378', design: 'Zen Fabric', variants: ['1', '2'] },
  { family: '플라스터·페인트', series: '39377', design: 'Cloud Marble', variants: ['1', '2'] },
  { family: '플라스터·페인트', series: '28336', design: 'Trendy Texture', variants: ['1', '2'] },
  { family: '패브릭', series: '39372', design: 'Cozy Grey Hues', variants: ['1', '2', '3'] },
  { family: '플라스터·페인트', series: '28348', design: 'Trendy Texture', variants: ['2', '3'] },
  { family: '플라스터·페인트', series: '28366', design: 'Trendy Texture', variants: ['1', '2', '3', '4'] },
  { family: '플라스터·페인트', series: '28370', design: 'Trendy Texture', variants: ['1', '2', '5'] },
  { family: '플라스터·페인트', series: '28365', design: 'Simple Painting', variants: ['1', '2', '3', '5'] },
  { family: '플라스터·페인트', series: '28349', design: 'Trendy Texture', variants: ['1', '2', '7'] },
  { family: '플라스터·페인트', series: '28364', design: 'Realistic Stucco Paint', variants: ['1', '2', '3', '5', '6'] },
  { family: '플라스터·페인트', series: '28363', design: 'Rough-Soft Harmony', variants: ['1', '2', '3', '4'] },
  { family: '키즈', series: '39376', design: 'Cozy Stripe', variants: ['1'] },
  { family: '키즈', series: '39375', design: 'Kids Wallpaper', variants: ['1', '2'] },
  { family: '타일패턴', series: '64023', design: 'Tile Wallpaper', variants: ['1'] },
  { family: '타일패턴', series: '64022', design: 'Tile Wallpaper', variants: ['1'] },
  { family: '타일패턴', series: '64014', design: 'Tile Wallpaper', variants: ['1', '2'] },
  { family: '타일패턴', series: '64024', design: 'Tile Wallpaper', variants: ['1', '2'] },
  { family: '천장용', series: '39034', design: 'Ceiling', variants: ['1'] },
  { family: '천장용', series: '29080', design: 'Ceiling', variants: ['1', '2'] },
  { family: '천장용', series: '28293', design: 'Ceiling', variants: ['1', '2'] },
] as const;

const WIDE_PAPER_SAMPLES: Sample[] = WIDE_PAPER_SERIES.flatMap(({ family, series, design, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `wide-paper-${productNo}`,
      productNo,
      name: `트랜디 ${design} ${productNo}`,
      brand: '개나리',
      line: family,
      materialType: '합지',
      collection: '광폭합지',
      specs: ['프리미엄 광폭합지', family, '피톤치드', '수성잉크', '오염방지'],
      image: '',
      description: WIDE_PAPER_COLLECTION_DESCRIPTION,
      detailSections: [...WIDE_PAPER_COMMON_DETAILS, ...(WIDE_PAPER_FAMILY_DETAILS[family] ?? [])],
      sourceLabel: '개나리벽지 TRENDY 카탈로그',
    };
  })
);

const WALLGUARD_COLLECTION_DESCRIPTION = '월가드는 생활 스크래치와 오염에 강한 표면, 차분한 저광택 질감과 안전성을 함께 고려한 신한벽지의 고내구성 실크벽지 컬렉션입니다. 반려동물과 함께하는 공간부터 주거·상업 공간까지 폭넓게 활용할 수 있습니다.';

const WALLGUARD_COMMON_DETAILS = [
  { title: '20배 강화된 내구성', description: '일상에서 발생하는 긁힘과 찍힘에 강하도록 표면 내구성을 강화해 깔끔한 벽면을 오래 유지하도록 돕습니다.' },
  { title: '스크래치 걱정을 줄인 표면', description: '반려동물의 발톱과 생활 마찰에 대응하는 견고한 표면으로 관리 부담을 줄였습니다.' },
  { title: '반려동물 생활에 적합한 PS 인증', description: '반려동물 제품 안전성과 품질 기준을 확인한 PS 인증 제품으로 반려동물과 함께하는 공간에 적합합니다.' },
  { title: '차분한 저광택 고급 질감', description: '빛 반사를 줄인 매트한 표면과 섬세한 엠보로 정돈되고 편안한 공간 분위기를 연출합니다.' },
  { title: '시험과 인증으로 확인한 품질', description: '카탈로그에 제시된 국내외 시험과 인증 자료를 바탕으로 유해 물질 관리, 내구성과 생활 안전성을 고려했습니다.' },
];

const WALLGUARD_FAMILY_DETAILS: Record<string, Array<{ title: string; description: string }>> = {
  샌디먼트: [{ title: '부드러운 미네랄 표면', description: '고운 샌드와 시멘트가 섞인 듯한 잔잔한 질감으로 차분하고 현대적인 공간을 완성합니다.' }],
  앤티크월: [{ title: '시간의 결을 담은 벽면', description: '은은한 빈티지 표면과 자연스러운 색 변화로 깊이 있는 공간 분위기를 만듭니다.' }],
  소프톤: [{ title: '편안하고 부드러운 톤', description: '밝고 차분한 컬러와 잔잔한 텍스처로 침실과 거실에 편안한 배경을 제공합니다.' }],
  믹스톤: [{ title: '두 가지 질감의 조화', description: '단단하고 정제된 표면과 유럽풍 플라스터 감성을 한 컬렉션에서 선택할 수 있습니다.' }],
  콘크무드: [{ title: '절제된 콘크리트 감성', description: '도시적인 콘크리트 질감을 부드럽게 다듬어 미니멀한 공간에 자연스럽게 어울립니다.' }],
  매트슬랩: [{ title: '차분한 슬랩 텍스처', description: '매트한 석재 표면을 섬세하게 표현해 모던하고 안정감 있는 벽면을 연출합니다.' }],
  러프트: [{ title: '자연스러운 러프 텍스처', description: '거친 듯 부드러운 표면 변화로 공간에 깊이와 따뜻한 입체감을 더합니다.' }],
  하드릭: [{ title: '견고한 브릭 무드', description: '단단한 벽돌과 미네랄 표면에서 영감을 받은 질감으로 차분한 포인트를 만듭니다.' }],
};

const WALLGUARD_SERIES = [
  { family: '샌디먼트', series: 'W2208', design: 'Sandment', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '앤티크월', series: 'W2206', design: 'Antique Wall', variants: ['1', '2'] },
  { family: '소프톤', series: 'W2205', design: 'Softone', variants: ['1', '2', '3', '4', '5'] },
  { family: '믹스톤', series: 'W2202', design: 'Mixtone', variants: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] },
  { family: '콘크무드', series: 'W2204', design: 'Concmood', variants: ['1', '2', '3', '4'] },
  { family: '매트슬랩', series: 'W2207', design: 'Matte Slab', variants: ['1', '2', '3', '4'] },
  { family: '러프트', series: 'W2203', design: 'Rought', variants: ['1', '2', '3', '4'] },
  { family: '하드릭', series: 'W2201', design: 'Hard Rick', variants: ['1', '2', '3', '4', '5'] },
] as const;

const WALLGUARD_SAMPLES: Sample[] = WALLGUARD_SERIES.flatMap(({ family, series, design, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `wallguard-${productNo.toLowerCase()}`,
      productNo,
      name: `월가드 ${design} ${productNo}`,
      brand: '신한',
      line: family,
      materialType: '실크',
      collection: '월가드',
      specs: ['고내구성 실크벽지', family, '스크래치 저항', '저광택', 'PS 인증'],
      image: '',
      description: WALLGUARD_COLLECTION_DESCRIPTION,
      detailSections: [...WALLGUARD_COMMON_DETAILS, ...(WALLGUARD_FAMILY_DETAILS[family] ?? [])],
      sourceLabel: '신한벽지 WALLGUARD 공개 카탈로그',
    };
  })
);

const FACADE_COLLECTION_DESCRIPTION = '파사드는 깊이감 있는 표면과 스톤·패브릭·플라스터의 질감을 섬세하게 구현한 신한벽지의 하이엔드 실크벽지 컬렉션입니다. 저채도 컬러와 향상된 커버력, 생활 내구성, 부직포 원지의 시공성을 함께 고려했습니다.';

const FACADE_COMMON_DETAILS = [
  { title: '깊이감이 돋보이는 텍스처', description: '입체감 있는 엠보와 특수 효과로 스톤, 패브릭, 플라스터 등 소재 고유의 질감을 섬세하게 표현했습니다.' },
  { title: '일반 벽지 대비 향상된 커버력', description: '벽면의 흠집이나 요철을 보다 효과적으로 감춰 마감 후 벽면이 깔끔하고 고르게 보이도록 돕습니다.' },
  { title: '강화된 마찰 내구성', description: '카탈로그 기준 일반 벽지보다 마찰 견뢰도를 2~3배 높여 일상적인 마찰과 오염에 대한 관리 부담을 줄였습니다.' },
  { title: '부직포 원지의 시공 효율', description: '전 제품에 부직포 원지를 적용해 초배와 이음매 작업을 단순화하고, 카탈로그 시험 기준 시공 시간을 약 21% 줄일 수 있도록 설계했습니다.' },
  { title: '트렌드에 맞춘 하이엔드 컬러', description: '따뜻한 웜톤과 고급스러운 저채도 색상으로 주거 및 상업 공간에 차분하고 깊이 있는 배경을 제공합니다.' },
  { title: '국내외 기준으로 확인한 품질', description: '카탈로그에 제시된 KS-QEI, GREENGUARD Gold, OEKO-TEX STANDARD 100 등 품질·환경 관련 인증 정보를 바탕으로 안전성과 품질을 관리합니다.' },
];

const FACADE_SERIES = [
  { family: '마티스 플러스', series: '2023', design: 'Matisse plus', variants: ['1', '2', '3'] },
  { family: '샤갈 플러스', series: '2022', design: 'Chagall plus', variants: ['1', '2', '3', '4'] },
  { family: '바그너 플러스', series: '2021', design: 'Wagner plus', variants: ['1', '2'] },
  { family: '마티스', series: '2020', design: 'Matisse', variants: ['1', '2', '3', '4', '5'] },
  { family: '티치아노', series: '2019', design: 'Tiziano', variants: ['1', '2', '3', '4'] },
  { family: '샤갈', series: '2018', design: 'Chagall', variants: ['1', '2', '3', '4', '5'] },
  { family: '라파엘로', series: '2017', design: 'Raffaello', variants: ['1', '2', '3'] },
  { family: '다빈치', series: '2016', design: 'Da Vinci', variants: ['1', '2', '3', '4'] },
  { family: '아그네스', series: '2015', design: 'Agnes', variants: ['1', '2', '3', '4'] },
  { family: '테라코타', series: '2014', design: 'Terracotta', variants: ['1', '2', '3'] },
  { family: '베르메르', series: '2013', design: 'Vermeer', variants: ['1', '2'] },
  { family: '바그너', series: '2012', design: 'Wagner', variants: ['1', '2', '3', '4', '5'] },
  { family: '에드가', series: '2011', design: 'Edgar', variants: ['1', '2', '3', '4'] },
  { family: '프란츠', series: '2010', design: 'Franz', variants: ['1', '2', '3'] },
  { family: '카미유', series: '2009', design: 'Camille', variants: ['1'] },
  { family: '루벤스', series: '2008', design: 'Rubens', variants: ['1', '2', '3', '4'] },
  { family: '고야', series: '2007', design: 'Goya', variants: ['1', '2', '3', '4'] },
  { family: '카를', series: '2006', design: 'Carl', variants: ['1', '2', '3', '4'] },
  { family: '샤르댕', series: '2005', design: 'Chardin', variants: ['1', '2'] },
  { family: '클로드', series: '2004', design: 'Claude', variants: ['1', '2', '3', '4'] },
  { family: '트래버틴', series: '2003', design: 'Travertine', variants: ['1', '2'] },
  { family: '피사로', series: '2002', design: 'Pissarro', variants: ['1', '2', '3'] },
  { family: '로시니', series: '2001', design: 'Rossini', variants: ['1', '2'] },
] as const;

const FACADE_SAMPLES: Sample[] = FACADE_SERIES.flatMap(({ family, series, design, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `facade-${productNo}`,
      productNo,
      name: `파사드 ${design} ${productNo}`,
      brand: '신한',
      line: family,
      materialType: '실크',
      collection: '파사드',
      specs: ['하이엔드 실크벽지', family, '부직포 원지', '향상된 커버력', '강화 내구성'],
      image: '',
      description: FACADE_COLLECTION_DESCRIPTION,
      detailSections: [...FACADE_COMMON_DETAILS],
      sourceLabel: '신한벽지 FACADE 공개 카탈로그',
    };
  })
);

const LIVING_COLLECTION_DESCRIPTION = '리빙은 회벽과 스톤, 패브릭, 포인트 패턴을 폭넓게 구성한 신한벽지의 프리미엄 실크벽지 컬렉션입니다. 입체적인 리얼 텍스처와 관리가 편리한 내오염 제품, 차분한 컬러 구성을 통해 일상 공간을 편안하고 풍성하게 연출합니다.';

const LIVING_COMMON_DETAILS = [
  { title: '특수 기법으로 완성한 리얼 텍스처', description: '한층 더 도톰해진 두께감과 생생한 입체 질감으로 회벽, 스톤, 패브릭의 소재감을 자연스럽게 표현했습니다.' },
  { title: '생활 흔적을 줄이는 손쉬운 관리', description: '내오염 기능 제품을 포함해 생활 속 가벼운 오염을 닦아내기 쉽고 깨끗한 벽면 관리에 도움을 줍니다.' },
  { title: '풍성한 디자인 선택', description: '무지와 회벽, 스톤, 패브릭부터 공간의 분위기를 살리는 포인트 패턴과 천장지까지 다양하게 구성했습니다.' },
  { title: '리얼한 질감의 회벽 패턴', description: '질감이 주는 차분한 입체감으로 공간의 분위기를 담담하고 세련되게 완성합니다.' },
  { title: '섬세한 짜임의 패브릭 패턴', description: '시선을 부드럽게 감싸는 직조 질감과 따뜻한 색감으로 편안한 배경을 제공합니다.' },
  { title: '단조로움에 더하는 포인트', description: '기하학, 자연 모티프, 클래식 디자인을 활용해 공간의 무드를 또렷하게 만드는 포인트 선택지를 제공합니다.' },
];

const LIVING_SERIES = [
  { family: '프라임 스톤', series: '70302', variants: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { family: '피노스톤', series: '70301', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '하드데코', series: '70300', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '누벨스톤', series: '70299', variants: ['1', '2', '3', '4', '5'] },
  { family: '스톤 그리드', series: '70298', variants: ['1', '2', '3', '4'] },
  { family: '듀라월', series: '70297', variants: ['1', '2', '3', '4', '5'] },
  { family: '클레이어', series: '70296', variants: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { family: '바클', series: '70295', variants: ['1', '2', '3', '4', '5'] },
  { family: '올레프', series: '70293', variants: ['1', '2', '3', '4'] },
  { family: '오브위브', series: '70294', variants: ['1', '2', '3', '4', '5'] },
  { family: '그레인월', series: '70292', variants: ['1', '2', '3'] },
  { family: '트리프', series: '70291', variants: ['1', '2'] },
  { family: '마블스', series: '70290', variants: ['1', '2'] },
  { family: '리로월', series: '70289', variants: ['1'] },
  { family: '빈티지 가든', series: '70288', variants: ['1', '2'] },
  { family: '블로시아', series: '70287', variants: ['1'] },
  { family: '데오도르', series: '70244', variants: ['1'] },
  { family: '로코코', series: '70277', variants: ['1'] },
  { family: '데이브', series: '70285', variants: ['1'] },
  { family: '노블스톤', series: '70286', variants: ['1', '2', '3'] },
  { family: '스타코', series: '70283', variants: ['1', '2', '4', '5'] },
  { family: '데코월', series: '70276', variants: ['1', '2'] },
  { family: '플레인', series: '70213', variants: ['10'] },
  { family: '샌드월', series: '70274', variants: ['1', '2'] },
  { family: '부클레', series: '70282', variants: ['1', '2', '3'] },
  { family: '코듀로이', series: '70271', variants: ['1', '2'] },
  { family: '콜린트', series: '70245', variants: ['1', '2', '5'] },
  { family: '제프리', series: '70254', variants: ['1', '5', '6'] },
  { family: '레이븐', series: '70281', variants: ['1', '2'] },
  { family: '옥스퍼드', series: '70272', variants: ['1', '2'] },
  { family: '캐시미어', series: '70278', variants: ['1', '2', '3'] },
  { family: '앙고라', series: '70279', variants: ['1', '2', '5'] },
  { family: '더블니트', series: '70280', variants: ['1'] },
  { family: '밀레', series: '70253', variants: ['1'] },
  { family: '케일', series: '70233', variants: ['1'] },
  { family: '헬리오', series: '70243', variants: ['1'] },
  { family: '벨벳', series: '70269', variants: ['2'] },
  { family: '브린', series: '70221', variants: ['2'] },
  { family: '천장지', series: 'C8123', variants: ['1', '2'] },
  { family: '천장지', series: 'C8052', variants: ['1', '3'] },
  { family: '천장지', series: 'C9643', variants: ['11', '10'] },
] as const;

const LIVING_SAMPLES: Sample[] = LIVING_SERIES.flatMap(({ family, series, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `living-${productNo.toLowerCase()}`,
      productNo,
      name: `리빙 ${family} ${productNo}`,
      brand: '신한',
      line: family,
      materialType: '실크',
      collection: '리빙',
      specs: ['프리미엄 실크벽지', family, '리얼 텍스처', '다양한 디자인', ...(family === '천장지' ? ['천장용'] : [])],
      image: '',
      description: LIVING_COLLECTION_DESCRIPTION,
      detailSections: [...LIVING_COMMON_DETAILS],
      sourceLabel: '신한벽지 Living 공개 카탈로그',
    };
  })
);

const SKETCH_COLLECTION_DESCRIPTION = '스케치는 일상의 감성을 다채로운 컬러와 질감으로 표현한 신한벽지의 감각적인 실크벽지 컬렉션입니다. 크랙스톤과 패널스톤, 패브릭, 페인트, 자연 모티프 등 폭넓은 디자인으로 공간의 분위기를 섬세하게 완성합니다.';

const SKETCH_COMMON_DETAILS = [
  { title: '다채로운 컬러와 디자인', description: '부드러운 뉴트럴 컬러부터 생기 있는 포인트 컬러까지 폭넓게 구성해 공간의 취향과 분위기에 맞춰 선택할 수 있습니다.' },
  { title: '감각적인 입체 텍스처', description: '스톤, 직물, 코튼, 페인트 등 소재에서 영감을 얻은 표면 질감으로 벽면에 자연스러운 깊이감을 더합니다.' },
  { title: '차분한 무지와 포인트 패턴', description: '일상 공간에 편안하게 어울리는 무지 제품과 정원, 테라조, 클래식 모티프의 포인트 디자인을 함께 제공합니다.' },
  { title: '공간별로 고르는 폭넓은 구성', description: '거실과 침실의 메인 벽면부터 포인트 공간과 천장까지 활용할 수 있도록 다양한 제품군을 구성했습니다.' },
];

const SKETCH_SERIES = [
  { family: '크랙스톤', series: '15132', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '섬세한 직물', series: '15131', variants: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { family: '매트 피니시', series: '15130', variants: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { family: '부드러운 촉감', series: '15123', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '패널스톤', series: '15128', variants: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  { family: '컬러블룸', series: '15127', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '딥스톤', series: '15126', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { family: '러프 쉐이드', series: '15125', variants: ['1', '2', '3', '4'] },
  { family: '색다른 느낌', series: '15124', variants: ['1', '2', '3', '4', '5'] },
  { family: '도톰한 코튼', series: '15129', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '화려한 시선', series: '15122', variants: ['1', '2', '3', '4', '5', '6'] },
  { family: '스페셜 페인트', series: '15121', variants: ['1', '2', '3', '4'] },
  { family: '아트 테라조', series: '15120', variants: ['1', '2', '3'] },
  { family: '핸디코트', series: '15112', variants: ['1', '2', '3'] },
  { family: '모래알 터치', series: '15111', variants: ['1', '2'] },
  { family: '규조토 샌드', series: '15118', variants: ['1', '2', '3'] },
  { family: '그날의 약속', series: '15105', variants: ['1', '2', '3'] },
  { family: '고요의 정원', series: '15116', variants: ['1', '2', '3', '4', '7'] },
  { family: '한가로운 오후', series: '15113', variants: ['1', '2', '3'] },
  { family: '일상의 온기', series: '15117', variants: ['1', '2', '3'] },
  { family: '소중한 시간', series: '15119', variants: ['1', '2', '3', '5'] },
  { family: '아침햇살', series: '15110', variants: ['1', '2', '3'] },
  { family: '나만의 휴식', series: '15114', variants: ['1', '2', '6', '7'] },
  { family: '조용한 사색', series: '15053', variants: ['1'] },
  { family: '모던 클레이', series: '15115', variants: ['1'] },
  { family: '즐거운 소식', series: '15106', variants: ['1', '2'] },
  { family: '천장지', series: 'C9643', variants: ['10', '11', '20'] },
  { family: '천장지', series: 'C8052', variants: ['1', '3'] },
] as const;

const SKETCH_SAMPLES: Sample[] = SKETCH_SERIES.flatMap(({ family, series, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `sketch-${productNo.toLowerCase()}`,
      productNo,
      name: `스케치 ${family} ${productNo}`,
      brand: '신한',
      line: family,
      materialType: '실크',
      collection: '스케치',
      specs: ['감각적인 실크벽지', family, '입체 텍스처', '다채로운 컬러', ...(family === '천장지' ? ['천장용'] : [])],
      image: '',
      description: SKETCH_COLLECTION_DESCRIPTION,
      detailSections: [...SKETCH_COMMON_DETAILS],
      sourceLabel: '신한벽지 SKETCH all new 공개 카탈로그',
    };
  })
);

const IRIS_COLLECTION_DESCRIPTION = '아이리스는 트렌디한 질감과 베이직 컬러, 공간의 분위기를 바꾸는 포인트 컬러를 폭넓게 구성한 KCC신한벽지의 친환경 광폭 합지벽지 컬렉션입니다. 일반 벽면부터 키즈, 전통 문양, 천장과 타일 패턴까지 다양한 공간에 맞춰 선택할 수 있습니다.';

const IRIS_COMMON_DETAILS = [
  { title: '내구성 강화 코팅', description: '기존 종이·잉크·기능성 인쇄 구조에 내구성 강화 코팅을 더해 표면 내구성을 높였습니다.' },
  { title: '더 안정적인 일상 내구성', description: '카탈로그 시험 결과 기준으로 기존 제품 대비 마찰 견뢰도는 100%, 인장 강도는 20% 향상되었습니다.' },
  { title: '폭넓은 디자인과 컬러', description: '플라스터, 패브릭, 스톤, 페인트 질감부터 키즈와 포인트 패턴까지 다양한 공간에 어울리는 디자인을 제공합니다.' },
  { title: '광폭 합지 규격', description: '폭 0.93m, 길이 17.75m 규격의 종이 합지벽지로 구성되어 있습니다. 실제 색상과 엠보는 실물 샘플 확인을 권장합니다.' },
];

const IRIS_SERIES = [
  { design: '코르델', series: '6892', variants: ['1', '2', '3', '4', '5', '6', '7'] },
  { design: '크리즈', series: '6891', variants: ['1', '2', '3', '4', '5'] },
  { design: '샤드', series: '6890', variants: ['1', '2', '3', '4', '5', '6'] },
  { design: '바티스', series: '6889', variants: ['1', '2', '3', '4', '5', '6'] },
  { design: '펌블', series: '6888', variants: ['1', '2', '3', '4', '5', '6'] },
  { design: '스너그', series: '6887', variants: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
  { design: '제이프', series: '6886', variants: ['1', '2', '3', '4'] },
  { design: '네슬', series: '6885', variants: ['1', '2', '3', '4', '5'] },
  { design: '라플', series: '6884', variants: ['1', '2', '3', '4', '5'] },
  { design: '글레이', series: '6873', variants: ['1', '2', '3', '4', '5', '6'] },
  { design: '플라넬', series: '6872', variants: ['1', '2', '3', '5'] },
  { design: '벡터', series: '6871', variants: ['1', '2', '3', '6', '7'] },
  { design: '심스톤', series: '6883', variants: ['1', '2'] },
  { design: '크레터', series: '6882', variants: ['1', '2', '3'] },
  { design: '몰러', series: '6791', variants: ['1', '7'] },
  { design: '엠보스', series: '6866', variants: ['1', '2'] },
  { design: '도트스톤', series: '6867', variants: ['1', '2'] },
  { design: '돌출콘크리트', series: '6771', variants: ['2'] },
  { design: '미스틱', series: '6881', variants: ['1'] },
  { design: '덴버', series: '6858', variants: ['1'] },
  { design: '텍톤', series: '6880', variants: ['1', '2', '3'] },
  { design: '동양화', series: '6879', variants: ['1'] },
  { design: '한지', series: '6766', variants: ['1'] },
  { design: '레온', series: '6804', variants: ['2'] },
  { design: '상평통보', series: '6767', variants: ['1'] },
  { design: '시티빌', series: '6878', variants: ['1'] },
  { design: '슈츠', series: '6792', variants: ['2', '5'] },
  { design: '르꼴레', series: '6877', variants: ['1'] },
  { design: '아벨', series: '6851', variants: ['1', '2'] },
  { design: '큐티파이', series: '6876', variants: ['1'] },
  { design: '슬릿', series: '6875', variants: ['1', '2'] },
  { design: '뭉게뭉게', series: '6776', variants: ['1'] },
  { design: '링크', series: '6852', variants: ['1', '2', '3'] },
  { design: '벤지', series: '6853', variants: ['1', '2', '3'] },
  { design: '펠트', series: '6869', variants: ['1', '2', '3'] },
  { design: '루키', series: '6794', variants: ['2', '3'] },
  { design: '에반', series: '6870', variants: ['1', '2', '3'] },
  { design: '오즈', series: '6861', variants: ['1', '2'] },
  { design: '롤링샌드', series: 'C6819', variants: ['1', '2'] },
  { design: '스톤샌드', series: 'C7335', variants: ['1', '10'] },
  { design: '아트실링', series: 'C7475', variants: ['1', '10', '11'] },
  { design: '네오타일', series: 'T126', variants: ['1', '2'] },
  { design: '심플타일', series: 'T124', variants: ['1', '2'] },
  { design: '마블', series: 'T101', variants: ['1'] },
  { design: '스톤', series: 'T121', variants: ['2'] },
] as const;

function getIrisLine(series: string, design: string): string {
  if (series.startsWith('C')) return '천장지';
  if (series.startsWith('T')) return '타일벽지';
  return design;
}

const IRIS_SAMPLES: Sample[] = IRIS_SERIES.flatMap(({ design, series, variants }) =>
  variants.map((variant) => {
    const productNo = `${series}-${variant}`;
    const line = getIrisLine(series, design);
    return {
      id: `iris-${productNo.toLowerCase()}`,
      productNo,
      name: `아이리스 ${design} ${productNo}`,
      brand: '신한',
      line,
      materialType: '합지',
      collection: '광폭합지',
      specs: [
        '친환경 광폭합지',
        design,
        '내구성 강화 코팅',
        ...(line === '천장지' ? ['천장용'] : []),
        ...(line === '타일벽지' ? ['타일 패턴'] : []),
      ],
      image: '',
      description: IRIS_COLLECTION_DESCRIPTION,
      detailSections: [...IRIS_COMMON_DETAILS],
      sourceLabel: 'KCC신한벽지 IRIS 공개 카탈로그',
    };
  })
);

const DIAMANT_FORTIS_COLLECTION_DESCRIPTION = '디아망 포티스는 리얼 프린팅으로 자연 소재의 섬세한 질감과 은은한 색감을 구현하고, 필름처럼 강한 표면 내구성과 일반 벽지처럼 편리한 시공성을 함께 제공하는 LX Z:IN의 프리미엄 실크벽지 컬렉션입니다.';

const DIAMANT_FORTIS_COMMON_DETAILS = [
  { title: '필름처럼 강한 내구성', description: '강한 표면 강도로 코너와 무걸레받이 부위에서 발생하기 쉬운 찢김과 긁힘 부담을 줄여줍니다.' },
  { title: '반려동물 친화 스크래치 케어', description: '전 제품이 한국애견협회 PS인증 내스크래치 기준을 만족하며 Erichsen Scratch Test 기준 14N 이상의 성능을 제공합니다.' },
  { title: '필름보다 쉬운 시공성', description: '일반 벽지와 동일한 시공법으로 깔끔하게 마감할 수 있고, 시공 후 이음매가 잘 보이지 않아 전폭 같은 고급스러움을 연출합니다.' },
  { title: '리얼 프린팅 디자인', description: '반복을 줄인 대형 규격의 유러피안 플라스터와 프렌치 워시 등 자연 소재의 깊이와 아트 페인팅의 감성을 사실적으로 재현합니다.' },
];

const DIAMANT_FORTIS_SERIES = [
  { theme: 'Contemporary Stone', design: '유러피안 플라스터', series: 'DF001', colors: { '01': '샌드 크림', '02': '크림 카라멜' } },
  { theme: 'Contemporary Stone', design: '프렌치 워시', series: 'DF002', colors: { '01': '아이스 미스트', '02': '샌드 그레이' } },
  { theme: 'Contemporary Stone', design: '솔리드 페인팅', series: 'DF003', colors: { '01': '퓨어 화이트', '02': '에그쉘 화이트', '03': '포세린 화이트', '04': '프로즌 크림', '05': '바닐라 크림', '06': '오트밀', '07': '버터 크림', '08': '애프리콧', '09': '애쉬 베이지' } },
  { theme: 'Contemporary Stone', design: '스웨이드 페인트', series: 'DF004', colors: { '01': '화이트', '02': '크림', '03': '샌드 그레이지', '04': '화이트 블러쉬', '05': '스모크 그레이', '06': '카푸치노' } },
  { theme: 'Authentic Naturals', design: '마이크로 시멘트', series: 'DF005', colors: { '01': '수퍼 화이트', '02': '카밍 크림', '03': '스노우 그레이', '04': '포그 미스트' } },
  { theme: 'Authentic Naturals', design: '샌드 스톤', series: 'DF006', colors: { '01': '클라우드 화이트', '02': '샌드 그레이', '03': '토프' } },
  { theme: 'Authentic Naturals', design: '브러쉬드 페인트', series: 'DF007', colors: { '01': '브러쉬드 화이트', '02': '페일 그레이', '03': '듄 화이트', '04': '마스카포네', '05': '크림 그레이', '06': '스모크 그레이' } },
  { theme: 'Authentic Naturals', design: '스타코', series: 'DF008', colors: { '01': '화이트', '02': '미스트 그레이지', '03': '모카 크림', '04': '런던 포그' } },
  { theme: 'Authentic Naturals', design: '샌드 웨이브', series: 'DF010', colors: { '01': '라이트 그레이' } },
  { theme: 'Tactile Reality', design: '컬러풀 트위드', series: 'DF011', colors: { '01': '컬러풀 그린' } },
  { theme: 'Tactile Reality', design: '마이크로 코튼', series: 'DF013', colors: { '01': '코튼 화이트', '02': '크리미 코튼', '03': '클라우드 그레이', '04': '모카 크림', '05': '웜 다크 그레이' } },
  { theme: 'Tactile Reality', design: '린넨', series: 'DF014', colors: { '01': '화이트', '02': '그린 미스트', '03': '화이트 그레이', '04': '웜 그레이', '05': '세이지 그린' } },
  { theme: 'Tactile Reality', design: '심플 부클레', series: 'DF015', colors: { '01': '크림 바닐라', '02': '웜 그레이', '03': '실버 그레이', '04': '로즈 블러쉬' } },
  { theme: 'Authentic Naturals', design: '크랙 스톤', series: 'DF016', colors: { '01': '스톤 크림 그레이' } },
  { theme: 'Authentic Naturals', design: '트레버틴', series: 'DF017', colors: { '01': '라이트 크림' } },
  { theme: 'Tactile Reality', design: '소프트 니트', series: 'DF018', colors: { '01': '화이트', '02': '클린 그레이', '03': '클래식 그레이', '04': '스모크 그레이' } },
] as const;

const DIAMANT_FORTIS_SAMPLES: Sample[] = DIAMANT_FORTIS_SERIES.flatMap(({ theme, design, series, colors }) =>
  Object.entries(colors).map(([variant, color]) => {
    const productNo = `${series}-${variant}`;
    return {
      id: `diamant-fortis-${productNo.toLowerCase()}`,
      productNo,
      name: `디아망 포티스 ${design} ${color} ${productNo}`,
      brand: 'LX',
      line: design,
      materialType: '실크',
      collection: '디아망포티스',
      color,
      pattern: design,
      grade: '프리미엄',
      specs: ['프리미엄 실크벽지', theme, design, '고내구성', 'PS인증 14N 이상'],
      image: '',
      description: DIAMANT_FORTIS_COLLECTION_DESCRIPTION,
      detailSections: [...DIAMANT_FORTIS_COMMON_DETAILS],
      sourceLabel: 'LX Z:IN 디아망 포티스 공식 샘플북',
    };
  })
);

export function ensureCatalogCollections<T>(source: T): T {
  const next: any = structuredClone(source);
  const wallpaper = next.find((category: any) => category.id === 1 || category.name === '도배');
  const gaenari = wallpaper?.brands.find((brand: any) => brand.name === '개나리');
  if (gaenari) {

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
      { name: '아트북', lines: ['패브릭', '플라스터', '페인트', '텍스처', '기능성', '피너츠', '천장용'] },
    ];
    collections.reverse().forEach((collection) => {
      const existing = silk.groups?.find((group: any) => group.name === collection.name);
      if (existing) existing.lines = Array.from(new Set([...(existing.lines ?? []), ...collection.lines]));
      else silk.groups = [collection, ...(silk.groups ?? [])];
    });

    let paper = gaenari.materialTypes?.find((materialType: any) => materialType.name === '합지');
    if (!paper) {
      paper = { name: '합지', groups: [] };
      gaenari.materialTypes = [...(gaenari.materialTypes ?? []), paper];
    }
    const widePaper = { name: '광폭합지', lines: ['패브릭', '플라스터·페인트', '디자인', '키즈', '타일패턴', '천장용'] };
    const existingWidePaper = paper.groups?.find((group: any) => group.name === widePaper.name);
    if (existingWidePaper) existingWidePaper.lines = Array.from(new Set([...(existingWidePaper.lines ?? []), ...widePaper.lines]));
    else paper.groups = [widePaper, ...(paper.groups ?? [])];
  }

  const shinhan = wallpaper?.brands.find((brand: any) => brand.name === '신한');
  if (shinhan) {
    let shinhanSilk = shinhan.materialTypes?.find((materialType: any) => materialType.name === '실크');
    if (!shinhanSilk) {
      shinhanSilk = { name: '실크', groups: [] };
      shinhan.materialTypes = [...(shinhan.materialTypes ?? []), shinhanSilk];
    }
    const wallguard = { name: '월가드', lines: ['샌디먼트', '앤티크월', '소프톤', '믹스톤', '콘크무드', '매트슬랩', '러프트', '하드릭'] };
    const existingWallguard = shinhanSilk.groups?.find((group: any) => group.name === wallguard.name);
    if (existingWallguard) existingWallguard.lines = Array.from(new Set([...(existingWallguard.lines ?? []), ...wallguard.lines]));
    else shinhanSilk.groups = [wallguard, ...(shinhanSilk.groups ?? [])];

    const facade = { name: '파사드', lines: FACADE_SERIES.map((series) => series.family) };
    const existingFacade = shinhanSilk.groups?.find((group: any) => group.name === facade.name);
    if (existingFacade) existingFacade.lines = Array.from(new Set([...(existingFacade.lines ?? []), ...facade.lines]));
    else shinhanSilk.groups = [facade, ...(shinhanSilk.groups ?? [])];

    const living = { name: '리빙', lines: Array.from(new Set(LIVING_SERIES.map((series) => series.family))) };
    const existingLiving = shinhanSilk.groups?.find((group: any) => group.name === living.name);
    if (existingLiving) existingLiving.lines = Array.from(new Set([...(existingLiving.lines ?? []), ...living.lines]));
    else shinhanSilk.groups = [living, ...(shinhanSilk.groups ?? [])];

    const sketch = { name: '스케치', lines: Array.from(new Set(SKETCH_SERIES.map((series) => series.family))) };
    const existingSketch = shinhanSilk.groups?.find((group: any) => group.name === sketch.name);
    if (existingSketch) existingSketch.lines = Array.from(new Set([...(existingSketch.lines ?? []), ...sketch.lines]));
    else shinhanSilk.groups = [sketch, ...(shinhanSilk.groups ?? [])];

    let shinhanPaper = shinhan.materialTypes?.find((materialType: any) => materialType.name === '합지');
    if (!shinhanPaper) {
      shinhanPaper = { name: '합지', groups: [] };
      shinhan.materialTypes = [...(shinhan.materialTypes ?? []), shinhanPaper];
    }
    const iris = {
      name: '광폭합지',
      lines: Array.from(new Set(IRIS_SERIES.map(({ design, series }) => getIrisLine(series, design)))),
    };
    const existingIris = shinhanPaper.groups?.find((group: any) => group.name === iris.name);
    if (existingIris) existingIris.lines = Array.from(new Set([...(existingIris.lines ?? []), ...iris.lines]));
    else shinhanPaper.groups = [iris, ...(shinhanPaper.groups ?? [])];
  }

  const lx = wallpaper?.brands.find((brand: any) => brand.name === 'LX');
  if (lx) {
    let lxSilk = lx.materialTypes?.find((materialType: any) => materialType.name === '실크');
    if (!lxSilk) {
      lxSilk = { name: '실크', groups: [] };
      lx.materialTypes = [...(lx.materialTypes ?? []), lxSilk];
    }
    const diamantFortis = {
      name: '디아망포티스',
      lines: Array.from(new Set(DIAMANT_FORTIS_SERIES.map((series) => series.design))),
    };
    const existingDiamantFortis = lxSilk.groups?.find((group: any) => group.name === diamantFortis.name);
    if (existingDiamantFortis) {
      existingDiamantFortis.lines = Array.from(new Set([...(existingDiamantFortis.lines ?? []), ...diamantFortis.lines]));
    } else {
      lxSilk.groups = [diamantFortis, ...(lxSilk.groups ?? [])];
    }
  }

  return next;
}

export function sampleMatchesCatalogSelection(
  sample: Sample,
  selection: { group?: string; line?: string },
): boolean {
  if (selection.group && ['프리모', '로하스+', '아트북', '광폭합지', '월가드', '파사드', '리빙', '스케치', '디아망포티스'].includes(selection.group) && sample.collection !== selection.group) return false;
  if (selection.line && sample.line !== selection.line) return false;
  return true;
}

// 카테고리별 샘플 데이터
export const MOCK_SAMPLES: Record<number, Sample[]> = {
  1: [
    ...PRIMO_SAMPLES,
    ...LOHAS_SAMPLES,
    ...ARTBOOK_SAMPLES,
    ...WIDE_PAPER_SAMPLES,
    ...WALLGUARD_SAMPLES,
    ...FACADE_SAMPLES,
    ...LIVING_SAMPLES,
    ...SKETCH_SAMPLES,
    ...IRIS_SAMPLES,
    ...DIAMANT_FORTIS_SAMPLES,
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

export function getCatalogLinemates(
  sample: Sample & { categoryId: number },
  samples: Sample[] = ALL_SAMPLES,
): Sample[] {
  return samples.filter((candidate) =>
    candidate.categoryId === sample.categoryId
    && candidate.brand === sample.brand
    && candidate.line === sample.line
    && candidate.collection === sample.collection
  );
}

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
