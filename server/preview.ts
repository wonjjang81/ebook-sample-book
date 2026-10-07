import worker from './sites';
import { type AppEnvironment } from './auth';

// Preview must never write image objects or bind the production R2 bucket.
export default {
  async fetch(request: Request, environment: AppEnvironment): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/product-images') && !['GET', 'HEAD'].includes(request.method)) {
      return Response.json({ error: 'Preview에서는 이미지 변경이 비활성화되어 있습니다.' }, { status: 403 });
    }
    return worker.fetch(request, environment);
  },
};
