"""
로컬 SQLite 데이터베이스 초기화 및 관리 모듈
자재 메타데이터(품번, 브랜드, 카테고리, 이미지 경로 등)를 저장합니다.
"""

import sqlite3
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SQLITE_DB_PATH, VECTOR_META_PATH, DATA_DIR


def init_database() -> sqlite3.Connection:
    """
    로컬 SQLite DB를 초기화하고 테이블을 생성합니다.
    이미 존재하는 경우 기존 DB를 그대로 사용합니다.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()

    # ── 자재 메타데이터 테이블 ──────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS materials (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            code        TEXT    NOT NULL UNIQUE,   -- 제품 품번 (예: LG-WP-1234)
            name        TEXT    NOT NULL,           -- 제품명
            brand       TEXT    NOT NULL,           -- 브랜드 (예: LG지인, 현대L&C)
            category    TEXT    NOT NULL,           -- 카테고리 (wallpaper/film/flooring)
            color_tags  TEXT    DEFAULT '[]',       -- 주요 색상 태그 (JSON 배열)
            pattern_tag TEXT    DEFAULT '',         -- 패턴 태그 (예: 추상, 줄무늬, 무지)
            thumbnail   TEXT    DEFAULT '',         -- 썸네일 이미지 로컬 경로 또는 CDN URL
            vector_id   INTEGER DEFAULT -1,         -- FAISS 인덱스 내 벡터 ID
            added_at    TEXT    DEFAULT (datetime('now')),
            updated_at  TEXT    DEFAULT (datetime('now'))
        )
    """)

    # ── 동기화 이력 테이블 ──────────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            synced_at   TEXT    NOT NULL DEFAULT (datetime('now')),
            added_count INTEGER DEFAULT 0,
            removed_count INTEGER DEFAULT 0,
            status      TEXT    DEFAULT 'success'
        )
    """)

    conn.commit()
    return conn


def insert_material(conn: sqlite3.Connection, material: dict) -> int:
    """
    자재 데이터를 DB에 삽입합니다.
    동일 품번이 존재하면 업데이트합니다.
    반환값: 삽입/업데이트된 row의 id
    """
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO materials (code, name, brand, category, color_tags, pattern_tag, thumbnail, vector_id)
        VALUES (:code, :name, :brand, :category, :color_tags, :pattern_tag, :thumbnail, :vector_id)
        ON CONFLICT(code) DO UPDATE SET
            name        = excluded.name,
            brand       = excluded.brand,
            color_tags  = excluded.color_tags,
            pattern_tag = excluded.pattern_tag,
            thumbnail   = excluded.thumbnail,
            vector_id   = excluded.vector_id,
            updated_at  = datetime('now')
    """, {
        "code":        material.get("code", ""),
        "name":        material.get("name", ""),
        "brand":       material.get("brand", ""),
        "category":    material.get("category", "wallpaper"),
        "color_tags":  json.dumps(material.get("color_tags", []), ensure_ascii=False),
        "pattern_tag": material.get("pattern_tag", ""),
        "thumbnail":   material.get("thumbnail", ""),
        "vector_id":   material.get("vector_id", -1),
    })
    conn.commit()
    return cursor.lastrowid


def get_material_by_code(conn: sqlite3.Connection, code: str) -> dict | None:
    """품번으로 자재 정보를 조회합니다."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM materials WHERE code = ?", (code,))
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [desc[0] for desc in cursor.description]
    return dict(zip(columns, row))


def get_materials_by_vector_ids(conn: sqlite3.Connection, vector_ids: list) -> list:
    """FAISS 검색 결과로 얻은 vector_id 목록으로 자재 정보를 일괄 조회합니다."""
    if not vector_ids:
        return []
    placeholders = ",".join("?" * len(vector_ids))
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT * FROM materials WHERE vector_id IN ({placeholders})",
        vector_ids
    )
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_total_count(conn: sqlite3.Connection) -> int:
    """등록된 전체 자재 수를 반환합니다."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM materials")
    return cursor.fetchone()[0]


if __name__ == "__main__":
    # 직접 실행 시 DB 초기화 테스트
    conn = init_database()
    print(f"[OK] DB 초기화 완료: {SQLITE_DB_PATH}")

    # 샘플 데이터 삽입 테스트
    sample_materials = [
        {"code": "LG-WP-0001", "name": "모던 화이트 엠보",  "brand": "LG지인",    "category": "wallpaper", "color_tags": ["white", "ivory"], "pattern_tag": "엠보"},
        {"code": "LG-WP-0002", "name": "내추럴 우드 패턴",  "brand": "LG지인",    "category": "wallpaper", "color_tags": ["beige", "brown"], "pattern_tag": "우드"},
        {"code": "HD-FL-0001", "name": "오크 원목 마루",     "brand": "현대L&C",   "category": "flooring",  "color_tags": ["brown", "tan"],   "pattern_tag": "나뭇결"},
        {"code": "SH-FM-0001", "name": "무광 블랙 필름",    "brand": "신한벽지",  "category": "film",      "color_tags": ["black"],          "pattern_tag": "무지"},
        {"code": "GN-WP-0001", "name": "플로럴 핑크 벽지",  "brand": "개나리벽지", "category": "wallpaper", "color_tags": ["pink", "white"],  "pattern_tag": "꽃무늬"},
    ]
    for m in sample_materials:
        insert_material(conn, m)

    total = get_total_count(conn)
    print(f"[OK] 샘플 데이터 {total}개 삽입 완료")
    conn.close()
