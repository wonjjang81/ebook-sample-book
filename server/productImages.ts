import { getAdminUser, isMutationOriginAllowed, type AppEnvironment } from './auth';
import { apiError, json } from './http';

const ORIGINAL_MAX_BYTES = 20 * 1024 * 1024;
const THUMB_MAX_BYTES = 2 * 1024 * 1024;
const RETENTION_SECONDS = 30 * 24 * 60 * 60;
const RESERVATION_SECONDS = 10 * 60;
// Keep a 2 GB margin below Cloudflare R2's 10 GB-month free allowance.
export const IMAGE_STORAGE_LIMIT_BYTES = 8_000_000_000;

export function isWithinImageStorageLimit(usedBytes: number, incomingBytes: number): boolean {
  return Number.isSafeInteger(usedBytes)
    && Number.isSafeInteger(incomingBytes)
    && usedBytes >= 0
    && incomingBytes > 0
    && usedBytes + incomingBytes <= IMAGE_STORAGE_LIMIT_BYTES;
}

export function validateProductId(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) throw new Error('올바르지 않은 제품 ID입니다.');
  return value;
}

export function validateImageFile(bytes: Uint8Array, declaredType: string, maxBytes: number): 'jpg' | 'png' | 'webp' {
  if (!bytes.byteLength || bytes.byteLength > maxBytes) throw new Error('이미지 용량 제한을 초과했습니다.');
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (declaredType === 'image/jpeg' && isJpeg) return 'jpg';
  if (declaredType === 'image/png' && isPng) return 'png';
  if (declaredType === 'image/webp' && isWebp) return 'webp';
  throw new Error('지원하지 않거나 실제 내용과 선언이 다른 이미지 형식입니다.');
}

interface CurrentImageRow {
  product_id: string;
  version: string;
  original_key: string;
  thumb_key: string;
  original_type: string;
  thumb_type: string;
}

function publicImageRecord(row: CurrentImageRow) {
  const encodedId = encodeURIComponent(row.product_id);
  const encodedVersion = encodeURIComponent(row.version);
  return {
    version: row.version,
    thumbUrl: `/api/product-images/${encodedId}/${encodedVersion}/thumb`,
    originalUrl: `/api/product-images/${encodedId}/${encodedVersion}/original`,
  };
}

