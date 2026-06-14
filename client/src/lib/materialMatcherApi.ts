/**
 * Material Matcher API 클라이언트
 * FastAPI 서버(포트 8000)와 통신하여 AI 자재 검색 기능을 제공합니다.
 */

// API 서버 기본 URL (환경변수로 설정 가능)
const API_BASE_URL =
  (import.meta.env.VITE_MATCHER_API_URL as string) || "http://localhost:8000";

/** 검색 결과 단일 자재 타입 */
export interface MatchedMaterial {
  id: number;
  code: string;
  name: string;
  brand: string;
  category: string;
  color_tags: string;
  pattern_tag: string;
  thumbnail: string;
  vector_id: number;
  similarity_score: number;
}

/** 단일/앙상블 검색 응답 타입 */
export interface MatchResult {
  success: boolean;
  message?: string;
  error?: string;
  fallback_required?: boolean;
  fallback_image_base64?: string;
  results?: MatchedMaterial[];
  ensemble_count?: number;
}

/** 카메라 피드백 응답 타입 */
export interface FeedbackResult {
  success: boolean;
  is_ready: boolean;
  message: string;
  status_color: "green" | "yellow" | "red";
  guided_frame_base64?: string;
}

/** 서버 상태 응답 타입 */
export interface HealthResult {
  status: string;
  sdk_ready: boolean;
  db_material_count: number;
  message: string;
}

/**
 * 서버 상태를 확인합니다.
 */
export async function checkHealth(): Promise<HealthResult> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error("서버에 연결할 수 없습니다.");
  return res.json();
}

/**
 * 단일 이미지로 유사 자재를 검색합니다.
 * @param imageFile - 검색할 이미지 파일
 */
export async function matchSingle(imageFile: File): Promise<MatchResult> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch(`${API_BASE_URL}/api/match/single`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || "검색 중 오류가 발생했습니다.");
  }
  return data;
}

/**
 * 다중 이미지 앙상블 검색으로 정확도를 높입니다.
 * @param imageFiles - 검색할 이미지 파일 배열 (2~3장 권장)
 */
export async function matchEnsemble(imageFiles: File[]): Promise<MatchResult> {
  const formData = new FormData();
  imageFiles.forEach((file) => formData.append("images", file));

  const res = await fetch(`${API_BASE_URL}/api/match/ensemble`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || "앙상블 검색 중 오류가 발생했습니다.");
  }
  return data;
}

/**
 * 카메라 프리뷰 프레임에 대한 실시간 피드백을 요청합니다.
 * @param frameBlob - 카메라 프리뷰 프레임 (Blob)
 */
export async function getCameraFeedback(frameBlob: Blob): Promise<FeedbackResult> {
  const formData = new FormData();
  formData.append("frame", frameBlob, "frame.jpg");

  const res = await fetch(`${API_BASE_URL}/api/match/feedback`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "피드백 요청 중 오류가 발생했습니다.");
  }
  return data;
}
