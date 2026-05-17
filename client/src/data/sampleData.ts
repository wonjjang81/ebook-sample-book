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
}

// 카테고리별 샘플 데이터
export const MOCK_SAMPLES: Record<number, Sample[]> = {
  1: [
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

// ID로 샘플 찾기
export function findSampleById(id: string): (Sample & { categoryId: number }) | undefined {
  const found = ALL_SAMPLES.find((s) => s.id === id);
  if (!found) return undefined;
  return { ...found, categoryId: found.categoryId ?? 1 };
}

// 카테고리 ID로 카테고리 이름 찾기
export function getCategoryName(categoryId: number): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.name ?? '';
}
