#!/bin/bash
# Material Matcher API 서버 시작 스크립트
# 사용법: bash start_server.sh [포트번호 (기본: 8000)]

PORT=${1:-8000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "  Material Matcher API 서버 시작"
echo "  포트: $PORT"
echo "  디렉토리: $SCRIPT_DIR"
echo "=================================================="

# 의존성 확인
python3 -c "import fastapi, uvicorn, torch, faiss, cv2" 2>/dev/null || {
  echo "[오류] 필수 패키지가 설치되지 않았습니다."
  echo "다음 명령어로 설치하세요:"
  echo "  pip3 install -r $SCRIPT_DIR/requirements.txt"
  echo "  pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cpu"
  exit 1
}

# 데이터 마이그레이션 (DB가 없거나 비어있는 경우)
DB_PATH="$SCRIPT_DIR/data/materials.db"
if [ ! -f "$DB_PATH" ]; then
  echo "[정보] DB가 없습니다. 데이터 마이그레이션을 실행합니다..."
  cd "$SCRIPT_DIR" && python3 migrate_data.py --no-faiss
fi

# 서버 실행
cd "$SCRIPT_DIR"
echo "[정보] 서버를 시작합니다 (http://0.0.0.0:$PORT)"
echo "[정보] API 문서: http://localhost:$PORT/docs"
python3 -m uvicorn api_server:app --host 0.0.0.0 --port "$PORT" --reload
