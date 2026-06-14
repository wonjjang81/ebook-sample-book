"""
이미지 전처리 모듈 (Image Preprocessing)
- 백색 물체 자동 감지 및 적합성 검증
- 화이트 밸런스 자동 보정
- 원근 보정 및 이미지 크롭/리사이징
"""

import cv2
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import WHITE_REF_CONFIG, MODEL_INPUT_SIZE, MIN_BRIGHTNESS_THRESHOLD


class Preprocessor:
    def __init__(self):
        self.config = WHITE_REF_CONFIG

    def check_brightness(self, image: np.ndarray) -> bool:
        """
        이미지의 전체 밝기가 적절한지 확인합니다.
        너무 어두우면 False를 반환하여 사용자에게 경고할 수 있도록 합니다.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        return mean_brightness >= MIN_BRIGHTNESS_THRESHOLD

    def detect_white_reference(self, image: np.ndarray) -> dict:
        """
        이미지 내에서 기준 색상재(백색 물체)를 감지하고 적합성을 검증합니다.
        반환값: {
            "valid": bool (적합성 여부),
            "reason": str (실패 사유 또는 성공 메시지),
            "mask": np.ndarray (백색 물체 마스크 이미지, 성공 시),
            "mean_color": tuple (BGR 평균 색상, 성공 시)
        }
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # 1. 흰색 영역 마스크 생성 (채도 낮고, 명도 높은 영역)
        # 조명에 의해 노랗게 변한 백색 물체도 감지할 수 있도록 범위를 약간 넓게 설정
        # v_min은 config 값을 사용하되, s_max는 약간 더 허용
        lower_white = np.array([0, 0, self.config["white_threshold_hsv"]["v_min"] - 30])
        upper_white = np.array([180, self.config["white_threshold_hsv"]["s_max"] + 40, 255])
        mask = cv2.inRange(hsv, lower_white, upper_white)

        # 노이즈 제거 (Morphology 연산)
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        # 2. 면적 비율 검증
        total_pixels = image.shape[0] * image.shape[1]
        white_pixels = cv2.countNonZero(mask)
        area_ratio = white_pixels / total_pixels

        if area_ratio < self.config["min_area_ratio"]:
            return {"valid": False, "reason": f"백색 물체가 너무 작거나 없습니다. (비율: {area_ratio:.1%}, 최소: {self.config['min_area_ratio']:.1%})"}
        if area_ratio > self.config["max_area_ratio"]:
            return {"valid": False, "reason": f"백색 물체가 화면을 너무 많이 가립니다. (비율: {area_ratio:.1%}, 최대: {self.config['max_area_ratio']:.1%})"}

        # 3. 색상 균일도 검증 (백색 물체 영역 내의 색상 표준편차)
        white_region = cv2.bitwise_and(image, image, mask=mask)
        # 마스크가 적용된 픽셀만 추출하여 계산
        pixels = image[mask > 0]
        std_dev = np.std(pixels, axis=0)
        mean_std = np.mean(std_dev)

        if mean_std > self.config["uniformity_threshold"]:
            return {"valid": False, "reason": f"감지된 백색 물체의 색상이 균일하지 않습니다. (그림자나 무늬가 있을 수 있음. 균일도: {mean_std:.1f})"}

        mean_color = np.mean(pixels, axis=0)  # [B, G, R]
        
        return {
            "valid": True,
            "reason": "적합한 기준 색상재가 감지되었습니다.",
            "mask": mask,
            "mean_color": mean_color
        }

    def apply_white_balance(self, image: np.ndarray, ref_mean_color: np.ndarray) -> np.ndarray:
        """
        감지된 백색 물체의 평균 색상을 기준으로 전체 이미지의 화이트 밸런스를 보정합니다.
        ref_mean_color: [B, G, R] 배열
        """
        # 목표는 기준 색상이 완벽한 흰색(255, 255, 255)이 되도록 하는 것
        b_mean, g_mean, r_mean = ref_mean_color
        
        # 보정 계수 계산 (가장 밝은 채널을 기준으로 하거나 255 기준으로 할 수 있음)
        # 여기서는 255를 기준으로 보정 (빛의 강도까지 보정하는 효과)
        b_scale = 255.0 / b_mean if b_mean > 0 else 1.0
        g_scale = 255.0 / g_mean if g_mean > 0 else 1.0
        r_scale = 255.0 / r_mean if r_mean > 0 else 1.0

        # 보정 적용 및 클리핑
        balanced = np.zeros_like(image, dtype=np.float32)
        balanced[:, :, 0] = image[:, :, 0] * b_scale
        balanced[:, :, 1] = image[:, :, 1] * g_scale
        balanced[:, :, 2] = image[:, :, 2] * r_scale
        
        balanced = np.clip(balanced, 0, 255).astype(np.uint8)
        return balanced

    def process_for_model(self, image: np.ndarray) -> np.ndarray:
        """
        AI 모델 입력 규격에 맞게 중앙 영역을 크롭하고 리사이징합니다.
        (현재는 단순 중앙 크롭을 구현. 원근 보정은 사용자가 화면 가이드에 맞춰 찍었다고 가정하거나,
         추후 네 모서리 감지 로직을 추가할 수 있음)
        """
        h, w = image.shape[:2]
        
        # 짧은 쪽을 기준으로 정사각형(중앙) 크롭
        min_dim = min(h, w)
        start_x = (w - min_dim) // 2
        start_y = (h - min_dim) // 2
        cropped = image[start_y:start_y+min_dim, start_x:start_x+min_dim]
        
        # 모델 입력 사이즈로 리사이즈
        resized = cv2.resize(cropped, MODEL_INPUT_SIZE, interpolation=cv2.INTER_AREA)
        
        # BGR -> RGB 변환 (PyTorch 모델은 보통 RGB를 사용)
        rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        return rgb_image

    def run_pipeline(self, image_path: str) -> dict:
        """
        이미지 경로를 받아 전체 전처리 파이프라인을 실행합니다.
        """
        if not os.path.exists(image_path):
            return {"success": False, "error": "파일을 찾을 수 없습니다."}

        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "이미지를 읽을 수 없습니다."}

        # 1. 밝기 체크
        if not self.check_brightness(image):
            return {"success": False, "error": "사진이 너무 어둡습니다. 조명을 밝게 해주세요."}

        # 2. 기준 색상재 감지
        ref_result = self.detect_white_reference(image)
        if not ref_result["valid"]:
            return {"success": False, "error": ref_result["reason"]}

        # 3. 화이트 밸런스 보정
        balanced_image = self.apply_white_balance(image, ref_result["mean_color"])

        # 4. 모델 입력용 크롭 및 리사이즈
        final_image = self.process_for_model(balanced_image)

        return {
            "success": True,
            "processed_image": final_image,  # np.ndarray (RGB)
            "balanced_preview": balanced_image, # 보정된 전체 이미지 (미리보기용, BGR)
            "message": "전처리 완료"
        }

if __name__ == "__main__":
    # 테스트용 더미 스크립트
    print("전처리 모듈 로드 성공")
