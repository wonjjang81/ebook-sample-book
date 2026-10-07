import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const THUMB_SIZE = 400;
const QUALITY = 0.88;

export interface ServerProductImage {
  version: string;
  thumbUrl: string;
  originalUrl: string;
}

export type ProductImageSnapshot = Record<string, ServerProductImage>;

let serverImages: ProductImageSnapshot = {};
const thumbKey = (id: string) => `img_thumb_${id}`;
const origKey = (id: string) => `img_orig_${id}`;

function withBasePath(defaultSrc: string): string {
  if (!defaultSrc || !defaultSrc.startsWith('/') || defaultSrc.startsWith('//')) return defaultSrc;
  if (defaultSrc.startsWith(import.meta.env.BASE_URL)) return defaultSrc;
  return `${import.meta.env.BASE_URL}${defaultSrc.slice(1)}`;
}

export function getStoredThumb(productId: string): string | null {
  try { return localStorage.getItem(thumbKey(productId)); } catch { return null; }
}

export function getStoredOrig(productId: string): string | null {
  try { return localStorage.getItem(origKey(productId)); } catch { return null; }
}

export function getServerProductImage(productId: string): ServerProductImage | null {
  return serverImages[productId] ?? null;
}

export function getProductThumb(productId: string, defaultSrc = ''): string {
  return getServerProductImage(productId)?.thumbUrl ?? getStoredThumb(productId) ?? withBasePath(defaultSrc);
}

export function getProductOrig(productId: string, defaultSrc = ''): string {
  return getServerProductImage(productId)?.originalUrl ?? getStoredOrig(productId) ?? withBasePath(defaultSrc);
}

/** Prefer the original texture, retaining legacy thumbnail-only uploads. */
export function getProductPatternSrc(productId: string, defaultSrc = ''): string {
  return getServerProductImage(productId)?.originalUrl
    ?? getStoredOrig(productId) ?? getStoredThumb(productId) ?? withBasePath(defaultSrc);
}

function resizeImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      let width = image.width;
      let height = image.height;
      if (width > maxSize || height > maxSize) {
        if (width >= height) {
          height = Math.round((height / width) * maxSize);
          width = maxSize;
        } else {
          width = Math.round((width / height) * maxSize);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('이미지를 처리할 수 없습니다.'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('썸네일을 생성할 수 없습니다.')),
        'image/jpeg',
        quality,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    image.src = objectUrl;
  });
}

async function responseError(response: Response): Promise<Error> {
  try {
    const payload = await response.json() as { error?: string };
    return new Error(payload.error || '서버 요청에 실패했습니다.');
  } catch {
    return new Error('서버 요청에 실패했습니다.');
  }
}

export async function fetchProductImages(): Promise<ProductImageSnapshot> {
  const response = await fetch('/api/product-images', { credentials: 'same-origin' });
  if (!response.ok) throw await responseError(response);
  const payload = await response.json() as { images?: ProductImageSnapshot };
  serverImages = payload.images ?? {};
  return serverImages;
}

export async function uploadProductImage(productId: string, file: File): Promise<ServerProductImage> {
  const thumbnail = await resizeImage(file, THUMB_SIZE, QUALITY);
  const form = new FormData();
  form.append('original', file, file.name);
  form.append('thumb', thumbnail, `${productId}-thumb.jpg`);
  const response = await fetch(`/api/product-images/${encodeURIComponent(productId)}`, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });
  if (!response.ok) throw await responseError(response);
  const payload = await response.json() as { image: ServerProductImage };
  serverImages = { ...serverImages, [productId]: payload.image };
  try {
    localStorage.removeItem(thumbKey(productId));
    localStorage.removeItem(origKey(productId));
  } catch { /* 서버 저장 성공 후의 기존 로컬 이미지 정리 실패는 무시한다. */ }
  return payload.image;
}

export async function deleteProductImage(productId: string): Promise<void> {
  const response = await fetch(`/api/product-images/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) throw await responseError(response);
  const next = { ...serverImages };
  delete next[productId];
  serverImages = next;
  try {
    localStorage.removeItem(thumbKey(productId));
    localStorage.removeItem(origKey(productId));
  } catch { /* 무시 */ }
}

interface ProductImagesContextValue {
  images: ProductImageSnapshot;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ProductImagesContext = createContext<ProductImagesContextValue>({
  images: {}, isLoading: false, error: null, refresh: async () => undefined,
});

export function ProductImagesProvider({ children, autoLoad = true }: { children: ReactNode; autoLoad?: boolean }) {
  const [images, setImages] = useState<ProductImageSnapshot>(serverImages);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setImages(await fetchProductImages());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '서버 이미지를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => { if (autoLoad) void refresh(); }, [autoLoad, refresh]);
  return createElement(ProductImagesContext.Provider, { value: { images, isLoading, error, refresh } }, children);
}

export function useProductImages(): ProductImagesContextValue {
  return useContext(ProductImagesContext);
}

export function setProductImageSnapshotForTests(snapshot: ProductImageSnapshot): void {
  serverImages = snapshot;
}
