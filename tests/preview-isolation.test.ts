import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('../server/sites', () => ({ default: { fetch: vi.fn(async () => new Response('forwarded')) } }));
import preview from '../server/preview';
import type { AppEnvironment } from '../server/auth';

describe('Preview 이미지 격리', () => {
  const env = {} as AppEnvironment;
  afterEach(() => vi.unstubAllGlobals());
  it('배포 설정은 공개 Worker 조회를 허용하되 운영 DB/R2를 바인딩하지 않는다', () => {
    const config = JSON.parse(readFileSync(new URL('../wrangler.preview.jsonc', import.meta.url), 'utf8'));
    expect(config.compatibility_flags).toContain('global_fetch_strictly_public');
    expect(config.r2_buckets).toBeUndefined();
    expect(config.d1_databases[0].database_name).toBe('ebook-sample-book-preview-db');
  });
  it('업로드와 삭제는 서버에 전달하지 않고 차단한다', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const result = await preview.fetch(new Request('https://preview.test/api/product-images/test', { method }), env);
      expect(result.status).toBe(403);
    }
  });
  it('공개 이미지 목록만 운영에서 읽고 인증정보와 쿼리는 전달하지 않는다', async () => {
    const fetchMock = vi.fn(async () => new Response('{"images":{}}', { headers: { 'set-cookie': 'unsafe=value' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await preview.fetch(new Request('https://preview.test/api/product-images?token=test', { headers: { cookie: 'private=value', authorization: 'Bearer private' } }), env);
    expect(await result.text()).toBe('{"images":{}}');
    expect(result.headers.has('set-cookie')).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('https://ebook-sample-book.tubebluemoon.workers.dev/api/product-images', { method: 'GET', redirect: 'manual' });
  });
  it('썸네일 HEAD는 공개 GET으로 확인하고 본문을 반환하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('image', { headers: { 'content-type': 'image/jpeg' } })));
    const result = await preview.fetch(new Request('https://preview.test/api/product-images/primo-99705-1/version-1/thumb', { method: 'HEAD' }), env);
    expect(result.status).toBe(200);
    expect(result.headers.get('content-type')).toBe('image/jpeg');
    expect(await result.text()).toBe('');
  });
  it('운영의 관리자 조회 경로는 프록시하지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await (await preview.fetch(new Request('https://preview.test/api/product-images/usage'), env)).text()).toBe('forwarded');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('운영 리디렉션 및 네트워크 오류는 실패로 처리한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://other.test' } })));
    expect((await preview.fetch(new Request('https://preview.test/api/product-images'), env)).status).toBe(502);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect((await preview.fetch(new Request('https://preview.test/api/product-images'), env)).status).toBe(502);
  });
  it('로그인·로그아웃 경로는 기존 인증 처리기를 유지한다', async () => {
    expect(await (await preview.fetch(new Request('https://preview.test/api/auth/logout', { method: 'POST' }), env)).text()).toBe('forwarded');
  });
});
