"""
AI 자재 매칭 모듈 - 전역 설정 파일
Material Matcher Configuration
"""

import os

# ─── 프로젝트 루트 경로 ───────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── 디렉토리 경로 ────────────────────────────────────────────────────────────
CORE_DIR    = os.path.join(BASE_DIR, "core")
MODELS_DIR  = os.path.join(BASE_DIR, "models")
DATA_DIR    = os.path.join(BASE_DIR, "data")
ASSETS_DIR  = os.path.join(BASE_DIR, "assets")
TESTS_DIR   = os.path.join(BASE_DIR, "tests")

# ─── 로컬 DB 파일 경로 ────────────────────────────────────────────────────────
SQLITE_DB_PATH  = os.path.join(DATA_DIR, "materials.db")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "materials.faiss")
VECTOR_META_PATH = os.path.join(DATA_DIR, "vector_meta.json")

# ─── AI 모델 설정 ─────────────────────────────────────────────────────────────
MODEL_INPUT_SIZE  = (224, 224)   # 모델 입력 이미지 크기 (width, height)
FEATURE_DIM       = 1280         # MobileNetV3-Large 특징 벡터 차원 수 (classifier[:-1] 기준)
TOP_K_RESULTS     = 5            # 유사도 검색 결과 상위 N개
MIN_SIMILARITY_THRESHOLD = 0.65  # 이 점수 미만이면 로컬 검색 실패로 간주하고 인터넷 검색 제안

# ─── 이미지 전처리 설정 ───────────────────────────────────────────────────────
# 백색 물체(기준 색상재) 감지 및 적합성 검증 설정
WHITE_REF_CONFIG = {
    "min_area_ratio": 0.05,  # 전체 이미지 대비 백색 물체의 최소 면적 비율 (5% 이상이어야 함)
    "max_area_ratio": 0.30,  # 전체 이미지 대비 백색 물체의 최대 면적 비율 (30% 이하이어야 함)
    "white_threshold_hsv": {
        # HSV 색상 공간에서 '흰색'으로 간주할 범위 (조명에 따라 조정 가능)
        "s_max": 40,   # 채도(Saturation)가 낮아야 흰색에 가까움 (0~255 중 40 이하)
        "v_min": 180   # 명도(Value)가 높아야 흰색에 가까움 (0~255 중 180 이상)
    },
    "uniformity_threshold": 15  # 백색 물체 내부의 색상 균일도 (표준편차 15 이하일 때 적합한 기준재로 판정)
}

# 조명 보정 최소 밝기 임계값 (0~255, 이 값 이하면 어두운 환경 경고)
MIN_BRIGHTNESS_THRESHOLD = 60

# ─── 자재 카테고리 ────────────────────────────────────────────────────────────
MATERIAL_CATEGORIES = {
    "wallpaper": "벽지",
    "film":      "인테리어 필름",
    "flooring":  "바닥재",
}

# 카테고리별 권장 AI 모델
CATEGORY_MODELS = {
    "wallpaper": "mobilenet_v3_large",
    "film":      "efficientnet_lite",
    "flooring":  "resnet50",
}

# ─── 동기화 설정 ─────────────────────────────────────────────────────────────
SYNC_SERVER_URL  = "https://your-supabase-url.supabase.co"  # 추후 실제 URL로 교체
CDN_BASE_URL     = "https://your-r2-bucket.r2.dev"          # Cloudflare R2 CDN URL
SYNC_INTERVAL_DAYS = 7   # 최소 동기화 주기 (일)
