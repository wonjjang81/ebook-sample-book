import { handleAuthRequest, type AppEnvironment } from './auth';
import { handleProductImageRequest } from './productImages';

export default {
  async fetch(request: Request, environment: AppEnvironment): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        const authResponse = await handleAuthRequest(request, environment);
        if (authResponse) return authResponse;
        const imageResponse = await handleProductImageRequest(request, environment);
        if (imageResponse) return imageResponse;
        return new Response(JSON.stringify({ error: 'API 경로를 찾을 수 없습니다.' }), {
          status: 404,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        });
      } catch (error) {
        console.error('API request failed', error);
        return new Response(JSON.stringify({ error: '서버 요청 처리 중 오류가 발생했습니다.' }), {
          status: 500,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        });
      }
    }
    const response = await environment.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    return environment.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};
