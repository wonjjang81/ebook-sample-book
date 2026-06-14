import cv2
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.preprocessing import Preprocessor

# 가상의 테스트 이미지 생성 (노란 조명이 있는 환경 가정)
# 배경은 회색 벽지, 한 쪽에 하얀색(하지만 조명때문에 노랗게 된) 물체 배치
img = np.full((800, 600, 3), (100, 150, 150), dtype=np.uint8) # BGR (약간 노란빛 도는 회색)
# 백색 물체 (A4용지 등) - 조명 때문에 노랗게 찍힘 (B:150, G:200, R:220)
# HSV로 변환했을 때 흰색 조건(V 높음, S 낮음)을 충족하도록 좀 더 밝게 설정
cv2.rectangle(img, (50, 50), (350, 350), (200, 230, 240), -1)

test_path = "/home/ubuntu/material_matcher/tests/dummy_test.jpg"
cv2.imwrite(test_path, img)

preprocessor = Preprocessor()
result = preprocessor.run_pipeline(test_path)

print(f"Success: {result['success']}")
if result['success']:
    print("Message:", result['message'])
    print("Final image shape:", result['processed_image'].shape)
else:
    print("Error:", result['error'])
