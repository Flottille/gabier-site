# gabier.sh

The website and documentation for [Gabier](https://github.com/Flottille/gabier), a small Rust daemon that
notifies Discord or Slack on SSH logins.

Astro 5, Tailwind v4, statically generated. No client framework, ~3 kB of JavaScript on the heaviest page.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site into dist/, then the Pagefind index
npm run preview   # serve dist/ exactly as production does
```

## Layout

```
src/
  config/site.ts        project facts: URLs, repo, version, measured figures
  config/shiki-theme.ts the code-highlighting theme, in the brand palette
  content/docs/*.mdx    the documentation; frontmatter drives nav and SEO
  content.config.ts     the docs collection schema
  components/           Astro components, no framework
  layouts/              BaseLayout (marketing) and DocsLayout (sidebar + TOC)
  lib/jsonld.ts         structured-data builders
  lib/docs.ts           docs ordering, grouping and URLs
  pages/                one file per route; docs/[...slug] renders the collection
  styles/global.css     Tailwind theme tokens, base layer, prose
scripts/og.mjs          generates favicons and the Open Graph cards
public/                 fonts, icons, OG images, CNAME, headers
maquette/               the original static mockup this site was built from
```

**Everything project-specific lives in `src/config/site.ts`** — the domain, the repository, the version, the
navigation. Change it there and the whole site follows.

## Writing documentation

Add an `.mdx` file under `src/content/docs/`. The frontmatter is validated at build time:

```yaml
---
title: Throttling              # <h1> and <title>
navTitle: Throttling           # optional shorter sidebar label
eyebrow: Reference             # optional kicker above the <h1>
description: 40–300 chars      # meta description, required
group: Reference               # Getting started | Reference | Channels | More
order: 2                       # position in the group, and in prev/next
faq:                           # optional, emits FAQPage structured data
  - q: …
    a: …
---
```

The sidebar, the prev/next links, the table of contents, the sitemap and the search index all follow from
that. `index.mdx` is the section landing page and owns `/docs/` itself.

Markdown code fences are highlighted with the brand Shiki theme and get a copy button automatically. Tables
are wrapped in a scroll container by a rehype plugin, so a wide reference table never widens the page.

## SEO

- Canonical URL, Open Graph and Twitter tags on every page, from one `<Seo>` component.
- JSON-LD: `SoftwareApplication`, `WebSite`, `BreadcrumbList`, `HowTo` on the install pages, `TechArticle` on
  every docs page, and `FAQPage` where the frontmatter declares one.
- `sitemap-index.xml` with per-section priorities, and a generated `robots.txt`.
- Per-page 1200×630 Open Graph cards, committed under `public/og/`.
- Clean directory URLs with a trailing slash, enforced by `trailingSlash: 'always'`.

Regenerate the cards and icons after a copy change:

```sh
npm run og
```

It lays out the text with satori and rasterises with sharp, so no font has to be installed on the machine.

## Fonts

Space Grotesk and IBM Plex Mono are self-hosted from `public/fonts/`, copied out of the `@fontsource`
packages. Only the latin and latin-ext subsets, at the weights actually used. To refresh them after a
`@fontsource` upgrade:

```sh
cp node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-{500,700}-normal.woff2 public/fonts/
cp node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-ext-{500,700}-normal.woff2 public/fonts/
cp node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-{400,500}-normal.woff2 public/fonts/
cp node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-{400,500}-normal.woff2 public/fonts/
```

## Search

Documentation search is [Pagefind](https://pagefind.app): a static index built from `dist/` after the Astro
build, over the elements marked `data-pagefind-body`. It therefore **only works in a production build** —
in `astro dev` the search box says so rather than failing.

```sh
npm run build && npm run preview
```

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`, on every push to `main`. The custom domain comes from
`public/CNAME`; point `gabier.sh` at GitHub Pages with:

| Record | Name | Value |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153`, `8001::153`, `8002::153`, `8003::153` |
| `CNAME` | `www` | `Flottille.github.io` |

Then in the repository: **Settings → Pages → Custom domain → gabier.sh**, and tick **Enforce HTTPS** once
the certificate is issued.

`netlify.toml` and `public/_headers` are there if the site ever moves to Netlify or Cloudflare Pages; they
carry the security headers and the cache policy, which GitHub Pages ignores.

## Before the first deploy

- [ ] Measure the binary and fill in `STATS` in `src/config/site.ts` — the build warns while `[X]` is still
      there.
- [ ] Point the DNS at GitHub Pages and set the custom domain.
