import worker from './sites';
import { type AppEnvironment } from './auth';

const PUBLIC_IMAGE_ORIGIN = 'https://ebook-sample-book.tubebluemoon.workers.dev';
const PUBLIC_IMAGE_PATH = /^\/api\/product-images\/[A-Za-z0-9][A-Za-z0-9_-]{0,127}\/[A-Za-z0-9_-]+\/(thumb|original)$/;

// Preview must never write image objects or bind the production R2 bucket.
export default {
  async fetch(request: Request, environment: AppEnvironment): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/product-images') && !['GET', 'HEAD'].includes(request.method)) {
      return Response.json({ error: 'Preview에서는 이미지 변경이 비활성화되어 있습니다.' }, { status: 403 });
    }
    if (path === '/api/product-images' || PUBLIC_IMAGE_PATH.test(path)) {
      try {
        // Only public GETs to a fixed origin. Never forward cookies, credentials,
        // query parameters, or redirects from the isolated Preview.
        const upstream = await fetch(`${PUBLIC_IMAGE_ORIGIN}${path}`, { method: 'GET', redirect: 'manual' });
        if (upstream.status >= 300 && upstream.status < 400) {
          return Response.json({ error: '이미지 서버 리디렉션이 차단되었습니다.' }, { status: 502 });
        }
        const headers = new Headers();
        for (const key of ['content-type', 'cache-control', 'etag', 'last-modified']) {
          const value = upstream.headers.get(key);
          if (value) headers.set(key, value);
        }
        headers.set('x-content-type-options', 'nosniff');
        return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
      } catch {
        return Response.json({ error: '운영 이미지를 불러오지 못했습니다.' }, { status: 502 });
      }
    }
    return worker.fetch(request, environment);
  },
};
