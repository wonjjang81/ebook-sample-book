import { describe, expect, it, vi } from 'vitest';
vi.mock('../server/sites', () => ({ default: { fetch: vi.fn(async () => new Response('forwarded')) } }));
import preview from '../server/preview';
import type { AppEnvironment } from '../server/auth';

describe('Preview 이미지 격리', () => {
  const env = {} as AppEnvironment;
  it('업로드와 삭제는 서버에 전달하지 않고 차단한다', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const result = await preview.fetch(new Request('https://preview.test/api/product-images/test', { method }), env);
      expect(result.status).toBe(403);
    }
  });
  it('공개 이미지 조회는 기존 처리기로 전달한다', async () => {
    expect(await (await preview.fetch(new Request('https://preview.test/api/product-images'), env)).text()).toBe('forwarded');
  });
  it('로그인·로그아웃 경로는 기존 인증 처리기를 유지한다', async () => {
    expect(await (await preview.fetch(new Request('https://preview.test/api/auth/logout', { method: 'POST' }), env)).text()).toBe('forwarded');
  });
});
