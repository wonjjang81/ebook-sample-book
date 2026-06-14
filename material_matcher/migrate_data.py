"""
자재샘플북 데이터 마이그레이션 스크립트
sampleData.ts의 자재 데이터를 SDK의 SQLite DB에 등록하고 FAISS 인덱스를 생성합니다.

사용법:
  python3 migrate_data.py

주의:
  - 이미지 파일이 있는 자재만 FAISS 인덱스에 등록됩니다.
  - 이미지가 없는 자재는 SQLite에만 등록됩니다.
  - 이미지 업로드 후 재실행하면 FAISS 인덱스가 갱신됩니다.
"""

import os
import sys
import json
import re
import sqlite3
import numpy as np

SDK_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SDK_DIR)

from core.database import init_database, insert_material
from core.search_engine import VectorSearchEngine
from core.feature_extraction import FeatureExtractor
import cv2

# 자재샘플북 프로젝트 루트
PROJECT_ROOT = os.path.dirname(SDK_DIR)
SAMPLE_DATA_PATH = os.path.join(PROJECT_ROOT, "client", "src", "data", "sampleData.ts")
PUBLIC_IMAGE_DIR = os.path.join(PROJECT_ROOT, "client", "public")


def parse_sample_data(ts_path: str) -> list:
    """sampleData.ts에서 제품 데이터를 파싱합니다."""
    with open(ts_path, "r", encoding="utf-8") as f:
        content = f.read()

    products = []

    # 각 제품 블록 파싱 (id, productNo, name, brand, line, image, color, collectionCategory 추출)
    # { id: '...', productNo: '...', name: '...', ... } 패턴 매칭
    block_pattern = re.compile(
        r'\{\s*id:\s*[\'"]([^\'"]+)[\'"].*?productNo:\s*[\'"]([^\'"]+)[\'"].*?name:\s*[\'"]([^\'"]+)[\'"].*?brand:\s*[\'"]([^\'"]+)[\'"].*?line:\s*[\'"]([^\'"]+)[\'"]',
        re.DOTALL
    )

    # 이미지 경로 추출
    image_pattern = re.compile(r"image:\s*['\"]([^'\"]+)['\"]")
    color_pattern = re.compile(r"color:\s*['\"]([^'\"]+)['\"]")
    color_hex_pattern = re.compile(r"colorHex:\s*['\"]([^'\"]+)['\"]")
    collection_cat_pattern = re.compile(r"collectionCategory:\s*['\"]([^'\"]+)['\"]")
    collection_name_pattern = re.compile(r"collectionName:\s*['\"]([^'\"]+)['\"]")
    specs_pattern = re.compile(r"specs:\s*\[([^\]]*)\]", re.DOTALL)

    # 제품 블록 단위로 분리
    # 각 제품은 { id: '...' 로 시작
    product_blocks = re.split(r'(?=\{\s*id:\s*[\'"])', content)

    for block in product_blocks:
        id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", block)
        product_no_match = re.search(r"productNo:\s*['\"]([^'\"]+)['\"]", block)
        name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", block)
        brand_match = re.search(r"brand:\s*['\"]([^'\"]+)['\"]", block)
        line_match = re.search(r"line:\s*['\"]([^'\"]+)['\"]", block)

        if not all([id_match, product_no_match, name_match, brand_match, line_match]):
            continue

        product_id = id_match.group(1)
        product_no = product_no_match.group(1)
        name = name_match.group(1)
        brand = brand_match.group(1)
        line = line_match.group(1)

        # 선택 필드
        image_match = image_pattern.search(block)
        color_match = color_pattern.search(block)
        color_hex_match = color_hex_pattern.search(block)
        collection_cat_match = collection_cat_pattern.search(block)
        collection_name_match = collection_name_pattern.search(block)
        specs_match = specs_pattern.search(block)

        image_path = image_match.group(1) if image_match else ""
        color = color_match.group(1) if color_match else ""
        color_hex = color_hex_match.group(1) if color_hex_match else ""
        collection_cat = collection_cat_match.group(1) if collection_cat_match else ""
        collection_name = collection_name_match.group(1) if collection_name_match else ""

        # 스펙 태그 파싱
        specs = []
        if specs_match:
            spec_items = re.findall(r"['\"]([^'\"]+)['\"]", specs_match.group(1))
            specs = spec_items

        # 카테고리 결정 (line 기반)
        if "필름" in brand or "film" in line.lower():
            category = "film"
        elif "바닥" in brand or "flooring" in line.lower():
            category = "flooring"
        else:
            category = "wallpaper"

        products.append({
            "id": product_id,
            "code": product_no,
            "name": name,
            "brand": brand,
            "line": line,
            "category": category,
            "image": image_path,
            "color": color,
            "color_hex": color_hex,
            "color_tags": [color] if color else [],
            "pattern_tag": collection_cat,
            "collection_name": collection_name,
            "specs": specs,
            "thumbnail": image_path,
            "vector_id": -1,
        })

    return products


