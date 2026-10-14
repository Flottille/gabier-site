import type { APIRoute } from "astro";
import { SITE } from "../config/site";

/**
 * Generated rather than static, so the sitemap URL always matches `site`
 * in astro.config.ts.
 */
export const GET: APIRoute = () =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${SITE.url}/sitemap-index.xml`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
