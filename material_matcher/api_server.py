"""
Material Matcher API 서버
FastAPI 기반으로 SDK를 감싸서 자재샘플북 React 앱과 통신합니다.

엔드포인트:
  GET  /api/health              - 서버 상태 확인
  POST /api/match/single        - 단일 이미지 검색
  POST /api/match/ensemble      - 다중 이미지 앙상블 검색
  POST /api/match/feedback      - 실시간 카메라 프리뷰 피드백
  GET  /api/db/status           - DB 등록 자재 수 확인
"""

import os
import sys
import tempfile
import base64
import logging
from typing import List, Optional
from contextlib import asynccontextmanager

import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# SDK 경로 설정
SDK_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SDK_DIR)

from core.matcher import MaterialMatcher
from core.database import init_database, get_total_count
from config import SQLITE_DB_PATH

# 로깅 설정
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── 전역 변수 ────────────────────────────────────────────────────────────────
matcher: Optional[MaterialMatcher] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작 시 MaterialMatcher 초기화 (AI 모델 로드)"""
    global matcher
    logger.info("MaterialMatcher 초기화 중... (AI 모델 로드, 약 5~10초 소요)")
    try:
        matcher = MaterialMatcher()
        logger.info("MaterialMatcher 초기화 완료.")
    except Exception as e:
        logger.error(f"MaterialMatcher 초기화 실패: {e}")
        matcher = None
    yield
    logger.info("서버 종료.")


# ─── FastAPI 앱 생성 ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Material Matcher API",
    description="자재샘플북 AI 유사 자재 검색 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정 (React 개발 서버 및 Netlify 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://sensational-cheesecake-5db051.netlify.app",
        "*",  # 개발 편의를 위해 전체 허용 (운영 시 특정 도메인으로 제한 권장)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 유틸리티 함수 ────────────────────────────────────────────────────────────
def save_upload_to_temp(upload_file: UploadFile) -> str:
    """업로드된 파일을 임시 파일로 저장하고 경로를 반환합니다."""
    suffix = os.path.splitext(upload_file.filename or "image.jpg")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = upload_file.file.read()
        tmp.write(content)
        return tmp.name


def cleanup_temp_files(*paths: str):
    """임시 파일들을 삭제합니다."""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def encode_image_to_base64(image_path: str) -> Optional[str]:
    """이미지 파일을 base64 문자열로 인코딩합니다."""
    try:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception:
        return None


# ─── 엔드포인트 ───────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """서버 및 SDK 상태 확인"""
    try:
        conn = init_database()
        total = get_total_count(conn)
        conn.close()
    except Exception:
        total = 0

    return {
        "status": "ok",
        "sdk_ready": matcher is not None,
        "db_material_count": total,
        "message": "Material Matcher API 서버가 정상 동작 중입니다." if matcher else "SDK 초기화 실패 - 서버 로그를 확인하세요.",
    }


@app.post("/api/match/single")
async def match_single(image: UploadFile = File(..., description="검색할 자재 이미지 (JPG/PNG)")):
    """
    단일 이미지로 유사 자재를 검색합니다.
    
    - 이미지 전처리(밝기 검사, 화이트밸런스 보정, 크롭) 후 AI 벡터 추출
    - FAISS 로컬 DB에서 유사도 Top 5 반환
    - 유사도 0.65 미만 시 fallback_required=true 반환
    """
    if matcher is None:
        raise HTTPException(status_code=503, detail="SDK가 초기화되지 않았습니다.")

    tmp_path = None
    try:
        tmp_path = save_upload_to_temp(image)
        result = matcher.search_by_image(tmp_path, top_k=5)

        if not result["success"]:
            return JSONResponse(status_code=400, content={
                "success": False,
                "error": result.get("error", "검색 실패"),
            })

        # Fallback 이미지를 base64로 인코딩하여 반환
        if result.get("fallback_required") and result.get("fallback_image_path"):
            result["fallback_image_base64"] = encode_image_to_base64(result["fallback_image_path"])
            cleanup_temp_files(result["fallback_image_path"])
            result.pop("fallback_image_path", None)

        return result

    except Exception as e:
        logger.error(f"단일 검색 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_temp_files(tmp_path)


@app.post("/api/match/ensemble")
async def match_ensemble(images: List[UploadFile] = File(..., description="검색할 자재 이미지 2~3장 (JPG/PNG)")):
    """
    다중 이미지 앙상블 검색으로 정확도를 높입니다.
    
    - 동일 자재를 각도/조명을 달리하여 2~3장 촬영 후 업로드
    - 각 이미지의 특징 벡터를 평균화(앙상블)하여 검색 정확도 향상
    - 단일 촬영 대비 약 15~20% 정확도 개선 효과
    """
    if matcher is None:
        raise HTTPException(status_code=503, detail="SDK가 초기화되지 않았습니다.")

    if len(images) < 1 or len(images) > 5:
        raise HTTPException(status_code=400, detail="이미지는 1~5장 사이로 업로드해주세요.")

    tmp_paths = []
    try:
        for img in images:
            tmp_paths.append(save_upload_to_temp(img))

        result = matcher.search_by_images(tmp_paths, top_k=5)

        if not result["success"]:
            return JSONResponse(status_code=400, content={
                "success": False,
                "error": result.get("error", "앙상블 검색 실패"),
            })

        # Fallback 이미지 base64 인코딩
        if result.get("fallback_required") and result.get("fallback_image_path"):
            result["fallback_image_base64"] = encode_image_to_base64(result["fallback_image_path"])
            cleanup_temp_files(result["fallback_image_path"])
            result.pop("fallback_image_path", None)

        return result

    except Exception as e:
        logger.error(f"앙상블 검색 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_temp_files(*tmp_paths)


@app.post("/api/match/feedback")
async def camera_feedback(frame: UploadFile = File(..., description="카메라 프리뷰 프레임 이미지")):
    """
    실시간 카메라 프리뷰 피드백을 제공합니다.
    
    - 밝기 적절성 검사
    - 백색 기준물(A4 용지 등) 감지 여부 확인
    - 촬영 준비 상태(is_ready) 및 안내 메시지 반환
    - 가이드라인이 그려진 프리뷰 이미지를 base64로 반환
    """
    if matcher is None:
        raise HTTPException(status_code=503, detail="SDK가 초기화되지 않았습니다.")

    tmp_path = None
    try:
        tmp_path = save_upload_to_temp(frame)

        # 이미지를 numpy 배열로 로드 (BGR)
        img = cv2.imread(tmp_path)
        if img is None:
            raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다.")

        # SDK 카메라 가이드 UI 처리
        guided_frame, status = matcher.get_live_feedback(img)

        # 가이드 이미지를 JPEG로 인코딩 후 base64 변환
        _, buffer = cv2.imencode(".jpg", guided_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        guided_base64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "success": True,
            "is_ready": status.get("is_ready", False),
            "message": status.get("message", ""),
            "status_color": status.get("color", "red"),
            "guided_frame_base64": guided_base64,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"카메라 피드백 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_temp_files(tmp_path)


@app.get("/api/db/status")
async def db_status():
    """로컬 DB에 등록된 자재 수를 반환합니다."""
    try:
        conn = init_database()
        total = get_total_count(conn)
        conn.close()
        return {
            "success": True,
            "total_materials": total,
            "db_path": SQLITE_DB_PATH,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 직접 실행 ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