def migrate(index_images: bool = True):
    """자재 데이터를 SQLite에 삽입하고, 이미지가 있는 경우 FAISS에도 등록합니다."""
    print("=" * 60)
    print("자재샘플북 데이터 마이그레이션 시작")
    print("=" * 60)

    # 1. 데이터 파싱
    print(f"\n[1/4] sampleData.ts 파싱 중...")
    products = parse_sample_data(SAMPLE_DATA_PATH)
    print(f"  → 파싱된 제품 수: {len(products)}개")

    # 2. SQLite 초기화 및 데이터 삽입
    print(f"\n[2/4] SQLite DB에 자재 데이터 등록 중...")
    conn = init_database()
    inserted = 0
    for p in products:
        try:
            insert_material(conn, p)
            inserted += 1
        except Exception as e:
            print(f"  [경고] {p['code']} 삽입 실패: {e}")
    conn.close()
    print(f"  → 등록 완료: {inserted}개")

    # 3. FAISS 인덱스 생성 (이미지 있는 제품만)
    if not index_images:
        print("\n[3/4] FAISS 인덱싱 건너뜀 (index_images=False)")
    else:
        print(f"\n[3/4] 이미지 기반 FAISS 인덱스 생성 중...")
        print("  (이미지가 없는 제품은 건너뜁니다. 이미지 업로드 후 재실행하세요.)")

        extractor = FeatureExtractor()
        engine = VectorSearchEngine()
        conn = init_database()

        indexed = 0
        skipped = 0

        for i, p in enumerate(products):
            img_path = p["image"]
            if not img_path:
                skipped += 1
                continue

            # 절대 경로 변환
            if img_path.startswith("/"):
                abs_img_path = os.path.join(PUBLIC_IMAGE_DIR, img_path.lstrip("/"))
            else:
                abs_img_path = os.path.join(PUBLIC_IMAGE_DIR, img_path)

            if not os.path.exists(abs_img_path):
                skipped += 1
                continue

            try:
                # 이미지 로드 및 전처리
                img = cv2.imread(abs_img_path)
                if img is None:
                    skipped += 1
                    continue

                # 224x224 RGB로 변환
                img_resized = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)
                img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

                # 특징 벡터 추출
                vector = extractor.extract_vector(img_rgb)

                # vector_id = 자재 DB row id (1-indexed)
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM materials WHERE code = ?", (p["code"],))
                row = cursor.fetchone()
                if row is None:
                    skipped += 1
                    continue

                vector_id = row[0]

                # FAISS에 추가
                engine.add_vectors(
                    np.array([vector], dtype=np.float32),
                    np.array([vector_id], dtype=np.int64)
                )

                # SQLite vector_id 업데이트
                cursor.execute("UPDATE materials SET vector_id = ? WHERE id = ?", (vector_id, vector_id))
                conn.commit()

                indexed += 1
                if (indexed + skipped) % 10 == 0:
                    print(f"  진행: {indexed + skipped}/{len(products)} (인덱싱: {indexed}, 건너뜀: {skipped})")

            except Exception as e:
                print(f"  [경고] {p['code']} 인덱싱 실패: {e}")
                skipped += 1

        conn.close()
        print(f"  → FAISS 인덱싱 완료: {indexed}개 / 건너뜀: {skipped}개")

    # 4. 결과 요약
    print(f"\n[4/4] 마이그레이션 완료 요약")
    conn = init_database()
    from core.database import get_total_count
    total = get_total_count(conn)
    conn.close()

    engine = VectorSearchEngine()
    faiss_count = engine.index.ntotal

    print(f"  SQLite 등록 자재: {total}개")
    print(f"  FAISS 인덱스 벡터: {faiss_count}개")
    print("\n마이그레이션 완료!")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="자재샘플북 데이터 마이그레이션")
    parser.add_argument("--no-faiss", action="store_true", help="FAISS 인덱싱 건너뜀 (메타데이터만 등록)")
    args = parser.parse_args()

    migrate(index_images=not args.no_faiss)
