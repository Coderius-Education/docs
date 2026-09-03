import { ROUTES } from '$lib/routes';
import { HOME } from '@coderius/shared/sites';

export const prerender = true;

export function GET() {
  const base = HOME.url.replace(/\/+$/, '');
  const urls = ROUTES.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
