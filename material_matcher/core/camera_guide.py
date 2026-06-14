"""
촬영 가이드 UI 및 실시간 화이트 밸런스 피드백 모듈
- 카메라 프리뷰 프레임 위에 가이드라인(오버레이)을 그립니다.
- 실시간으로 백색 물체(기준 색상재)의 적합성을 평가하여 초록색/빨간색 피드백을 제공합니다.
- 모바일 앱(Flutter/React Native)으로 포팅하기 쉽도록 렌더링 로직을 분리하여 작성합니다.
"""

import cv2
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.preprocessing import Preprocessor

class CameraGuideUI:
    def __init__(self):
        self.preprocessor = Preprocessor()
        
        # UI 색상 정의 (BGR 포맷)
        self.COLOR_SUCCESS = (0, 255, 0)      # 초록색 (적합)
        self.COLOR_WARNING = (0, 165, 255)    # 주황색 (어두움 등)
        self.COLOR_ERROR   = (0, 0, 255)      # 빨간색 (부적합)
        self.COLOR_GUIDE   = (255, 255, 255)  # 흰색 (기본 가이드)

    def draw_center_crop_guide(self, frame: np.ndarray) -> np.ndarray:
        """
        AI 모델에 입력될 중앙 크롭 영역을 점선 사각형으로 표시합니다.
        "이 원/사각형 안에 자재의 패턴이 꽉 차게 찍어주세요" 용도입니다.
        """
        h, w = frame.shape[:2]
        min_dim = min(h, w)
        # 화면의 60% 크기를 중앙 패턴 인식 영역으로 가이드
        crop_size = int(min_dim * 0.6) 
        
        start_x = (w - crop_size) // 2
        start_y = (h - crop_size) // 2
        end_x = start_x + crop_size
        end_y = start_y + crop_size

        # 반투명 어두운 배경 오버레이 생성 (크롭 영역 바깥쪽을 어둡게)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, start_y), (0, 0, 0), -1)
        cv2.rectangle(overlay, (0, end_y), (w, h), (0, 0, 0), -1)
        cv2.rectangle(overlay, (0, start_y), (start_x, end_y), (0, 0, 0), -1)
        cv2.rectangle(overlay, (end_x, start_y), (w, end_y), (0, 0, 0), -1)
        
        # 원본 프레임과 30% 투명도로 합성
        cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)

        # 중앙 가이드 사각형 그리기 (실선)
        cv2.rectangle(frame, (start_x, start_y), (end_x, end_y), self.COLOR_GUIDE, 2)
        
        # 텍스트 안내
        text = "Center the material pattern here"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 2
        text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
        text_x = start_x + (crop_size - text_size[0]) // 2
        text_y = start_y - 15
        
        cv2.putText(frame, text, (text_x, text_y), font, font_scale, self.COLOR_GUIDE, thickness)
        
        return frame

    def process_live_feedback(self, frame: np.ndarray) -> tuple:
        """
        실시간 카메라 프레임을 받아 백색 물체 적합성을 평가하고,
        상태에 따른 UI(테두리 색상, 안내 메시지)가 합성된 프레임을 반환합니다.
        
        반환값: (합성된 프레임, 현재 상태 딕셔너리)
        """
        # 원본 훼손 방지를 위해 복사본 사용
        display_frame = frame.copy()
        h, w = display_frame.shape[:2]
        
        status = {
            "is_ready": False,
            "message": "",
            "color": self.COLOR_ERROR
        }

        # 1. 밝기 체크
        if not self.preprocessor.check_brightness(frame):
            status["message"] = "Too dark! Turn on the lights."
            status["color"] = self.COLOR_WARNING
        else:
            # 2. 백색 물체 감지 및 적합성 평가
            ref_result = self.preprocessor.detect_white_reference(frame)
            
            if ref_result["valid"]:
                status["is_ready"] = True
                status["message"] = "White reference OK! Ready to capture."
                status["color"] = self.COLOR_SUCCESS
                
                # 적합한 백색 물체의 외곽선을 찾아 초록색으로 표시
                mask = ref_result["mask"]
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if contours:
                    # 가장 큰 외곽선 그리기
                    largest_contour = max(contours, key=cv2.contourArea)
                    cv2.drawContours(display_frame, [largest_contour], -1, self.COLOR_SUCCESS, 3)
            else:
                status["message"] = ref_result["reason"]
                status["color"] = self.COLOR_ERROR

        # 중앙 크롭 가이드 그리기
        display_frame = self.draw_center_crop_guide(display_frame)

        # 상태 메시지를 화면 하단에 표시 (배경 박스 추가하여 가독성 향상)
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        text_size = cv2.getTextSize(status["message"], font, font_scale, thickness)[0]
        
        text_x = (w - text_size[0]) // 2
        text_y = h - 40
        
        # 텍스트 배경 박스
        padding = 10
        cv2.rectangle(display_frame, 
                     (text_x - padding, text_y - text_size[1] - padding), 
                     (text_x + text_size[0] + padding, text_y + padding), 
                     (0, 0, 0), -1)
        
        # 텍스트 출력 (상태에 따른 색상 적용)
        cv2.putText(display_frame, status["message"], (text_x, text_y), 
                    font, font_scale, status["color"], thickness)
                    
        # 전체 화면 테두리에 상태 색상 표시 (직관적인 피드백)
        cv2.rectangle(display_frame, (0, 0), (w-1, h-1), status["color"], 8)

        return display_frame, status

if __name__ == "__main__":
    # 테스트 스크립트
    print("CameraGuideUI 로드 중...")
    ui = CameraGuideUI()
    
    # 가상의 테스트 이미지 3장 생성 (1: 어두움, 2: 백색물체 없음, 3: 정상)
    os.makedirs("/home/ubuntu/material_matcher/tests/ui_output", exist_ok=True)
    
    # 1. 어두운 환경
    dark_img = np.full((600, 400, 3), (30, 30, 30), dtype=np.uint8)
    out1, stat1 = ui.process_live_feedback(dark_img)
    cv2.imwrite("/home/ubuntu/material_matcher/tests/ui_output/1_dark.jpg", out1)
    print(f"Test 1 (Dark): {stat1['message']}")
    
    # 2. 백색 물체 없음
    no_white_img = np.full((600, 400, 3), (100, 150, 150), dtype=np.uint8)
    out2, stat2 = ui.process_live_feedback(no_white_img)
    cv2.imwrite("/home/ubuntu/material_matcher/tests/ui_output/2_no_white.jpg", out2)
    print(f"Test 2 (No White): {stat2['message']}")
    
    # 3. 정상 (밝고 백색 물체 있음)
    good_img = np.full((600, 400, 3), (100, 150, 150), dtype=np.uint8)
    cv2.rectangle(good_img, (50, 50), (200, 200), (200, 230, 240), -1) # 적합한 백색 물체 (크기 증가)
    out3, stat3 = ui.process_live_feedback(good_img)
    cv2.imwrite("/home/ubuntu/material_matcher/tests/ui_output/3_good.jpg", out3)
    print(f"Test 3 (Good): {stat3['message']}")
    
    print("UI 가이드 테스트 이미지 생성 완료 (/tests/ui_output/)")
