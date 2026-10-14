import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { rehypeTableScroll } from './src/lib/rehype-table-scroll.mjs';
import type { AstroIntegration } from 'astro';

import { SITE, STATS } from './src/config/site';
import { gabierDark } from './src/config/shiki-theme';

/** Shouts if a placeholder figure is still in place, so it cannot ship unnoticed. */
const placeholderCheck: AstroIntegration = {
  name: 'gabier:placeholder-check',
  hooks: {
    'astro:build:done': ({ logger }) => {
      const unmeasured = Object.entries(STATS)
        .filter(([, value]) => value.includes('[X]'))
        .map(([key]) => key);

      if (unmeasured.length > 0) {
        logger.warn(`STATS in src/config/site.ts is still unmeasured: ${unmeasured.join(', ')}`);
      }
    },
  },
};

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  build: { format: 'directory' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        // The landing page is the entry point; docs and feature pages come next.
        if (item.url === `${SITE.url}/`) return { ...item, priority: 1.0 };
        if (item.url.includes('/docs/')) return { ...item, priority: 0.7 };
        return { ...item, priority: 0.8 };
      },
    }),
    placeholderCheck,
  ],
  markdown: {
    shikiConfig: {
      theme: gabierDark,
      wrap: false,
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { class: 'heading-anchor', ariaHidden: 'true', tabIndex: -1 },
          content: { type: 'text', value: '#' },
        },
      ],
      rehypeTableScroll,
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },

  experimental: {
    /**
     * Astro emits the policy as a <meta> tag and hashes its own inline scripts,
     * which a hand-written header cannot do: those hashes change every build.
     *
     * `wasm-unsafe-eval` and `worker-src` are for Pagefind, which instantiates
     * WebAssembly inside a Web Worker to run the docs search.
     *
     * frame-ancestors cannot be set from a meta tag; it lives in public/_headers.
     */
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", "'wasm-unsafe-eval'"],
      },
      styleDirective: {
        // style="" attributes cannot be hashed, so they need unsafe-inline.
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
});
