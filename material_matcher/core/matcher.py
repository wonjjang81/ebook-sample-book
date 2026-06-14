"""
통합 파이프라인 모듈 (Material Matcher)
- 1~5단계에서 개발된 모든 모듈을 하나로 묶는 메인 클래스입니다.
- 외부(자재샘플북 앱)에서는 이 클래스만 호출하여 사진 검색을 수행합니다.
"""

import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.preprocessing import Preprocessor
from core.feature_extraction import FeatureExtractor
from core.search_engine import VectorSearchEngine
from core.camera_guide import CameraGuideUI

class MaterialMatcher:
    def __init__(self):
        """
        모든 하위 모듈을 초기화하고 메모리에 로드합니다.
        (앱 실행 시 1회만 호출되는 것을 권장)
        """
        self.preprocessor = Preprocessor()
        self.extractor = FeatureExtractor()
        self.search_engine = VectorSearchEngine()
        self.ui_guide = CameraGuideUI()
        self._is_ready = True

    def get_live_feedback(self, frame: np.ndarray) -> tuple:
        """
        카메라 프리뷰 프레임을 받아 UI 가이드와 상태를 반환합니다.
        반환값: (합성된 이미지 프레임, 상태 딕셔너리)
        """
        return self.ui_guide.process_live_feedback(frame)

    def search_by_images(self, image_paths: list, top_k: int = 5) -> dict:
        """
        [다중 촬영 앙상블 검색] 여러 장의 사진 경로를 입력받아 벡터를 평균내어 정확도를 높인 검색을 수행합니다.
        """
        if not self._is_ready:
            return {"success": False, "error": "모듈이 초기화되지 않았습니다."}

        if not image_paths:
            return {"success": False, "error": "이미지 경로가 제공되지 않았습니다."}

        vectors = []
        fallback_images = []

        for img_path in image_paths:
            prep_result = self.preprocessor.run_pipeline(img_path)
            if not prep_result["success"]:
                continue # 실패한 이미지는 건너뜀

            processed_image = prep_result["processed_image"]
            try:
                vector = self.extractor.extract_vector(processed_image)
                vectors.append(vector)
                fallback_images.append(processed_image)
            except Exception:
                continue

        if not vectors:
            return {"success": False, "error": "유효한 특징 벡터를 추출하지 못했습니다."}

        # 앙상블: 벡터 평균 및 L2 재정규화
        avg_vector = np.mean(vectors, axis=0)
        norm = np.linalg.norm(avg_vector)
        if norm > 0:
            avg_vector = avg_vector / norm

        # FAISS 유사도 검색
        try:
            search_results = self.search_engine.search_similar(avg_vector, top_k=top_k)
        except Exception as e:
            return {"success": False, "error": f"유사도 검색 실패: {str(e)}"}

        from config import MIN_SIMILARITY_THRESHOLD
        
        if not search_results or search_results[0].get("similarity_score", 0) < MIN_SIMILARITY_THRESHOLD:
            import cv2
            # 앙상블의 경우 첫 번째 성공한 이미지를 fallback으로 사용
            fallback_img_path = os.path.join(os.path.dirname(image_paths[0]), "fallback_crop_ensemble.jpg")
            cv2.imwrite(fallback_img_path, cv2.cvtColor(fallback_images[0], cv2.COLOR_RGB2BGR))
            
            return {
                "success": True,
                "message": "로컬 DB에 일치하는 자재가 없습니다. 인터넷 검색을 제안합니다.",
                "fallback_required": True,
                "fallback_image_path": fallback_img_path,
                "results": search_results,
                "ensemble_count": len(vectors)
            }

        return {
            "success": True,
            "message": f"로컬 검색 성공 (앙상블: {len(vectors)}장 활용)",
            "fallback_required": False,
            "results": search_results,
            "ensemble_count": len(vectors)
        }

    def search_by_image(self, image_path: str, top_k: int = 5) -> dict:
        """
        [핵심 파이프라인] 사진 경로를 입력받아 가장 유사한 자재를 검색합니다.
        
        흐름: 이미지 로드 -> 전처리(화이트밸런스/크롭) -> AI 벡터 추출 -> FAISS 검색 -> 결과 반환
        """
        if not self._is_ready:
            return {"success": False, "error": "모듈이 초기화되지 않았습니다."}

        # 1. 전처리 파이프라인 실행
        prep_result = self.preprocessor.run_pipeline(image_path)
        if not prep_result["success"]:
            return {"success": False, "error": prep_result["error"]}

        # 모델 입력용으로 처리된 이미지 (224x224 RGB)
        processed_image = prep_result["processed_image"]

        # 2. 특징 벡터 추출 (MobileNetV3)
        try:
            vector = self.extractor.extract_vector(processed_image)
        except Exception as e:
            return {"success": False, "error": f"특징 추출 실패: {str(e)}"}

        # 3. FAISS 유사도 검색
        try:
            search_results = self.search_engine.search_similar(vector, top_k=top_k)
        except Exception as e:
            return {"success": False, "error": f"유사도 검색 실패: {str(e)}"}

        # 4. 결과 검증 및 온라인 검색(Fallback) 분기 처리
        from config import MIN_SIMILARITY_THRESHOLD
        
        # 검색 결과가 없거나, 1위 결과의 유사도 점수가 임계값 미만인 경우
        if not search_results or search_results[0].get("similarity_score", 0) < MIN_SIMILARITY_THRESHOLD:
            # 원본 이미지를 임시 파일로 저장하여 외부 API 전송용으로 준비
            import cv2
            fallback_img_path = os.path.join(os.path.dirname(image_path), "fallback_crop.jpg")
            # BGR 포맷으로 다시 변환하여 저장
            cv2.imwrite(fallback_img_path, cv2.cvtColor(processed_image, cv2.COLOR_RGB2BGR))
            
            return {
                "success": True,
                "message": "로컬 DB에 일치하는 자재가 없습니다. 인터넷 검색을 제안합니다.",
                "fallback_required": True,
                "fallback_image_path": fallback_img_path, # 이 이미지를 Main App에서 Google Vision API 등으로 전송
                "results": search_results # 참고용으로 낮은 점수의 로컬 결과도 함께 반환
            }

        # 5. 최종 결과 반환 (로컬 검색 성공)
        return {
            "success": True,
            "message": "로컬 검색 성공",
            "fallback_required": False,
            "results": search_results
        }

