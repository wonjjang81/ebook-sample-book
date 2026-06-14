# Material Matcher SDK

자재샘플북 메인 앱에 플러그인 형태로 통합되는 **AI 기반 자재 유사도 검색 모듈**입니다.
이 모듈은 인터넷 연결 없이 스마트폰 내부에서 동작하며, 로컬 DB 검색 실패 시 온라인 검색(Google Vision API 등)으로 자연스럽게 연결되는 Fallback 기능을 제공합니다.

## 1. 디렉토리 구조
이 `material_matcher` 폴더 전체를 메인 앱의 모듈 폴더로 복사하여 사용합니다.
```text
material_matcher/
├── __init__.py          # SDK 진입점
├── config.py            # 전역 설정 (AI 파라미터, Fallback 임계값 등)
├── core/
│   ├── camera_guide.py  # 촬영 가이드 UI 및 실시간 피드백
│   ├── database.py      # SQLite DB 관리
│   ├── feature_extraction.py # MobileNetV3 벡터 추출
│   ├── matcher.py       # 통합 파이프라인 (Main Class)
│   ├── preprocessing.py # 이미지 전처리 (화이트 밸런스 등)
│   └── search_engine.py # FAISS 로컬 검색 엔진
├── data/                # 로컬 DB 및 FAISS 인덱스 저장소
└── models/              # 다운로드된 AI 모델 가중치 저장소
```

## 2. 필수 의존성 설치
메인 앱의 가상환경에 아래 패키지들을 설치해야 합니다. (requirements.txt 참고)
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install faiss-cpu opencv-python-headless scikit-learn numpy
```

## 3. 메인 앱(자재샘플북) 연동 가이드

### 3.1 SDK 초기화
앱이 실행될 때 백그라운드에서 한 번만 초기화하는 것을 권장합니다. (AI 모델 로드에 1~2초 소요)
```python
from material_matcher.core.matcher import MaterialMatcher

# 앱 전역 변수나 싱글톤으로 유지하세요.
matcher = MaterialMatcher()
```

### 3.2 카메라 가이드 UI 적용 (선택 사항)
사용자가 사진을 찍기 전, 프리뷰 화면에 가이드라인을 그리고 실시간 피드백을 제공합니다.
```python
# 카메라 프레임(numpy array BGR)을 넘겨줍니다.
guided_frame, status = matcher.get_live_feedback(camera_frame)

if status["is_ready"]:
    print("촬영 버튼 활성화 가능!")
else:
    print(status["message"]) # 예: "Too dark!", "백색 물체가 없습니다" 등
```

### 3.3 사진 검색 및 Fallback 처리 (핵심)

**[단일 촬영 검색]**
사용자가 사진 1장을 촬영하면, 해당 사진의 경로를 SDK에 전달합니다.
```python
# top_k: 반환받을 유사 자재 개수
result = matcher.search_by_image("path/to/captured_photo.jpg", top_k=5)
```

**[다중 촬영 앙상블 검색 (추천)]**
정확도를 극대화하기 위해, 동일한 자재를 각도나 조명을 살짝 달리하여 2~3장 연속 촬영한 뒤 배열 형태로 전달합니다. 내부적으로 벡터 평균화(앙상블) 로직이 적용되어 단일 촬영 대비 정확도가 크게 향상됩니다.
```python
photo_paths = [
    "path/to/photo_1.jpg",
    "path/to/photo_2.jpg",
    "path/to/photo_3.jpg"
]
result = matcher.search_by_images(photo_paths, top_k=5)
print(f"{result['ensemble_count']}장의 사진이 앙상블 검색에 사용되었습니다.")
```

**[결과 처리 및 Fallback 연동]**
단일 촬영과 다중 촬영 모두 동일한 형태의 결과를 반환합니다.
```python

if result["success"]:
    if result["fallback_required"]:
        # 로컬 DB에 일치하는 자재가 없음 (유사도 < 0.65)
        print(result["message"]) # "로컬 DB에 일치하는 자재가 없습니다. 인터넷 검색을 제안합니다."
        
        # SDK가 인터넷 검색용으로 예쁘게 잘라놓은(Crop) 이미지를 활용합니다.
        fallback_img_path = result["fallback_image_path"]
        
        # TODO: 메인 앱에서 이 이미지를 Google Vision API나 Bing Visual Search로 전송하세요.
        # google_vision_api.search(fallback_img_path)
        
    else:
        # 로컬 검색 성공
        print("로컬 DB 검색 결과:")
        for item in result["results"]:
            print(f"[{item['code']}] {item['name']} (점수: {item['similarity_score']:.2f})")
else:
    print("에러 발생:", result["error"])
```

## 4. Fallback 임계값 조절
`config.py`의 `MIN_SIMILARITY_THRESHOLD` 값을 수정하여 인터넷 검색으로 넘어가는 기준을 조절할 수 있습니다.
- 기본값 `0.65`
- 값을 높이면(예: `0.80`): 조금만 달라도 인터넷 검색을 제안합니다. (보수적)
- 값을 낮추면(예: `0.50`): 웬만하면 로컬 DB 결과를 보여줍니다. (관대함)
