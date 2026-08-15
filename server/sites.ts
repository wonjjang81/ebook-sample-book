interface SitesEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, environment: SitesEnvironment): Promise<Response> {
    const response = await environment.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const url = new URL(request.url);
    return environment.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};
