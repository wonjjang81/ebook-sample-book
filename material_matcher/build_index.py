"""
build_index.py
==============
실제 이미지 파일을 스캔하여 MobileNetV3 특징 벡터를 추출하고
FAISS 인덱스를 생성합니다.

사용법:
    python3 build_index.py [--image-root /path/to/public]
"""

import os
import sys
import sqlite3
import argparse
import json
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent))

def get_image_root():
    """이미지 루트 경로 반환"""
    script_dir = Path(__file__).parent
    # ebook_sample_book/client/public
    return script_dir.parent / "client" / "public"

def scan_images(image_root: Path):
    """public 디렉토리에서 모든 이미지 파일 스캔"""
    images = []
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
        for img_path in image_root.rglob(ext):
            # public 기준 상대 경로 (URL 경로)
            rel_path = "/" + str(img_path.relative_to(image_root)).replace("\\", "/")
            images.append({
                "abs_path": str(img_path),
                "url_path": rel_path,
                "filename": img_path.stem,  # 확장자 없는 파일명 = 제품번호
            })
    return images

def match_image_to_db(images, conn):
    """이미지 파일명(제품번호)으로 DB 자재와 매핑"""
    cur = conn.cursor()
    matched = []
    unmatched = []
    
    for img in images:
        # 파일명(제품번호)으로 DB에서 찾기
        code = img["filename"]
        cur.execute("SELECT id, code, name FROM materials WHERE code = ?", (code,))
        row = cur.fetchone()
        
        if row:
            matched.append({
                "db_id": row[0],
                "code": row[1],
                "name": row[2],
                "abs_path": img["abs_path"],
                "url_path": img["url_path"],
            })
        else:
            unmatched.append(img)
    
    return matched, unmatched

def extract_features(matched_items):
    """FeatureExtractor(MobileNetV3 classifier[:-1] 1280차원)로 특징 벡터 추출"""
    try:
        import cv2
        import numpy as np
        from core.feature_extraction import FeatureExtractor
    except ImportError as e:
        print(f"[ERROR] 필요한 패키지가 없습니다: {e}")
        sys.exit(1)

    print(f"[INFO] MobileNetV3-Large 모델 로딩 (FeatureExtractor)...")
    extractor = FeatureExtractor()

    results = []
    total = len(matched_items)
    
    for i, item in enumerate(matched_items):
        try:
            img_bgr = cv2.imread(item["abs_path"])
            if img_bgr is None:
                print(f"  [SKIP] {item['code']}: 이미지 읽기 실패")
                continue
            # 중앙 정사각 크롭 + 224x224 리사이즈 + RGB
            h, w = img_bgr.shape[:2]
            min_dim = min(h, w)
            sx, sy = (w - min_dim) // 2, (h - min_dim) // 2
            cropped = img_bgr[sy:sy+min_dim, sx:sx+min_dim]
            resized = cv2.resize(cropped, (224, 224), interpolation=cv2.INTER_AREA)
            rgb_img = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            feat = extractor.extract_vector(rgb_img)  # 1280차원, L2 정규화됨
            
            results.append({
                **item,
                "vector": feat.tolist(),
                "vector_dim": len(feat),
            })
            
            if (i + 1) % 10 == 0 or (i + 1) == total:
                print(f"  [{i+1}/{total}] {item['code']} - {item['name']} ({len(feat)}차원)")
                
        except Exception as e:
            print(f"  [SKIP] {item['code']}: {e}")
    
    return results

def build_faiss_index(feature_results, db_path, faiss_path):
    """FAISS 인덱스 생성 및 DB 업데이트"""
    try:
        import faiss
        import numpy as np
    except ImportError:
        print("[ERROR] faiss-cpu가 없습니다. 설치: sudo pip3 install faiss-cpu")
        sys.exit(1)

    if not feature_results:
        print("[ERROR] 특징 벡터가 없습니다.")
        return 0

    vectors = np.array([r["vector"] for r in feature_results], dtype=np.float32)
    dim = vectors.shape[1]
    
    print(f"\n[INFO] FAISS 인덱스 생성: {len(vectors)}개 벡터, {dim}차원")
    
    # DB 업데이트: vector_id = DB row id, thumbnail 갱신
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    vector_ids = []
    for r in feature_results:
        db_id = r["db_id"]
        cur.execute(
            "UPDATE materials SET vector_id=?, thumbnail=?, updated_at=datetime('now') WHERE id=?",
            (db_id, r["url_path"], db_id)
        )
        vector_ids.append(db_id)
    
    conn.commit()
    conn.close()
    
    # IndexIDMap: DB row id를 FAISS ID로 사용 (search_engine.py와 호환)
    vector_ids_np = np.array(vector_ids, dtype=np.int64)
    base_index = faiss.IndexFlatIP(dim)
    index = faiss.IndexIDMap(base_index)
    index.add_with_ids(vectors, vector_ids_np)
    
    # FAISS 인덱스 저장
    faiss.write_index(index, faiss_path)
    print(f"[OK] FAISS 인덱스 저장: {faiss_path} (IndexIDMap, {index.ntotal}개 벡터)")
    print(f"[OK] DB 업데이트 완료: {len(feature_results)}개 자재 벡터 인덱싱")
    return len(feature_results)

def main():
    parser = argparse.ArgumentParser(description="FAISS 인덱스 빌드")
    parser.add_argument("--image-root", default=None, help="public 디렉토리 경로")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    db_path = str(script_dir / "data" / "materials.db")
    faiss_path = str(script_dir / "data" / "materials.faiss")

    image_root = Path(args.image_root) if args.image_root else get_image_root()
    
    print(f"=== FAISS 인덱스 빌드 시작 ===")
    print(f"이미지 루트: {image_root}")
    print(f"DB 경로: {db_path}")
    print(f"FAISS 경로: {faiss_path}")
    print()

    # 1. 이미지 스캔
    print("[1/4] 이미지 파일 스캔...")
    images = scan_images(image_root)
    print(f"  발견된 이미지: {len(images)}개")

    # 2. DB 매핑
    print("\n[2/4] DB 자재와 매핑...")
    conn = sqlite3.connect(db_path)
    matched, unmatched = match_image_to_db(images, conn)
    conn.close()
    
    print(f"  매핑 성공: {len(matched)}개")
    print(f"  매핑 실패 (DB에 없음): {len(unmatched)}개")
    
    if unmatched:
        print("  미매핑 파일:")
        for u in unmatched[:5]:
            print(f"    - {u['filename']} ({u['url_path']})")
        if len(unmatched) > 5:
            print(f"    ... 외 {len(unmatched)-5}개")

    if not matched:
        print("[ERROR] 매핑된 이미지가 없습니다.")
        sys.exit(1)

    # 3. 특징 벡터 추출
    print(f"\n[3/4] 특징 벡터 추출 ({len(matched)}개)...")
    feature_results = extract_features(matched)
    print(f"  추출 완료: {len(feature_results)}개")

    # 4. FAISS 인덱스 생성
    print("\n[4/4] FAISS 인덱스 생성...")
    count = build_faiss_index(feature_results, db_path, faiss_path)

    print(f"\n=== 완료 ===")
    print(f"인덱싱된 자재: {count}개")
    print(f"이제 AI 검색이 실제 이미지 기반으로 작동합니다.")

if __name__ == "__main__":
    main()