if __name__ == "__main__":
    # 통합 테스트 스크립트
    print("MaterialMatcher 초기화 중... (AI 모델 로드 포함)")
    matcher = MaterialMatcher()
    print("초기화 완료.")

    # 1. 라이브 피드백 테스트 (더미 프레임)
    dummy_frame = np.full((600, 400, 3), (100, 150, 150), dtype=np.uint8)
    import cv2
    cv2.rectangle(dummy_frame, (50, 50), (200, 200), (200, 230, 240), -1) # 적합한 백색 물체
    out_frame, status = matcher.get_live_feedback(dummy_frame)
    print(f"[라이브 피드백 테스트] 상태: {status['message']} (is_ready: {status['is_ready']})")

    # 2. End-to-End 검색 테스트
    test_img_path = "/home/ubuntu/material_matcher/tests/e2e_test.jpg"
    cv2.imwrite(test_img_path, dummy_frame)
    
    print("\n[검색 파이프라인 테스트 시작]")
    result = matcher.search_by_image(test_img_path, top_k=3)
    
    if result["success"]:
        print(f"상태 메시지: {result['message']}")
        if result.get("fallback_required"):
            print(f"인터넷 검색용 크롭 이미지 저장 완료: {result['fallback_image_path']}")
            print("=> 자재샘플북 메인 앱에서 이 이미지를 Google Vision API로 전송하세요.")
            
        print(f"\n검색 결과 (Top 3):")
        for i, res in enumerate(result["results"]):
            print(f"  {i+1}위: [{res['code']}] {res['name']} (유사도: {res['similarity_score']:.4f})")
    else:
        print(f"검색 실패: {result['error']}")
