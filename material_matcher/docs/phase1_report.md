# 1단계 완료 보고서: 프로젝트 환경 설정 및 기반 구조 구축

## 개발 완료 항목

### 1. 패키지 환경 설치
| 패키지 | 버전 | 용도 |
| :--- | :--- | :--- |
| PyTorch | 2.12.0+cpu | AI 특징 추출 (MobileNetV3 등) |
| OpenCV | 4.13.0 | 이미지 전처리 (색상 보정, 원근 보정) |
| FAISS-CPU | 최신 | 로컬 유사도 벡터 검색 |
| scikit-learn | 1.9.0 | 벡터 정규화 및 보조 연산 |

### 2. 프로젝트 디렉토리 구조
```
material_matcher/
├── __init__.py          # 패키지 초기화 (SDK 진입점)
├── config.py            # 전역 설정 (경로, 모델 파라미터, 동기화 URL)
├── core/
│   ├── __init__.py
│   └── database.py      # SQLite DB 초기화 및 CRUD
├── models/              # AI 모델 파일 저장 디렉토리
├── data/
│   └── materials.db     # 로컬 SQLite DB (샘플 5개 삽입 완료)
├── assets/              # 썸네일 이미지 저장 디렉토리
└── tests/               # 단위 테스트 디렉토리
```

### 3. config.py 핵심 설정값
- **MODEL_INPUT_SIZE:** 224×224 (MobileNetV3 표준 입력)
- **FEATURE_DIM:** 960차원 (MobileNetV3-Large 출력 벡터)
- **TOP_K_RESULTS:** 상위 5개 결과 반환
- **WHITE_REF_REGION:** A4 용지 기준 영역 (화면 좌측 하단 20%×25% 영역)
- **MATERIAL_CATEGORIES:** wallpaper / film / flooring 3종

### 4. database.py 구현 기능
- `init_database()`: SQLite DB 및 테이블 자동 생성
- `insert_material()`: 자재 데이터 삽입 (중복 품번 시 자동 업데이트)
- `get_material_by_code()`: 품번으로 단건 조회
- `get_materials_by_vector_ids()`: FAISS 검색 결과 일괄 조회
- `get_total_count()`: 전체 자재 수 조회

## 다음 단계 예고
**2단계:** 이미지 전처리 모듈 개발
- A4 용지 기준 화이트 밸런스 자동 보정
- 원근 왜곡 보정 (Perspective Transform)
- 패턴 영역 크롭 및 AI 모델 입력 규격 리사이징
