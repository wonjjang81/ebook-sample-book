"""
AI 특징 추출 모듈 (Feature Extraction)
- MobileNetV3-Large 모델을 사용하여 이미지에서 특징 벡터(Feature Vector)를 추출합니다.
- 추출된 벡터는 L2 정규화(Normalization)되어 FAISS 코사인 유사도 검색에 최적화됩니다.
"""

import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import MODELS_DIR

class FeatureExtractor:
    def __init__(self):
        """
        MobileNetV3 모델을 로드하고 평가 모드로 설정합니다.
        스마트폰(온디바이스) 환경을 가정하여 CPU 연산에 최적화합니다.
        """
        # 추후 오프라인 동작을 위해 로컬에 모델 가중치를 저장/로드하는 로직 필요
        # 현재는 torchvision의 사전 학습된 가중치를 다운로드하여 사용
        os.makedirs(MODELS_DIR, exist_ok=True)
        
        # 모델 로드 (가장 가볍고 성능이 좋은 MobileNetV3-Large 사용)
        weights = MobileNet_V3_Large_Weights.IMAGENET1K_V2
        self.model = mobilenet_v3_large(weights=weights)
        
        # 분류기(Classifier) 부분 제거 - 특징 벡터만 추출하기 위함
        # MobileNetV3의 경우 classifier의 마지막 레이어 전까지를 사용
        # 특징 벡터 차원: 960
        self.model.classifier = self.model.classifier[:-1]
        
        self.model.eval() # 평가 모드
        
        # 모바일 기기(CPU)에서의 속도 향상을 위해 모델을 TorchScript로 변환하거나
        # 양자화(Quantization)를 적용할 수 있으나, 현재는 기본 CPU 모델 사용
        self.device = torch.device("cpu")
        self.model.to(self.device)

        # PyTorch 표준 이미지 전처리 변환기 (ImageNet 기준)
        # (2단계에서 리사이징은 했지만, 텐서 변환 및 정규화가 필요함)
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def extract_vector(self, image: np.ndarray) -> np.ndarray:
        """
        2단계에서 전처리된 이미지(224x224 RGB numpy array)를 입력받아
        특징 벡터(960차원)를 추출하고 L2 정규화하여 반환합니다.
        """
        # 1. 텐서 변환 및 정규화
        # 주의: image는 0~255 범위의 uint8 RGB numpy 배열이어야 함
        input_tensor = self.transform(image)
        
        # 2. 배치 차원 추가 (1, 3, 224, 224)
        input_batch = input_tensor.unsqueeze(0).to(self.device)
        
        # 3. 모델 추론 (Gradient 계산 비활성화로 메모리 및 속도 최적화)
        with torch.no_grad():
            output = self.model(input_batch)
            
        # 4. 벡터 추출 및 L2 정규화
        # output shape: (1, 960)
        vector = output.squeeze().numpy()
        
        # 코사인 유사도 검색을 위해 L2 정규화 (벡터의 길이를 1로 만듦)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector

if __name__ == "__main__":
    # 모듈 로드 테스트
    print("FeatureExtractor 로드 중...")
    extractor = FeatureExtractor()
    print("모델 로드 완료.")
    
    # 더미 이미지로 벡터 추출 테스트
    dummy_image = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
    vector = extractor.extract_vector(dummy_image)
    
    print(f"추출된 벡터 형태: {vector.shape}")
    print(f"벡터 L2 노름 (정규화 확인, 1.0에 가까워야 함): {np.linalg.norm(vector):.4f}")
