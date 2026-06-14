"""
로컬 벡터 검색 엔진 (Vector Search Engine)
- FAISS(Facebook AI Similarity Search)를 사용하여 특징 벡터 간의 코사인 유사도 검색을 수행합니다.
- SQLite 데이터베이스와 연동하여 벡터 검색 결과(vector_id)를 자재 메타데이터로 변환합니다.
"""

import faiss
import numpy as np
import os
import sys
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import FAISS_INDEX_PATH, FEATURE_DIM, TOP_K_RESULTS, SQLITE_DB_PATH
from core.database import get_materials_by_vector_ids

class VectorSearchEngine:
    def __init__(self):
        """
        FAISS 인덱스를 초기화하거나 로컬 파일에서 로드합니다.
        코사인 유사도 검색을 위해 내적(Inner Product) 기반 인덱스(IndexFlatIP)를 사용합니다.
        (입력 벡터가 L2 정규화되어 있으므로 내적이 코사인 유사도와 동일함)
        """
        self.dim = FEATURE_DIM
        self.index_path = FAISS_INDEX_PATH
        self.index = None
        self._load_or_create_index()

    def _load_or_create_index(self):
        """로컬 파일에 인덱스가 있으면 로드하고, 없으면 새로 생성합니다."""
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            # IndexFlatIP: Inner Product (L2 정규화된 벡터의 경우 코사인 유사도)
            # IndexIDMap: 커스텀 ID(vector_id)를 매핑하기 위한 래퍼
            base_index = faiss.IndexFlatIP(self.dim)
            self.index = faiss.IndexIDMap(base_index)
            self.save_index()

    def save_index(self):
        """현재 FAISS 인덱스를 로컬 파일에 저장합니다."""
        faiss.write_index(self.index, self.index_path)

    def add_vectors(self, vectors: np.ndarray, vector_ids: np.ndarray):
        """
        FAISS 인덱스에 새로운 벡터들을 추가합니다.
        vectors: shape (N, FEATURE_DIM) 인 2D numpy 배열 (L2 정규화 필수)
        vector_ids: shape (N,) 인 1D numpy 배열 (SQLite의 vector_id와 일치해야 함)
        """
        if vectors.ndim == 1:
            vectors = np.expand_dims(vectors, axis=0)
        if isinstance(vector_ids, int):
            vector_ids = np.array([vector_ids], dtype=np.int64)
            
        # 벡터 차원 검증
        if vectors.shape[1] != self.dim:
            raise ValueError(f"벡터 차원이 일치하지 않습니다. (입력: {vectors.shape[1]}, 기대: {self.dim})")
            
        # FAISS는 float32와 int64 타입을 요구함
        vectors = vectors.astype(np.float32)
        vector_ids = vector_ids.astype(np.int64)
        
        self.index.add_with_ids(vectors, vector_ids)
        self.save_index()

    def search_similar(self, query_vector: np.ndarray, top_k: int = TOP_K_RESULTS) -> list:
        """
        주어진 쿼리 벡터와 가장 유사한 자재를 검색하여 SQLite 메타데이터와 결합해 반환합니다.
        query_vector: shape (FEATURE_DIM,) 인 1D numpy 배열 (L2 정규화 필수)
        반환값: [{"code": "...", "name": "...", "score": 0.95, ...}, ...]
        """
        if self.index.ntotal == 0:
            return []

        # 1. 쿼리 벡터 형태 맞추기 (1, FEATURE_DIM)
        if query_vector.ndim == 1:
            query_vector = np.expand_dims(query_vector, axis=0)
        query_vector = query_vector.astype(np.float32)

        # 2. FAISS 검색 수행
        # distances: 유사도 점수 (코사인 유사도, 1.0에 가까울수록 유사함)
        # indices: 검색된 vector_id
        distances, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))
        
        # 1D 배열로 변환
        scores = distances[0]
        vector_ids = indices[0].tolist()

        # 3. SQLite에서 메타데이터 조회
        conn = sqlite3.connect(SQLITE_DB_PATH)
        materials = get_materials_by_vector_ids(conn, vector_ids)
        conn.close()

        # 4. 검색 결과와 메타데이터 결합 (유사도 점수 높은 순으로 정렬 유지)
        results = []
        # vector_id를 키로 하는 딕셔너리 생성 (빠른 매핑을 위해)
        material_dict = {m["vector_id"]: m for m in materials}
        
        for i, vid in enumerate(vector_ids):
            if vid in material_dict:
                item = material_dict[vid].copy()
                item["similarity_score"] = float(scores[i])
                results.append(item)

        return results

if __name__ == "__main__":
    # 테스트 스크립트
    print("VectorSearchEngine 로드 중...")
    engine = VectorSearchEngine()
    print(f"현재 인덱스에 등록된 벡터 수: {engine.index.ntotal}")
    
    # 더미 데이터 삽입 테스트 (최초 1회만 실행되도록)
    if engine.index.ntotal == 0:
        print("더미 벡터 데이터를 생성하여 FAISS에 추가합니다...")
        # 1단계에서 삽입한 샘플 데이터(5개)의 vector_id (1~5 가정)
        dummy_ids = np.array([1, 2, 3, 4, 5], dtype=np.int64)
        dummy_vectors = np.random.rand(5, FEATURE_DIM).astype(np.float32)
        # L2 정규화
        faiss.normalize_L2(dummy_vectors)
        
        engine.add_vectors(dummy_vectors, dummy_ids)
        print(f"추가 후 인덱스 벡터 수: {engine.index.ntotal}")
        
        # DB의 vector_id 업데이트 (테스트용)
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        codes = ["LG-WP-0001", "LG-WP-0002", "HD-FL-0001", "SH-FM-0001", "GN-WP-0001"]
        for i, code in enumerate(codes):
            cursor.execute("UPDATE materials SET vector_id = ? WHERE code = ?", (int(dummy_ids[i]), code))
        conn.commit()
        conn.close()
        print("SQLite vector_id 매핑 완료.")

    # 검색 테스트
    print("유사도 검색 테스트 진행...")
    query = np.random.rand(FEATURE_DIM).astype(np.float32)
    faiss.normalize_L2(np.expand_dims(query, axis=0)) # 2D로 만들어서 정규화 후 다시 1D로
    
    results = engine.search_similar(query, top_k=3)
    for i, res in enumerate(results):
        print(f"{i+1}위: [{res['code']}] {res['name']} (유사도: {res['similarity_score']:.4f})")
