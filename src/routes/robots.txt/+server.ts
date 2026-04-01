import { PUBLIC_DOMAIN } from "$env/static/public";

export const prerender = true;

export function GET() {
  const body = `User-agent: *\nSitemap: https://${PUBLIC_DOMAIN}/sitemap.xml`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