async function listImages(environment: AppEnvironment): Promise<Response> {
  const result = await environment.DB.prepare(
    `SELECT p.product_id, p.active_version AS version, v.original_key, v.thumb_key, v.original_type, v.thumb_type
     FROM product_images p
     JOIN product_image_versions v ON v.product_id = p.product_id AND v.version = p.active_version
     WHERE p.deleted_at IS NULL AND v.status = 'active'`,
  ).all<CurrentImageRow>();
  const images = Object.fromEntries(result.results.map((row) => [row.product_id, publicImageRecord(row)]));
  return json({ images }, { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=60' } });
}

async function readImage(
  request: Request,
  environment: AppEnvironment,
  productId: string,
  version: string,
  variant: 'thumb' | 'original',
): Promise<Response> {
  const edgeCache = typeof caches === 'undefined'
    ? undefined
    : (caches as CacheStorage & { default?: Cache }).default;
  if (edgeCache) {
    const cached = await edgeCache.match(request);
    if (cached) return cached;
  }

  const row = await environment.DB.prepare(
    `SELECT p.product_id, p.active_version AS version, v.original_key, v.thumb_key, v.original_type, v.thumb_type
     FROM product_images p
     JOIN product_image_versions v ON v.product_id = p.product_id AND v.version = p.active_version
     WHERE p.product_id = ? AND p.active_version = ? AND p.deleted_at IS NULL AND v.status = 'active'`,
  ).bind(productId, version).first<CurrentImageRow>();
  if (!row) return apiError(404, '등록된 이미지를 찾을 수 없습니다.');
  const key = variant === 'thumb' ? row.thumb_key : row.original_key;
  const object = await environment.BUCKET.get(key);
  if (!object) return apiError(404, '저장된 이미지 파일을 찾을 수 없습니다.');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  const response = new Response(object.body, { headers });
  if (edgeCache) {
    try {
      await edgeCache.put(request, response.clone());
    } catch (error) {
      console.warn('Product image edge cache write failed', error);
    }
  }
  return response;
}

async function purgeExpiredVersions(environment: AppEnvironment, now: number): Promise<void> {
  const expired = await environment.DB.prepare(
    `SELECT product_id, version, original_key, thumb_key
     FROM product_image_versions
     WHERE status != 'active' AND retained_until IS NOT NULL AND retained_until <= ?
     LIMIT 20`,
  ).bind(now).all<{ product_id: string; version: string; original_key: string; thumb_key: string }>();
  for (const row of expired.results) {
    try {
      await Promise.all([environment.BUCKET.delete(row.original_key), environment.BUCKET.delete(row.thumb_key)]);
      await environment.DB.prepare(
        `DELETE FROM product_image_versions WHERE product_id = ? AND version = ? AND status != 'active'`,
      ).bind(row.product_id, row.version).run();
    } catch (error) {
      // Keep the database reservation while any R2 object may still exist.
      console.warn('Expired product image cleanup failed', error);
    }
  }
}

async function imageStorageUsage(request: Request, environment: AppEnvironment): Promise<Response> {
  const user = await getAdminUser(request, environment);
  if (!user) return apiError(401, '관리자 로그인이 필요합니다.');
  const row = await environment.DB.prepare(
    `SELECT COALESCE(SUM(original_size + thumb_size), 0) AS used_bytes
     FROM product_image_versions
     WHERE status IN ('active', 'pending', 'replaced', 'deleted', 'orphaned')`,
  ).first<{ used_bytes: number }>();
  const usedBytes = Number(row?.used_bytes ?? 0);
  return json({
    usedBytes,
    limitBytes: IMAGE_STORAGE_LIMIT_BYTES,
    availableBytes: Math.max(0, IMAGE_STORAGE_LIMIT_BYTES - usedBytes),
  });
}

async function uploadImage(request: Request, environment: AppEnvironment, productId: string): Promise<Response> {
  if (!isMutationOriginAllowed(request, environment)) return apiError(403, '허용되지 않은 요청 출처입니다.');
  const user = await getAdminUser(request, environment);
  if (!user) return apiError(401, '관리자 로그인이 필요합니다.');
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > ORIGINAL_MAX_BYTES + THUMB_MAX_BYTES + 1024 * 1024) return apiError(413, '업로드 용량 제한을 초과했습니다.');

  const form = await request.formData();
  const original = form.get('original');
  const thumb = form.get('thumb');
  if (!(original instanceof File) || !(thumb instanceof File)) return apiError(400, '원본과 썸네일 이미지가 모두 필요합니다.');
  const originalBytes = new Uint8Array(await original.arrayBuffer());
  const thumbBytes = new Uint8Array(await thumb.arrayBuffer());
  let originalExtension: 'jpg' | 'png' | 'webp';
  let thumbExtension: 'jpg' | 'png' | 'webp';
  try {
    originalExtension = validateImageFile(originalBytes, original.type, ORIGINAL_MAX_BYTES);
    thumbExtension = validateImageFile(thumbBytes, thumb.type, THUMB_MAX_BYTES);
  } catch (error) {
    const message = error instanceof Error ? error.message : '이미지 파일을 확인할 수 없습니다.';
    return apiError(message.includes('용량') ? 413 : 400, message);
  }

  const version = crypto.randomUUID();
  const prefix = `product-images/${productId}/${version}`;
  const originalKey = `${prefix}/original.${originalExtension}`;
  const thumbKey = `${prefix}/thumb.${thumbExtension}`;
  const now = Math.floor(Date.now() / 1000);
  const incomingBytes = original.size + thumb.size;
  await purgeExpiredVersions(environment, now);
  let reserved = false;
  try {
    const reservation = await environment.DB.prepare(
      `INSERT INTO product_image_versions
        (product_id, version, original_key, thumb_key, original_type, thumb_type, original_size, thumb_size, status, retained_until, created_by, created_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?
       WHERE COALESCE((
         SELECT SUM(original_size + thumb_size)
         FROM product_image_versions
         WHERE status IN ('active', 'pending', 'replaced', 'deleted', 'orphaned')
       ), 0) + ? <= ?`,
    ).bind(
      productId,
      version,
      originalKey,
      thumbKey,
      original.type,
      thumb.type,
      original.size,
      thumb.size,
      now + RESERVATION_SECONDS,
      user.id,
      now,
      incomingBytes,
      IMAGE_STORAGE_LIMIT_BYTES,
    ).run();
    if (!reservation.meta.changes) {
      return apiError(413, '서버 이미지 저장 한도(8GB)에 도달했거나 공간이 부족합니다. 보관 중인 이전 이미지가 정리된 뒤 다시 시도해 주세요.');
    }
    reserved = true;

    await Promise.all([
      environment.BUCKET.put(originalKey, originalBytes, { httpMetadata: { contentType: original.type } }),
      environment.BUCKET.put(thumbKey, thumbBytes, { httpMetadata: { contentType: thumb.type } }),
    ]);
    const current = await environment.DB.prepare(
      `SELECT active_version FROM product_images WHERE product_id = ? AND deleted_at IS NULL`,
    ).bind(productId).first<{ active_version: string }>();
    const statements = [];
    if (current) {
      statements.push(environment.DB.prepare(
        `UPDATE product_image_versions
         SET status = 'replaced', retained_until = ?
         WHERE product_id = ? AND version = ? AND status = 'active'`,
      ).bind(now + RETENTION_SECONDS, productId, current.active_version));
    }
    statements.push(environment.DB.prepare(
      `UPDATE product_image_versions
       SET status = 'active', retained_until = NULL
       WHERE product_id = ? AND version = ? AND status = 'pending'`,
    ).bind(productId, version));
    statements.push(environment.DB.prepare(
      `INSERT INTO product_images (product_id, active_version, updated_by, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT(product_id) DO UPDATE SET active_version = excluded.active_version, updated_by = excluded.updated_by, updated_at = excluded.updated_at, deleted_at = NULL`,
    ).bind(productId, version, user.id, now));
    statements.push(environment.DB.prepare(
      `INSERT INTO audit_events (id, user_id, action, target_type, target_id, detail, created_at)
       VALUES (?, ?, ?, 'product_image', ?, ?, ?)`,
    ).bind(crypto.randomUUID(), user.id, current ? 'replace_image' : 'upload_image', productId, JSON.stringify({ version }), now));
    await environment.DB.batch(statements);
    await purgeExpiredVersions(environment, now);
  } catch (error) {
    const cleanup = await Promise.allSettled([environment.BUCKET.delete(originalKey), environment.BUCKET.delete(thumbKey)]);
    if (reserved && cleanup.every((result) => result.status === 'fulfilled')) {
      await environment.DB.prepare(
        `DELETE FROM product_image_versions WHERE product_id = ? AND version = ? AND status = 'pending'`,
      ).bind(productId, version).run();
    } else if (reserved) {
      await environment.DB.prepare(
        `UPDATE product_image_versions SET status = 'orphaned', retained_until = ?
         WHERE product_id = ? AND version = ? AND status = 'pending'`,
      ).bind(now + RETENTION_SECONDS, productId, version).run();
    }
    console.error('Product image upload failed', error);
    return apiError(500, '이미지를 서버에 저장하지 못했습니다. 기존 이미지는 유지됩니다.');
  }
  return json({ image: publicImageRecord({
    product_id: productId,
    version,
    original_key: originalKey,
    thumb_key: thumbKey,
    original_type: original.type,
    thumb_type: thumb.type,
  }) });
}

async function deleteImage(request: Request, environment: AppEnvironment, productId: string): Promise<Response> {
  if (!isMutationOriginAllowed(request, environment)) return apiError(403, '허용되지 않은 요청 출처입니다.');
  const user = await getAdminUser(request, environment);
  if (!user) return apiError(401, '관리자 로그인이 필요합니다.');
  const now = Math.floor(Date.now() / 1000);
  const current = await environment.DB.prepare(
    `SELECT active_version FROM product_images WHERE product_id = ? AND deleted_at IS NULL`,
  ).bind(productId).first<{ active_version: string }>();
  if (!current) return apiError(404, '삭제할 서버 이미지가 없습니다.');
  await environment.DB.batch([
    environment.DB.prepare(
      `UPDATE product_image_versions SET status = 'deleted', retained_until = ?
       WHERE product_id = ? AND version = ? AND status = 'active'`,
    ).bind(now + RETENTION_SECONDS, productId, current.active_version),
    environment.DB.prepare(
      `UPDATE product_images SET deleted_at = ?, updated_by = ?, updated_at = ? WHERE product_id = ?`,
    ).bind(now, user.id, now, productId),
    environment.DB.prepare(
      `INSERT INTO audit_events (id, user_id, action, target_type, target_id, detail, created_at)
       VALUES (?, ?, 'delete_image', 'product_image', ?, ?, ?)`,
    ).bind(crypto.randomUUID(), user.id, productId, JSON.stringify({ version: current.active_version }), now),
  ]);
  await purgeExpiredVersions(environment, now);
  return json({ deleted: true });
}

export async function handleProductImageRequest(request: Request, environment: AppEnvironment): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/product-images') return listImages(environment);
  if (request.method === 'GET' && url.pathname === '/api/product-images/usage') return imageStorageUsage(request, environment);
  const match = url.pathname.match(/^\/api\/product-images\/([^/]+)(?:\/([^/]+)\/(thumb|original))?$/);
  if (!match) return null;
  let productId: string;
  try {
    productId = validateProductId(decodeURIComponent(match[1]));
  } catch (error) {
    return apiError(400, error instanceof Error ? error.message : '올바르지 않은 제품 ID입니다.');
  }
  if (request.method === 'GET' && match[2] && match[3]) return readImage(request, environment, productId, match[2], match[3] as 'thumb' | 'original');
  if (request.method === 'POST' && !match[2]) return uploadImage(request, environment, productId);
  if (request.method === 'DELETE' && !match[2]) return deleteImage(request, environment, productId);
  return apiError(405, '지원하지 않는 요청 방식입니다.');
}
