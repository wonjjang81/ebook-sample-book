/**
 * 제품 이미지 업로드/저장/조회 훅
 *
 * - 업로드된 이미지는 localStorage에 두 가지 버전으로 저장
 *   - `img_thumb_{productId}` : 400×400 리사이즈 (카드/썸네일용)
 *   - `img_orig_{productId}`  : 원본 해상도 (확대보기용)
 * - 저장된 이미지가 없으면 기본 이미지 경로(defaultSrc) 반환
 */

const THUMB_SIZE = 400; // 썸네일 최대 크기 (px)
const QUALITY = 0.88;   // JPEG 품질

/** Canvas로 이미지를 지정 크기로 리사이즈하여 base64 반환 */
function resizeImage(
  file: File,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      let w = width;
      let h = height;
      if (w > maxSize || h > maxSize) {
        if (w >= h) {
          h = Math.round((h / w) * maxSize);
          w = maxSize;
        } else {
          w = Math.round((w / h) * maxSize);
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** 원본 이미지를 base64로 읽기 */
function readOriginal(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** localStorage 키 */
const thumbKey = (id: string) => `img_thumb_${id}`;
const origKey  = (id: string) => `img_orig_${id}`;

/** 저장된 썸네일 이미지 조회 (없으면 null) */
export function getStoredThumb(productId: string): string | null {
  try { return localStorage.getItem(thumbKey(productId)); }
  catch { return null; }
}

/** 저장된 원본 이미지 조회 (없으면 null) */
export function getStoredOrig(productId: string): string | null {
  try { return localStorage.getItem(origKey(productId)); }
  catch { return null; }
}

/** 카드/목록에 표시할 이미지 조회 (업로드 썸네일 우선) */
export function getProductThumb(productId: string, defaultSrc = ''): string {
  const storedThumb = getStoredThumb(productId);
  if (storedThumb) return storedThumb;
  if (!defaultSrc || !defaultSrc.startsWith('/') || defaultSrc.startsWith('//')) return defaultSrc;
  if (defaultSrc.startsWith(import.meta.env.BASE_URL)) return defaultSrc;
  return `${import.meta.env.BASE_URL}${defaultSrc.slice(1)}`;
}

/** 업로드된 이미지를 리사이즈 + 원본 모두 localStorage에 저장 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ thumb: string; orig: string }> {
  const [thumb, orig] = await Promise.all([
    resizeImage(file, THUMB_SIZE, QUALITY),
    readOriginal(file),
  ]);
  try {
    localStorage.setItem(thumbKey(productId), thumb);
    localStorage.setItem(origKey(productId), orig);
  } catch (e) {
    // localStorage 용량 초과 시 원본만 제거하고 썸네일만 유지
    console.warn('localStorage quota exceeded, storing thumb only');
    localStorage.setItem(thumbKey(productId), thumb);
  }
  return { thumb, orig };
}

/** 저장된 이미지 삭제 (기본 이미지로 복원) */
export function deleteProductImage(productId: string): void {
  localStorage.removeItem(thumbKey(productId));
  localStorage.removeItem(origKey(productId));
}
