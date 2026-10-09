// Corre antes que los archivos estáticos: si una app de IA le habla a la raíz (https://<app>/) como
// servidor MCP, se manda a /mcp. El navegador (GET normal) sigue viendo la web.
export const config = { matcher: '/' };
export default function middleware(req) {
  const accept = req.headers.get('accept') || '';
  if (!['GET', 'HEAD'].includes(req.method) || accept.includes('text/event-stream')) {
    return new Response(null, { headers: { 'x-middleware-rewrite': new URL('/api/index?route=mcp&at=root', req.url).toString() } });
  }
}
